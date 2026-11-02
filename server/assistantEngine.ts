import { searchPropertiesFromDb, PropertyRecord } from './propertyService.js';
import { createLeadInDb } from './crmDbService.js';
import { isPostgresConfigured } from './postgres.js';
import { knowledgeService, KnowledgeSearchResult } from './knowledgeService.js';

export interface AssistantConversationContext {
  location?: string;
  bedrooms?: number;
  propertyType?: string;
  maxBudget?: number;
  minBudget?: number;
  purpose?: 'For Rent' | 'For Sale' | 'Invest' | 'Sell' | string;
  furnishing?: string;
  lifestyle?: string;
  isPaused?: boolean;
  awaitingContact?: boolean;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  preferredLanguage?: 'en' | 'ar' | 'ta' | 'tanglish';
  lastRecommendedPrice?: number;
  lastRecommendedCount?: number;
  stage?: 'greeting' | 'casual' | 'discovery' | 'searching' | 'viewing' | 'paused';
}

export interface AssistantEngineResult {
  reply: string;
  context: AssistantConversationContext;
  propertyRecommendations: any[];
  source: 'gemini' | 'ollama' | 'engine';
  handoffTriggered?: boolean;
  leadCreated?: boolean;
}

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:3b';

async function tryGenerateWithOllama(
  prompt: string,
  systemInstruction: string,
  historyText?: string
): Promise<string | null> {
  const baseUrl = (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/+$/, '');
  const model = process.env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
  const apiKey = process.env.OLLAMA_API_KEY?.trim();

  // Local Ollama is keyless by default; cloud-specific keys are optional and never required in frontend code.
  if (!baseUrl || !model) return null;

  try {
    const messages = [
      { role: 'system', content: systemInstruction },
      {
        role: 'user',
        content: historyText ? `Conversation History:\n${historyText}\n\nCustomer: ${prompt}` : prompt
      }
    ];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: 0.35,
          num_predict: 220
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Ollama returned ${response.status}: ${errBody.slice(0, 500)}`);
    }

    const data = await response.json() as any;
    const content = data?.message?.content ?? data?.response ?? null;

    if (typeof content === 'string') {
      return content.trim() || null;
    }

    if (Array.isArray(content)) {
      return content.map((part: any) => typeof part === 'string' ? part : part?.text || '').join('').trim() || null;
    }

    return null;
  } catch (error: any) {
    console.warn('[Assistant Engine] Local Ollama generation failed:', error.message);
    return null;
  }
}

// -------------------------------------------------------------
// 1. LANGUAGE DETECTION
// -------------------------------------------------------------
export function detectLanguage(text: string, currentLang: 'en' | 'ar' | 'ta' | 'tanglish' = 'en'): 'en' | 'ar' | 'ta' | 'tanglish' {
  const lower = text.toLowerCase();

  if (/(^|\s)(reply|respond|speak|talk|answer)\s+(in\s+)?english(\s+please)?$|english\s+(only|please)$/i.test(lower)) return 'en';
  if (/(^|\s)(reply|respond|speak|talk|answer)\s+(in\s+)?arabic(\s+please)?$|arabic\s+(only|please)$/i.test(lower)) return 'ar';
  if (/(^|\s)(reply|respond|speak|talk|answer)\s+(in\s+)?tamil(\s+please)?$|in\s+tamil(\s+please)?$/i.test(lower)) return 'ta';
  if (/(^|\s)(reply|respond|speak|talk|answer)\s+(in\s+)?tanglish(\s+please)?$|tanglish|vanakkam bro|kandippa|romba|eppadi|kedaikuma/i.test(lower)) return 'tanglish';

  if (/[஀-௿]/.test(text)) return 'ta';
  if (/[؀-ۿ]/.test(text)) return 'ar';

  // Tanglish distinct vocabulary check
  const tanglishRegex = /\b(vanakkam|kedaikuma|pudikkum|irukku|irukanum|kudukanum|panren|pesalam|nalla|mudiyuma|theriyum|illaiya|evalo|sollunga|romba|paakureengala|kooda|veedu|eppadi|nandri|bro|kandippa)\b/i;
  if (tanglishRegex.test(lower)) return 'tanglish';

  // Arabic transliteration
  if (lower.includes('marhaba') || lower.includes('shukran') || lower.includes('ahlan') || lower.includes('sabah al khair') || lower.includes('kayfa haluk') || lower.includes('maa salama')) return 'ar';

  return currentLang || 'en';
}

// -------------------------------------------------------------
// 2. CONVERSATIONAL INTENT ANALYSIS (ChatGPT / Gemini Style)
// -------------------------------------------------------------
export interface AnalyzedIntent {
  isGreeting: boolean;
  greetingType: 'morning' | 'afternoon' | 'evening' | 'general';
  isCasual: boolean;
  isFarewell: boolean;
  isBusy: boolean;
  isResume: boolean;
  isCheaperRequest: boolean;
  isMoreExpensiveRequest: boolean;
  isHandoffRequest: boolean;
  isLifestyleOrAdvisory: boolean;
  advisoryTopic?: 'family' | 'schools' | 'waterfront' | 'visa' | 'investment' | 'safety' | 'general_dubai' | 'buy_vs_rent' | 'fees' | 'freehold' | 'ejari' | 'mortgage' | 'fundamentals';
  isPurposeSpecification: boolean;
  detectedPurpose?: 'For Rent' | 'For Sale' | 'Invest' | 'Sell';
  isExplicitPropertySearch: boolean;
  isOutOfDomain: boolean;
  isKnowledgeQuestion: boolean;
  isJokeOrHumour: boolean;
  isStatementCorrection: boolean;
  isTopicChange: boolean;
  isShortAnswer: boolean;
  isVoiceInterruption: boolean;
  emotionCategory?: 'positive' | 'frustrated' | 'sad' | 'excited' | 'confused' | 'neutral';
}

export function analyzeIntent(message: string): AnalyzedIntent {
  const lower = message.toLowerCase().trim();

  // 0. Out of Domain Detection (medical, coding, non-real estate)
  const isOutOfDomain = /^(can you |could you |please )?(write a (python|javascript|code|script)|debug this code|solve this math|cure for|treatment for|headache|stomach ache|symptoms of|bitcoin trading|crypto trading|nfl score|football score|who won the match|recipe for|bake a cake|sing a song)/i.test(lower) ||
    /(write (python|code)|medical advice|diagnose me|prescribe medicine|crypto advice)/i.test(lower);

  // 1. Greetings
  const isMorning = /good\s*morning|sabah\s*al\s*khair|صباح الخير|காலை வணக்கம்/i.test(lower);
  const isAfternoon = /good\s*afternoon|مساء الخير|மதிய வணக்கம்/i.test(lower);
  const isEvening = /good\s*evening|مساء النور|மாலை வணக்கம்/i.test(lower);
  const isGeneralGreeting = /^(hello|hi|hey|greetings|howdy|vanakkam|marhaba|ahlan|salam|வணக்கம்|مرحبا|أهلا|سلام)(?:$|[\s!.,؟،?])/i.test(lower) ||
    /^(hi|hello|hey)[\s,]+(there|everyone|lyka|assistant|bot)?[\s!.,?]*$/i.test(lower) ||
    /^(?:vanakkam|marhaba|ahlan|salam|مرحبا|أهلا|سلام|வணக்கம்)(?:$|[\s,!?.,؟،])/i.test(lower);

  const isGreeting = isMorning || isAfternoon || isEvening || isGeneralGreeting ||
    /(?:^|\s)(hello|hi|hey|good\s*morning|good\s*evening|vanakkam|marhaba|ahlan|مرحبا|أهلا|سلام|வணக்கம்)(?:$|[!.,?\s،؟])/i.test(lower);

  const greetingType = isMorning ? 'morning' : isAfternoon ? 'afternoon' : isEvening ? 'evening' : 'general';

  // 2. Casual / Small Talk
  const isCasual = /how are you|how'?re you|how is it going|how are you doing|how'?s your day|what'?s up|who are you|what can you do|nice to meet you|thank you|thanks|you'?re great|awesome|cool|eppadi irukkeenga|kayfa haluk|كيف حالك|شو اخبارك|من انت|شكرا|எப்படி இருக்கீங்க|நலமா|நன்றி/i.test(lower) ||
    /hot day|weather|tgif|weekend|coffee|traffic|busy day/i.test(lower);

  // 2B. Farewell
  const isFarewell = /(bye|goodbye|talk\s*to\s*you\s*later|talk\s*later|see\s*ya|catch\s*you|gotta\s*run|good\s*night|signing\s*off|maa\s*salama|poitu\s*varen|போய் வருகிறேன்|مع السلامة)/i.test(lower);

  // 2C. Jokes & Light Humour
  const isJokeOrHumour = /(tell\s*me\s*a\s*joke|are\s*you\s*single|wire\s*me|replace\s*all\s*human|karak\s*chai|funny|haha|lol)/i.test(lower);

  // 2D. Statement Corrections
  const isStatementCorrection = /(wait\s*i\s*meant|actually\s*(sorry|i\s*meant)|no\s*wait|i\s*made\s*a\s*mistake|autocorrect|scratch\s*that)/i.test(lower);

  // 2E. Topic Change
  const isTopicChange = /(anyway\s*forget|by\s*the\s*way|on\s*a\s*different\s*note|changing\s*the\s*subject|never\s*mind(\s*that)?)/i.test(lower);

  // 2F. Short Answer
  const isShortAnswer = /^(yes|no|ok|cool|sure|yep|nope|nah|fine|got\s*it|makes\s*sense|maybe|alright|done|ready|true|exactly)[.!]?$/i.test(lower);

  // 2G. Voice Interruption
  const isVoiceInterruption = /(hold\s*on|wait\s*a\s*sec|kid\s*is\s*crying|knocking\s*on\s*the\s*door|speak\s*slower|connection\s*broke|battery|screen\s*went\s*black)/i.test(lower);

  // 2H. Emotion Category
  let emotionCategory: 'positive' | 'frustrated' | 'sad' | 'excited' | 'confused' | 'neutral' = 'neutral';
  if (/(infuriating|fake\s*prices|scam|terrible|sick\s*of|stop\s*giving|waste\s*my\s*time|unanswered|nobody\s*replied)/i.test(lower)) {
    emotionCategory = 'frustrated';
  } else if (/(heartbroken|disappointed|ghosted|mortgage\s*rejected|leased\s*to\s*someone|never\s*be\s*able\s*to\s*afford|homesick|lonely)/i.test(lower)) {
    emotionCategory = 'sad';
  } else if (/(excited|woohoo|unreal|stamped|bonus|can'?t\s*wait|legit\s*dope|no\s*cap|dream\s*villa)/i.test(lower)) {
    emotionCategory = 'excited';
  } else if (/(don'?t\s*understand|what\s*does\s*that\s*mean|confused|versus|\bvs\b)/i.test(lower)) {
    emotionCategory = 'confused';
  } else if (/(nice|refreshing|helpful|patient|wonderful|great|awesome)/i.test(lower)) {
    emotionCategory = 'positive';
  }

  // 3. Busy / Interruption
  const isBusy = /i'?m busy|busy now|busy right now|call you later|talk later|can'?t talk|gotta go|take care|have to go|have a meeting|in a meeting|நேரம் இல்லை|இப்ப பிஸி|مشغول الأن|مشغول حاليا|مشغول/i.test(lower);

  // 4. Resume
  const isResume = /can we continue|let'?s continue|continue|resume|i'?m back|shall we continue|மீண்டும் தொடரலாம்|تكملة|لنكمل|هل يمكننا المتابعة/i.test(lower);

  // 5. Relative budget changes
  const isCheaperRequest = /cheaper|less expensive|lower price|lower budget|reduce budget|more affordable|குறைந்த விலை|விலை குறைவான|أرخص|أقل سعراً/i.test(lower);
  const isMoreExpensiveRequest = /more expensive|higher budget|luxury|ultra luxury|higher price|அதிக பட்ஜெட்|أعلى سعراً|أفخم/i.test(lower);

  // 6. Agent viewing handoff
  const isHandoffRequest = /talk to (an? )?(human )?agent|speak (to|with) (an? )?(human )?agent|call me|contact me|(?:arrange|schedule|book)\s+(?:a\s+)?(?:private\s+)?(?:viewing|tour|visit)|human agent|property viewing|consultant|agent contact|viewing for this weekend|weekend viewing|private tour|பார்வையிட|ஆலோசகர்|تحدث مع وكيل|حجز موعد|معاينة/i.test(lower);

  // 7. Purpose Discovery (Buy, Rent, Sell, Invest) — only when stating personal search intent, not asking conceptual questions
  const isQuestionInquiry = /what is|how do|how does|can a foreigner|tell me about|explain|requirements for|is it better to|difference between|difference|versus|\bvs\b|ما هي|ما هو|كيف يتم|هل يمكن|شروط|إجراءات|என்ன நடைமுறை|எவ்வாறு|விளக்குங்கள்/i.test(lower);

  let detectedPurpose: 'For Rent' | 'For Sale' | 'Invest' | 'Sell' | undefined;
  if (!isQuestionInquiry) {
    if (/want to buy|looking to buy|like to buy|purchase|for sale|interested in buying|buying a home|buy a property|வாங்குவதற்கு|வாங்க விரும்புகிறேன்|\bشراء\b|أريد شراء/i.test(lower)) {
      detectedPurpose = 'For Sale';
    } else if (/want to rent|looking to rent|like to rent|for rent|rental property|annual rent|\blease\b|வாடகைக்கு|வாடகை வீடு|أريد استئجار|للايجار|عقار للإيجار/i.test(lower)) {
      detectedPurpose = 'For Rent';
    } else if (/invest|investment|high yield|roi|capital appreciation|முதலீடு|استثمار|عوائد/i.test(lower)) {
      detectedPurpose = 'Invest';
    } else if (/want to sell|selling my|sell property|விற்பனை செய்ய|بيع عقاري|اريد بيع/i.test(lower)) {
      detectedPurpose = 'Sell';
    }
  }
  const isPurposeSpecification = detectedPurpose !== undefined;

  // 8. Explicit Property Search (only search properties when customer wants to see them)
  const isExplicitPropertySearch = /show (me )?(properties|apartments|villas|flats|listings|residences|options)|find (me )?|what (do you have|is available|are the options)|available in|properties in|apartments in|villas in|recommend (some )?(properties|listings)|options in|available 2-bedroom|available 1-bedroom|காட்டுங்கள்|பட்டியல்|عرض العقارات|أرني العقارات|ما هي الخيارات/i.test(lower);

  // 9. Lifestyle & Domain Knowledge Topics
  let advisoryTopic: 'family' | 'schools' | 'waterfront' | 'visa' | 'investment' | 'safety' | 'general_dubai' | 'buy_vs_rent' | 'fees' | 'freehold' | 'ejari' | 'mortgage' | 'fundamentals' | undefined;
  if (/buy or rent|rent or buy|buying vs renting|renting vs buying|வாங்கலாமா அல்லது வாடகைக்கு|شراء أم استئجار|شراء ام استئجار/i.test(lower)) {
    advisoryTopic = 'buy_vs_rent';
  } else if (/transfer fee|trustee fee|dld fee|transaction cost|closing cost|brokerage commission|admin fee|கட்டணம்|செலவு|வரி|رسوم نقل|رسوم دائرة|تكاليف الشراء|رسوم أمين/i.test(lower)) {
    advisoryTopic = 'fees';
  } else if (/freehold|leasehold|foreign ownership|law no\.? 7|சொத்துரிமை|முழு உரிமை|تملك حر|تملك أجانب/i.test(lower)) {
    advisoryTopic = 'freehold';
  } else if (/ejari|tenancy contract|rental contract|security deposit|rental dispute|decree 43|எஜாரி|இஜாரி|வாடகை ஒப்பந்தம்|إيجاري|عقد إيجار|وديعة التأمين/i.test(lower)) {
    advisoryTopic = 'ejari';
  } else if (/mortgage|bank loan|financing|central bank|down payment|ltv|dbr|வங்கி கடன்|கடன் முன்பணம்|رهن عقاري|قرض عقاري|تمويل بنكي|دفعة أولى/i.test(lower)) {
    advisoryTopic = 'mortgage';
  } else if (/golden visa|10[- ]year visa|investor visa|residency requirement|கோல்டன் விசா|விசா தகுதி|إقامة ذهبية|فيزا ذهبية/i.test(lower)) {
    advisoryTopic = 'visa';
  } else if (/rental yield|yield in|roi in|gross yield|net yield|mollak|capital growth|லாபம்|வருவாய் விகிதம்|عائد إيجاري|عوائد الاستثمار/i.test(lower)) {
    advisoryTopic = 'investment';
  } else if (/family|kids|children|school|curriculum|khda|nursery|british school|ib school|குடும்பம்|பள்ளி|குழந்தைகள்|கல்வி|عائلة|أطفال|مدارس|هيئة المعرفة/i.test(lower)) {
    advisoryTopic = lower.includes('school') || lower.includes('பள்ளி') || lower.includes('مدارس') || lower.includes('khda') ? 'schools' : 'family';
  } else if (/beach|sea view|waterfront|coast|marina vibe|கடற்கரை|கடல் பார்வை|شاطئ|إطلالة بحرية|بحر/i.test(lower)) {
    advisoryTopic = 'waterfront';
  } else if (/market fundamental|tax benefit|0% tax|tax free|currency peg|d33|2040 plan|வரிகள்|வரி சலுகை|ضرائب|مزايا ضريبية|اقتصاد دبي/i.test(lower)) {
    advisoryTopic = 'fundamentals';
  } else if (/safe|safety|crime|பாதுகாப்பு|أمان|أمن/i.test(lower)) {
    advisoryTopic = 'safety';
  } else if (/moving to dubai|life in dubai|relocating|about dubai|துபாயில் வாழ்வது|العيش في دبي/i.test(lower)) {
    advisoryTopic = 'general_dubai';
  }

  const isLifestyleOrAdvisory = advisoryTopic !== undefined;
  const isKnowledgeQuestion = !isGreeting && !isCasual && (isLifestyleOrAdvisory || 
    /what is|how do|how does|can a foreigner|tell me about|explain|requirements for|is it better to|difference between|என்ன நடைமுறை|எவ்வாறு|விளக்குங்கள்|ما هو|كيف يتم|هل يمكن/i.test(lower));

  return {
    isGreeting,
    greetingType,
    isCasual,
    isFarewell,
    isBusy,
    isResume,
    isCheaperRequest,
    isMoreExpensiveRequest,
    isHandoffRequest,
    isLifestyleOrAdvisory,
    advisoryTopic,
    isPurposeSpecification,
    detectedPurpose,
    isExplicitPropertySearch,
    isOutOfDomain,
    isKnowledgeQuestion,
    isJokeOrHumour,
    isStatementCorrection,
    isTopicChange,
    isShortAnswer,
    isVoiceInterruption,
    emotionCategory
  };
}

// -------------------------------------------------------------
// 3. PARAMETER EXTRACTION (Accumulates Without Resetting)
// -------------------------------------------------------------
export function updateContextWithParameters(
  text: string,
  existingContext: AssistantConversationContext
): AssistantConversationContext {
  const updated = { ...existingContext };
  const lower = text.toLowerCase();

  // Locations
  const knownLocations = [
    'dubai marina', 'palm jumeirah', 'downtown dubai', 'jumeirah bay',
    'emirates hills', 'business bay', 'jbr', 'jumeirah beach residence',
    'jumeirah lake towers', 'jlt', 'al barsha', 'deira', 'bur dubai',
    'dubai hills', 'difc', 'mirdif', 'al quoz', 'abu dhabi', 'sharjah'
  ];
  for (const loc of knownLocations) {
    if (lower.includes(loc)) {
      if (loc === 'dubai marina') updated.location = 'Dubai Marina';
      else if (loc === 'palm jumeirah') updated.location = 'Palm Jumeirah';
      else if (loc === 'downtown dubai') updated.location = 'Downtown Dubai';
      else if (loc === 'business bay') updated.location = 'Business Bay';
      else if (loc === 'difc') updated.location = 'DIFC';
      else updated.location = loc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // Bedrooms / BHK
  if (/(?:^|\D)(?:1|one)[\s-]*(?:bed|bedroom|bhk|br\b)/i.test(lower)) updated.bedrooms = 1;
  else if (/(?:^|\D)(?:2|two)[\s-]*(?:bed|bedroom|bhk|br\b)/i.test(lower)) updated.bedrooms = 2;
  else if (/(?:^|\D)(?:3|three)[\s-]*(?:bed|bedroom|bhk|br\b)/i.test(lower)) updated.bedrooms = 3;
  else if (/(?:^|\D)(?:4|four)[\s-]*(?:bed|bedroom|bhk|br\b)/i.test(lower)) updated.bedrooms = 4;
  else if (/(?:^|\D)(?:5|five)[\s-]*(?:bed|bedroom|bhk|br\b)/i.test(lower)) updated.bedrooms = 5;
  else if (/studio/i.test(lower)) updated.bedrooms = 0;

  // Property Type
  if (lower.includes('penthouse')) updated.propertyType = 'Penthouse';
  else if (lower.includes('villa')) updated.propertyType = 'Villa';
  else if (lower.includes('townhouse')) updated.propertyType = 'Townhouse';
  else if (lower.includes('apartment') || lower.includes('flat')) updated.propertyType = 'Apartment';

  // Purpose: Rent vs Buy vs Invest
  if (/rent(\s*,?\s*not\s*buy)?/i.test(lower) && /not\s*buy/i.test(lower)) {
    updated.purpose = 'For Rent';
  } else if (/buy(\s*,?\s*not\s*rent)?/i.test(lower) && /not\s*rent/i.test(lower)) {
    updated.purpose = 'For Sale';
  } else if (/want to buy|looking to buy|purchase|for sale|buying a home/i.test(lower)) {
    updated.purpose = 'For Sale';
  } else if (/want to rent|looking to rent|for rent|rental property|annual rent|lease/i.test(lower)) {
    updated.purpose = 'For Rent';
  } else if (/invest|investment|high yield/i.test(lower)) {
    updated.purpose = 'For Sale'; // Investments in DB map to sale properties
  }

  // Furnishing
  if (lower.includes('furnished') && !lower.includes('unfurnished')) updated.furnishing = 'Furnished';
  else if (lower.includes('unfurnished')) updated.furnishing = 'Unfurnished';

  // Budget (Millions, Thousands, Raw figures)
  const budgetMillionMatch = lower.match(/(?:budget of|up to|max|under|around)?\s*(?:aed|\$)?\s*(\d+(?:\.\d+)?)\s*(?:m|million)/i);
  if (budgetMillionMatch) {
    updated.maxBudget = Math.round(parseFloat(budgetMillionMatch[1]) * 1000000);
  } else {
    const budgetKMatch = lower.match(/(?:budget of|up to|max|under|around)?\s*(?:aed|\$)?\s*(\d{2,4})\s*(?:k|thousand)/i);
    if (budgetKMatch) {
      updated.maxBudget = parseInt(budgetKMatch[1], 10) * 1000;
    } else {
      const rawNumberMatch = lower.match(/(?:budget of|up to|max|under|around|aed)\s*(?:aed|\$)?\s*([\d,]{4,10})/i);
      if (rawNumberMatch) {
        const val = parseInt(rawNumberMatch[1].replace(/,/g, ''), 10);
        if (val >= 10000) updated.maxBudget = val;
      }
    }
  }

  return updated;
}

export function extractContactDetails(text: string): { name?: string; phone?: string; email?: string } {
  const details: { name?: string; phone?: string; email?: string } = {};
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 7) {
    details.phone = phoneMatch[0].trim();
  }
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    details.email = emailMatch[0].trim();
  }
  const nameMatch = text.match(/(?:my name is|i am|this is|call me)\s+([a-zA-Z\s]{2,30})/i);
  if (nameMatch) {
    details.name = nameMatch[1].trim();
  }
  return details;
}

export function getContextSummary(ctx: AssistantConversationContext, lang: 'en' | 'ar' | 'ta' | 'tanglish'): string {
  const purpose = ctx.purpose === 'For Sale'
    ? (lang === 'ar' ? 'للبيع' : lang === 'ta' ? 'விற்பனைக்கான' : 'sale')
    : (lang === 'ar' ? 'للإيجار' : lang === 'ta' ? 'வாடகை' : 'rental');

  const beds = ctx.bedrooms !== undefined
    ? (ctx.bedrooms === 0 ? 'Studio' : `${ctx.bedrooms}-bedroom`)
    : '';

  const pType = ctx.propertyType || (lang === 'ar' ? 'عقارات' : lang === 'ta' ? 'இல்லங்கள்' : 'residences');
  const loc = ctx.location ? `in ${ctx.location}` : '';

  if (lang === 'ar') return `${pType} ${purpose} ${ctx.location ? `في ${ctx.location}` : ''} ${beds ? `(${beds})` : ''}`.trim();
  if (lang === 'ta') return `${ctx.location || 'துபாய்'} ${beds} ${pType} (${purpose})`.trim();
  return `${beds} ${purpose} ${pType} ${loc}`.trim();
}

// -------------------------------------------------------------
// 3B. RAG KNOWLEDGE BASE RESPONSE SYNTHESIZER
// -------------------------------------------------------------
export function synthesizeKnowledgeFallback(
  topic: string | undefined,
  query: string,
  lang: 'en' | 'ar' | 'ta' | 'tanglish',
  ragResults: KnowledgeSearchResult[]
): string {
  const lower = query.toLowerCase();

  // 1. Transaction Costs & Fees
  if (topic === 'fees' || lower.includes('transfer fee') || lower.includes('trustee fee') || lower.includes('dld fee') || lower.includes('closing cost') || lower.includes('கட்டணம்') || lower.includes('செலவு') || lower.includes('رسوم')) {
    if (lang === 'ar') {
      return "تبلغ رسوم نقل الملكية لدى دائرة الأراضي والأملاك (DLD) 4% من قيمة العقار بالإضافة إلى 580 درهماً لإصدار سند الملكية، ورسوم أمين التسجيل 4,000 درهم (+ 5% ضريبة) للعقارات بقيمة 500 ألف درهم فما فوق، مع عمولة وساطة 2%. [المصدر: دليل دائرة الأراضي والأملاك]. هل ترغب في حساب إجمالي تكاليف الشراء لميزانية محددة؟";
    }
    if (lang === 'ta') {
      return "துபாயில் சொத்து வாங்கும் போது நிலத் துறைக்கு (DLD) 4% மாற்றுக் கட்டணம் மற்றும் AED 580 தலைப்புப் பத்திரக் கட்டணம் செலுத்த வேண்டும். மேலும் பதிவு அறங்காவலர் கட்டணம் AED 4,000 (+ 5% VAT) மற்றும் 2% முகவர் கட்டணம் பொருந்தும். [ஆதாரம்: DLD & RERA வழிகாட்டி]. நீங்கள் குறிப்பிட்ட பட்ஜெட்டுக்கான மொத்த செலவைக் கணக்கிட உதவட்டுமா?";
    }
    return "When acquiring property in Dubai, the government transfer fee is 4.0% paid to the Dubai Land Department (DLD) plus AED 580 for the title deed. Additionally, authorized Registration Trustee offices charge AED 4,000 (+ 5% VAT) for properties of AED 500k and above, along with the standard 2% (+ VAT) brokerage commission. [Source: DLD & RERA Regulations]. Would you like me to calculate the total acquisition budget for a specific purchase price?";
  }

  // 2. Golden Visa & Residency
  if (topic === 'visa' || lower.includes('golden visa') || lower.includes('10-year visa') || lower.includes('விசா') || lower.includes('ذهبية') || lower.includes('تأشيرة')) {
    if (lang === 'ar') {
      return "تمنح دولة الإمارات إقامة ذهبية سيادية لمدة 10 سنوات للمستثمرين العقاريين بقيمة مليوني درهم فما فوق في مناطق التملك الحر، سواء في عقار واحد أو محفظة عقارية مجمعة، وتغطي الزوجة والأبناء دون شروط سنوية للبقاء داخل الدولة. [المصدر: متطلبات الإقامة الذهبية]. هل ترغب في استكشاف عقارات استثمارية مؤهلة للإقامة الذهبية؟";
    }
    if (lang === 'ta') {
      return "துபாயின் முழு உரிமை (Freehold) பகுதிகளில் AED 2,000,000 அல்லது அதற்கு மேற்பட்ட மதிப்புள்ள சொத்துக்களில் முதலீடு செய்தால் உங்களுக்கும் உங்கள் குடும்பத்தினருக்கும் 10 ஆண்டு கோல்டன் விசா வழங்கப்படுகிறது. வங்கி கடன் சொத்துக்களும் உரிய வங்கியின் அனுமதியுடன் தகுதி பெறும். [ஆதாரம்: கோல்டன் விசா வழிகாட்டி]. கோல்டன் விசா தகுதி கொண்ட சிறந்த முதலீட்டு சொத்துக்களை பார்க்க விரும்புகிறீர்களா?";
    }
    return "The UAE grants a 10-year Golden Visa for real estate investments of AED 2,000,000 or more in designated freehold zones. This covers single or aggregated properties (ready or off-plan) and extends to spouses and children with zero absence restrictions. [Source: Golden Visa Requirements]. Would you like to explore prime investment properties that qualify for the Golden Visa?";
  }

  // 3. Renting, Tenancy & Ejari
  if (topic === 'ejari' || lower.includes('ejari') || lower.includes('tenancy') || lower.includes('security deposit') || lower.includes('எஜாரி') || lower.includes('இஜாரி') || lower.includes('إيجاري')) {
    if (lang === 'ar') {
      return "يعد تسجيل عقد الإيجار عبر نظام 'إيجاري' التابع لدائرة الأراضي والأملاك إلزامياً لتوثيق العلاقة الإيجارية وحماية حقوق الطرفين. تبلغ وديعة التأمين 5% للعقارات غير المفروشة و10% للعقارات المفروشة، وترتبط بها تلقائياً خدمات هيئة كهرباء ومياه دبي (ديوا). [المصدر: دليل الإيجار والتأجير]. هل تبحث عن شقة للإيجار السنوي أم فيلا سكنية؟";
    }
    if (lang === 'ta') {
      return "துபாயில் அனைத்து வாடகை ஒப்பந்தங்களும் நிலத் துறையின் 'எஜாரி' (Ejari) அமைப்பில் பதிவு செய்யப்படுவது கட்டாயமாகும். பாதுகாப்பு வைப்புத் தொகை பொதுவாக மரச்சாமான்கள் அற்ற இல்லங்களுக்கு 5% மற்றும் மரச்சாமான்கள் உள்ள இல்லங்களுக்கு 10% ஆகும். எஜாரி பதிவு மூலம் மின்சாரம் மற்றும் தண்ணீர் இணைப்பு (DEWA) தானாக தொடங்கும். [ஆதாரம்: எஜாரி வாடகை வழிகாட்டி]. நீங்கள் அப்பார்ட்மெண்ட் அல்லது வில்லா வாடகைக்கு தேடுகிறீர்களா?";
    }
    return "All Dubai residential leases must be registered through the official DLD Ejari system to legally protect both parties. Standard security deposits are 5% of annual rent for unfurnished properties and 10% for furnished residences, and DEWA utility activation connects automatically upon Ejari issuance. [Source: Renting & Tenancy Guide]. Are you looking for a rental apartment or a family villa?";
  }

  // 4. Mortgages & Central Bank Rules
  if (topic === 'mortgage' || lower.includes('mortgage') || lower.includes('down payment') || lower.includes('ltv') || lower.includes('வங்கி கடன்') || lower.includes('رهن') || lower.includes('تمويل')) {
    if (lang === 'ar') {
      return "تسمح لوائح المصرف المركزي الإماراتي للمقيمين الأجانب بالحصول على تمويل عقاري بنسبة تصل إلى 80% من قيمة العقار الأول (دفعة أولى 20%) للعقارات حتى 5 ملايين درهم، مع حد أقصى لعبء الدين يبلغ 50% من الدخل الشهري. [المصدر: التمويل العقاري والمصرف المركزي]. هل ترغب في حساب القسط الشهري أو مناقشة خيارات التمويل؟";
    }
    if (lang === 'ta') {
      return "ஐக்கிய அரபு அமீரக மத்திய வங்கி விதிகளின்படி, வெளிநாட்டினர் AED 5 மில்லியனுக்கு உட்பட்ட முதல் இல்லத்திற்கு 80% வரை வீட்டுக் கடன் பெறலாம் (20% முன்பணம்). மாதாந்திர கடன் சுமை விகிதம் மொத்த வருமானத்தில் 50% க்குள் இருக்க வேண்டும். [ஆதாரம்: வீட்டுக் கடன் வழிகாட்டி]. நீங்கள் வங்கி கடன் மூலம் இல்லம் வாங்க திட்டமிடுகிறீர்களா?";
    }
    return "Under UAE Central Bank regulations, expatriate buyers can finance up to 80% Loan-to-Value (LTV) for first home purchases under AED 5 million, requiring a 20% down payment (or 15% for UAE nationals), with debt burden capped at 50% of gross income. [Source: UAE Mortgages & Financing]. Would you like to explore financing options or calculate estimated monthly installments?";
  }

  // 5. Freehold vs Leasehold
  if (topic === 'freehold' || lower.includes('freehold') || lower.includes('leasehold') || lower.includes('law no. 7') || lower.includes('சொத்துரிமை') || lower.includes('முழு உரிமை') || lower.includes('تملك حر')) {
    if (lang === 'ar') {
      return "بموجب القانون رقم 7 لسنة 2006، يحق للأجانب التملك الحر المطلق بنسبة 100% في المناطق المحددة مثل دبي مارينا ووسط المدينة ونخلة جميرا وتلال دبي، مع حرية البيع والتأجير والتوريث. بينما يمنح التملك الإيجاري حق الانتفاع فقط لمدة تصل إلى 99 عاماً. [المصدر: دليل التملك الحر]. هل تفضل التركيز على مناطق التملك الحر؟";
    }
    if (lang === 'ta') {
      return "துபாய் சட்டம் எண் 7 (2006)-ன் கீழ், வெளிநாட்டினர் துபாய் மரினா, டவுன்டவுன், பாம் ஜுமேரா மற்றும் துபாய் ஹில்ஸ் போன்ற அனுமதிக்கப்பட்ட முழு உரிமை (Freehold) பகுதிகளில் 100% உரிமையுடன் சொத்துக்களை வாங்கலாம். லீஸ்ஹோல்ட் என்பது 30-99 ஆண்டு குத்தகை உரிமை மட்டுமே. [ஆதாரம்: முழு உரிமை சொத்துக்கள்]. நீங்கள் முழு உரிமை (Freehold) பகுதிகளில் சொத்து வாங்க விரும்புகிறீர்களா?";
    }
    return "Under Dubai Law No. 7 of 2006, foreign nationals enjoy 100% freehold absolute ownership in designated freehold areas including Dubai Marina, Downtown Dubai, Palm Jumeirah, and Dubai Hills, granting full rights to sell, lease, or bequeath. Leasehold grants usage rights for 30 to 99 years without land ownership. [Source: Freehold vs Leasehold Guide]. Are you focusing specifically on freehold investment communities?";
  }

  // 6. Buying vs Renting Advisory
  if (topic === 'buy_vs_rent' || lower.includes('buy or rent') || lower.includes('buying vs renting') || lower.includes('rent or buy') || lower.includes('வாங்கலாமா அல்லது வாடகைக்கு') || lower.includes('شراء أم استئجار')) {
    if (lang === 'ar') {
      return "إذا كنتم تخططون للإقامة في دبي لمدة 4 سنوات، فإن الشراء يتفوق مالياً على الإيجار. تسترد تكاليف الشراء الأولية البالغة 6% إلى 7% في غضون 3 إلى 4 سنوات عبر توفير مبالغ الإيجار ونمو القيمة السوقية للعقار وتجنب الزيادات السنوية. [المصدر: دليل الشراء والاستئجار]. هل تبحثون عن استقرار سكني دائم أم الاستثمار بعد المغادرة؟";
    }
    if (lang === 'ta') {
      return "நீங்கள் 4 ஆண்டுகள் துபாயில் தங்க திட்டமிட்டிருந்தால், வாடகைக்கு இருப்பதை விட சொந்தமாக வாங்குவது நிதி ரீதியாக மிகவும் பயனளிக்கும். சொத்து வாங்குவதற்கான செலவுகள் (சுமார் 6%-7%) 3-4 ஆண்டுகளில் வாடகை சேமிப்பு மற்றும் சொத்து மதிப்பு உயர்வு மூலம் ஈடுசெய்யப்படும். [ஆதாரம்: வாங்குதல் vs வாடகை ஒப்பீடு]. நீங்கள் நீண்ட கால தங்குவதற்கு வீடு பார்க்கிறீர்களா அல்லது முதலீட்டு நோக்கில் பார்க்கிறீர்களா?";
    }
    return "If residing in Dubai for 4 years, buying typically offers superior financial returns over renting. Upfront purchasing costs of ~6% to 7% are typically amortized and recouped within 3 to 4 years through rental savings and capital appreciation, while protecting you from annual rent escalation. [Source: Buying vs Renting Advisory]. Are you looking for a long-term primary home or a future investment asset?";
  }

  // 7. Rental Yields & Investments
  if (topic === 'investment' || lower.includes('yield') || lower.includes('roi') || lower.includes('rental return') || lower.includes('லாபம்') || lower.includes('வருவாய்') || lower.includes('عائد') || lower.includes('عوائد')) {
    if (lang === 'ar') {
      return "يوفر سوق دبي العقاري عوائد إيجارية إجمالية رائدة عالمياً تتراوح بين 6% و9.5%، مدعومة بانعدام الضرائب على الدخل والأرباح الرأسمالية. تحقق قرية جميرا الدائرية (JVC) عوائد نقدية تصل إلى 7.5% - 9.2%، في حين تجمع نخلة جميرا ووسط المدينة بين العوائد الممتازة ونمو رأس المال. [المصدر: عوائد الإيجار والاستثمار]. ما هو نطاق ميزانيتكم الاستثمارية؟";
    }
    if (lang === 'ta') {
      return "துபாய் ரியல் எஸ்டேட் சர்வதேச அளவில் 6% முதல் 9.5% வரை அதிகபட்ச மொத்த வாடகை வருவாயை வழங்குகிறது, அத்துடன் மூலதன ஆதாய வரி மற்றும் வருமான வரி முற்றிலும் இல்லை. ஜுமேரா வில்லேஜ் சர்க்கிள் (JVC) 7.5% - 9.2% வருவாயையும், டவுன்டவுன் மற்றும் மரினா 5.5% - 7.5% வருவாயுடன் அதிக மூலதன மதிப்பையும் தருகின்றன. [ஆதாரம்: வாடகை வருவாய் வழிகாட்டி]. உங்கள் முதலீட்டு பட்ஜெட் எவ்வளவு?";
    }
    return "Dubai generates industry-leading gross rental yields averaging 6.0% to 9.5% alongside 0% personal income tax and 0% capital gains tax. Communities like Jumeirah Village Circle (JVC) achieve 7.5% - 9.2% gross yields, while blue-chip hubs like Downtown Dubai and Palm Jumeirah deliver 5.0% - 6.5% with strong capital appreciation. [Source: Rental Yields & Investments]. What investment budget or target return are you aiming for?";
  }

  // 8. Family Relocation & Schools
  if (topic === 'schools' || topic === 'family' || lower.includes('school') || lower.includes('family') || lower.includes('khda') || lower.includes('பள்ளி') || lower.includes('குடும்பம்') || lower.includes('مدارس') || lower.includes('عائلة')) {
    if (lang === 'ar') {
      return "تعتبر مجمعات دبي هيلز استيت والمرابع العربية أفضل الوجهات للعائلات، وتضم مدارس دولية مرموقة بتقييم 'متميز' من هيئة المعرفة (KHDA) مثل مدرسة جميرا للتخاطب بالإنجليزية (JESS) وأكاديمية جيمس ولينغتون، إلى جانب مستشفى كينغز كوليدج لندن. [المصدر: دليل العائلات والمدارس]. هل تفضلون فيلا عائلية أم تاون هاوس؟";
    }
    if (lang === 'ta') {
      return "குடும்பத்துடன் குடியேற துபாய் ஹில்ஸ் எஸ்டேட் மற்றும் அரேபியன் ரான்செஸ் மிகச் சிறந்த பகுதிகளாகும். இங்கு KHDA 'Outstanding' தரவரிசை பெற்ற JESS மற்றும் GEMS வெலிங்டன் போன்ற தலைசிறந்த சர்வதேச பள்ளிகள், பூங்காக்கள் மற்றும் கிங்ஸ் காலேஜ் மருத்துவமனை உள்ளன. [ஆதாரம்: குடும்பங்கள் மற்றும் பள்ளிகள் வழிகாட்டி]. நீங்கள் குடும்பத்திற்கு வில்லா விரும்புகிறீர்களா அல்லது டவுன்ஹவுஸ் பார்க்கிறீர்களா?";
    }
    return "For family relocation, Dubai Hills Estate and Arabian Ranches offer the ideal master-planned suburban lifestyle, featuring KHDA 'Outstanding' accredited schools like Jumeirah English Speaking School (JESS) and GEMS Wellington Academy, pedestrian parks, and King's College Hospital London. [Source: Family Relocation & Schools]. Would you prefer an independent family villa or a contemporary townhouse?";
  }

  // 8B. Waterfront Living
  if (topic === 'waterfront' || lower.includes('waterfront') || lower.includes('beach access') || lower.includes('sea view') || lower.includes('கடற்கரை') || lower.includes('بحر') || lower.includes('إطلالة بحرية')) {
    if (lang === 'ar') {
      return "توفر دبي خيارات استثنائية للحياة الشاطئية والواجهات البحرية، ولا سيما في نخلة جميرا ودبي مارينا وجميرا بيتش ريزيدنس (JBR)، حيث الإطلالات البحرية المباشرة والمراسي الفاخرة. [المصدر: دليل المجمعات السكنية]. هل تفضلون شقة بإطلالة مائية أم فيلا شاطئية خاصة؟";
    }
    if (lang === 'ta') {
      return "துபாயில் பாம் ஜுமேரா, துபாய் மரினா மற்றும் JBR ஆகியவை உலகத்தரம் வாய்ந்த கடற்கரை வாழ்க்கை முறையை வழங்குகின்றன. இவற்றில் நேரடி கடல் பார்வை மற்றும் கடற்கரை வசதிகள் உள்ளன. [ஆதாரம்: குடியிருப்பு பகுதிகள் வழிகாட்டி]. நீங்கள் வாடகைக்கு அல்லது வாங்குவதற்கு எவ்வகை இல்லத்தை விரும்புகிறீர்கள்?";
    }
    return "Dubai offers premier waterfront living across Palm Jumeirah, Dubai Marina, and JBR, featuring private beach access, yacht marinas, and panoramic sea views. [Source: Residential Communities Guide]. Would you prefer an iconic waterfront apartment or an exclusive beachfront villa?";
  }

  // 9. Market Fundamentals & Tax Benefits
  if (topic === 'fundamentals' || lower.includes('tax benefit') || lower.includes('market fundamental') || lower.includes('0% tax') || lower.includes('pegged') || lower.includes('வரி சலுகை') || lower.includes('ضرائب')) {
    if (lang === 'ar') {
      return "يتميز سوق دبي العقاري باستقرار اقتصادي فريد مع 0% ضريبة دخل شخصي، 0% ضريبة أرباح رأسمالية، وارتباط الدرهم الإماراتي الثابت بالدولار الأمريكي (3.6725)، مدعوماً بحماية تشريعية قوية وفق خطة دبي الحضرية 2040. [المصدر: أساسيات سوق دبي]. هل تبحثون عن عقار للسكن الخاص أم بهدف الاستثمار؟";
    }
    if (lang === 'ta') {
      return "துபாய் ரியல் எஸ்டேட் சந்தை 0% தனிநபர் வருமான வரி, 0% மூலதன ஆதாய வரி மற்றும் அமெரிக்க டாலருடன் நிலையாக இணைக்கப்பட்ட திர்ஹாம் (AED 3.6725) ஆகிய நிதிப் பாதுகாப்பை வழங்குகிறது. துபாய் 2040 நகர்ப்புற திட்டத்தின் கீழ் சொத்து முதலீட்டாளர்களுக்கு முழு சட்டப் பாதுகாப்பு உள்ளது. [ஆதாரம்: சந்தை அடிப்படைகள்]. நீங்கள் சொந்தமாக வசிக்க விரும்புகிறீர்களா அல்லது முதலீட்டுக்காக பார்க்கிறீர்களா?";
    }
    return "The Dubai real estate market is underpinned by 0% personal income tax, 0% capital gains tax, and the UAE Dirham permanently pegged to the US Dollar at 3.6725. Bolstered by the Dubai 2040 Urban Master Plan and rigorous RERA investor protections, Dubai remains a world-class wealth haven. [Source: Market Fundamentals]. Are you exploring residences for personal living or investment growth?";
  }

  // Fallback to top RAG result
  if (ragResults.length > 0) {
    const top = ragResults[0];
    const snippet = top.content.split('\n').filter(l => l.trim().length > 25 && !l.startsWith('#') && !l.startsWith('|')).slice(0, 2).join(' ').replace(/[#*|]/g, '').trim();
    if (lang === 'ar') {
      return `${snippet} [المصدر: ${top.docTitle}]. هل ترغب في معرفة تفاصيل إضافية حول هذا الأمر؟`;
    }
    if (lang === 'ta') {
      return `${snippet} [ஆதாரம்: ${top.docTitle}]. இந்த தலைப்பில் மேலும் விவரங்களை அறிய விரும்புகிறீர்களா?`;
    }
    return `${snippet} [Source: ${top.docTitle} - ${top.sectionTitle}]. How else may I assist you with this aspect of Dubai real estate?`;
  }

  return "Dubai's real estate framework offers exceptional investment security and lifestyle quality. Would you like to explore matching residential options or discuss specific regulations?";
}

// -------------------------------------------------------------
// 4. MAIN CONVERSATIONAL ENGINE (ChatGPT / Gemini Personality)
// -------------------------------------------------------------
export async function processAssistantTurn(
  message: string,
  existingContext: AssistantConversationContext = {},
  conversationHistory: { role: string; text: string }[] = []
): Promise<AssistantEngineResult> {
  const lang = detectLanguage(message, existingContext.preferredLanguage || 'en');
  let context: AssistantConversationContext = { ...existingContext, preferredLanguage: lang };

  const intents = analyzeIntent(message);

  // Update cumulative context with parameters mentioned in this turn
  context = updateContextWithParameters(message, context);
  if (intents.detectedPurpose) {
    context.purpose = intents.detectedPurpose === 'Invest' ? 'For Sale' : intents.detectedPurpose;
  }

  // Fixed LYKA consultation flow. Each answer advances only its corresponding
  // stage; unexpected answers are kept as context and do not skip a question.
  const scriptLower = message.toLowerCase();
  const stagedReply = (en: string, ta: string, tanglish: string): string =>
    lang === 'ta' ? ta : lang === 'tanglish' ? tanglish : en;

  if (!context.stage && /^(i('| a)m\s+)?fine|fine,?\s*thank|doing well/i.test(scriptLower)) {
    context.stage = 'greeting';
    return {
      reply: stagedReply(
        "I'm doing great, thank you for asking!",
        'நான் நன்றாக இருக்கிறேன், கேட்டதற்கு மிக்க நன்றி!',
        'Naan romba nalla irukken! Kettadhukku nandri!'
      ),
      context,
      propertyRecommendations: [],
      source: 'engine'
    };
  }

  if (/looking\s+(for\s+)?(a\s+)?property|property\s+search|சொத்து|property venum|property theva/i.test(scriptLower)) {
    context.stage = 'discovery';
    return {
      reply: stagedReply(
        "That's wonderful! Are you planning to buy or rent a property in Dubai?",
        'அருமை! துபாயில் சொத்தை வாங்க அல்லது வாடகைக்கு பார்க்கிறீர்களா?',
        'Super! Dubai la property buy panna paakkareengala illa rent edukka paakkareengala?'
      ),
      context,
      propertyRecommendations: [],
      source: 'engine'
    };
  }

  if (context.stage === 'discovery' && /buy|purchase|planning\s+to\s+buy|வாங்க/i.test(scriptLower)) {
    context.purpose = 'For Sale';
    context.stage = 'discovery';
    return {
      reply: stagedReply(
        'Great! What type of property are you interested in? An apartment, villa, or townhouse?',
        'அருமை! உங்களுக்கு apartment, villa அல்லது townhouse எந்த வகை வேண்டும்?',
        'Great! Apartment, villa, illa townhouse — enna type property venum?'
      ),
      context,
      propertyRecommendations: [],
      source: 'engine'
    };
  }

  if ((context.propertyType === undefined || context.stage === 'discovery') &&
      /\b(?:apartment|flat)\b|அடுக்குமாடி/i.test(scriptLower)) {
    context.propertyType = 'Apartment';
    context.stage = 'discovery';
    return {
      reply: stagedReply(
        'How many bedrooms would you prefer?',
        'எத்தனை bedrooms உங்களுக்கு தேவை?',
        'Neenga enna count bedrooms prefer pannuveenga?'
      ),
      context,
      propertyRecommendations: [],
      source: 'engine'
    };
  }

  if (context.propertyType === 'Apartment') {
    const bedroomsMatch = scriptLower.match(/(\d+)[\s-]*(bed|br)|\b(one|two|three|four|five)\b|ஒரு|இரண்டு|மூன்று|நான்கு/i);
    if (bedroomsMatch) {
      if (/(2|\btwo\b|இரண்டு)/i.test(scriptLower)) context.bedrooms = 2;
      else if (/(3|\bthree\b|மூன்று)/i.test(scriptLower)) context.bedrooms = 3;
      else if (/(4|\bfour\b|நான்கு)/i.test(scriptLower)) context.bedrooms = 4;
      else if (/(1|\bone\b|ஒரு)/i.test(scriptLower)) context.bedrooms = 1;
      else if (/(5|\bfive\b)/i.test(scriptLower)) context.bedrooms = 5;
      if (context.bedrooms !== undefined) {
        return {
          reply: stagedReply(
            'Perfect! Do you have a preferred budget in AED?',
            'சரியான தேர்வு! உங்களுக்கு விருப்பமான பட்ஜெட் AED இல் எவ்வளவு?',
            'Perfect! Ungalukku preferred budget AED la enna irukku?'
          ),
          context,
          propertyRecommendations: [],
          source: 'engine'
        };
      }
    }
  }

  if (context.bedrooms !== undefined) {
    const million = scriptLower.match(/([\d.]+)\s*million|([\d.]+)\s*million\s*aed/i);
    const numeric = scriptLower.match(/([\d,]+(?:\.\d+)?)[\s]*(aed|million)/i) ||
                    scriptLower.match(/(?:budget|around)[^\d]*([\d,]+)/i);
    if (million || numeric) {
      const parsed = million?.[1] || numeric?.[1] || '';
      if (parsed) {
        if (/million/i.test(scriptLower)) context.maxBudget = Math.round(Number(parsed.replace(/,/g, '').replace(/[^\d.]/g, '')) * 1000000);
        else context.maxBudget = Number(parsed.replace(/,/g, ''));
      }
      if (context.maxBudget) {
        return {
          reply: stagedReply(
            'Got it! Do you have a preferred location in Dubai?',
            'புரிந்தது! துபாயில் உங்களுக்கு விருப்பமான இடம் உள்ளதா?',
            'Got it! Dubai la preferred location enga irukku?'
          ),
          context,
          propertyRecommendations: [],
          source: 'engine'
        };
      }
    }
  }

  if (context.maxBudget !== undefined) {
    const locationMatch = scriptLower.match(/dubai marina|downtown dubai|palm jumeirah|business bay|jbr|jlt/i);
    if (locationMatch) {
      context.location = locationMatch[0].toLowerCase() === 'dubai marina' ? 'Dubai Marina' : locationMatch[0];
      context.stage = 'searching';
      let recommendations: PropertyRecord[] = [];
      if (isPostgresConfigured()) {
        try {
          const search = await searchPropertiesFromDb({
            location: context.location,
            propertyType: context.propertyType,
            bedrooms: context.bedrooms,
            maxPrice: context.maxBudget,
            purpose: context.purpose || 'For Sale',
            limit: 3,
            page: 1
          });
          recommendations = search.properties;
          if (recommendations.length === 0) {
            const broadened = await searchPropertiesFromDb({
              location: context.location,
              propertyType: context.propertyType,
              bedrooms: context.bedrooms,
              maxPrice: context.maxBudget,
              limit: 3,
              page: 1
            });
            recommendations = broadened.properties;
          }
        } catch (error: any) {
          console.warn('[Assistant Engine] Property search failed:', error.message);
        }
      }
      return {
        reply: stagedReply(
          'Excellent choice! Let me find properties matching your requirements.',
          'சிறந்த தேர்வு! உங்கள் தேவைகளுக்கு பொருந்தும் சொத்துகளை நான் பார்ப்பேன்.',
          'Excellent choice! Ungaloda requirements ku matching properties paakkiren.'
        ),
        context,
        propertyRecommendations: recommendations,
        source: 'engine'
      };
    }
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 1: BUSY / PAUSING
  // -------------------------------------------------------------
  if (intents.isBusy) {
    context.isPaused = true;
    const reply = lang === 'ta'
      ? 'நிச்சயமாக, எந்த பிரச்சனையும் இல்லை! உங்கள் நேரத்தை எடுத்துக் கொள்ளுங்கள். நீங்கள் தயாராக இருக்கும் போது நாம் மீண்டும் பேசலாம். இனிய நாளாக அமையட்டும்!'
      : lang === 'ar'
      ? 'بالطبع، خذ كامل وقتك دون أي قلق. يمكننا المتابعة في أي وقت يناسبك لاحقاً. أتمنى لك يوماً رائعاً!'
      : "Of course, no worries at all. Take your time. We can continue whenever you're ready. Have a great day!";

    return { reply, context, propertyRecommendations: [], source: 'engine' };
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 2: RESUMING AFTER PAUSE
  // -------------------------------------------------------------
  if (intents.isResume || (context.isPaused && !intents.isGreeting)) {
    context.isPaused = false;
    const summary = getContextSummary(context, lang);
    const summaryMention = summary 
      ? (lang === 'ar' ? `كنا نتحدث حول ${summary}.` : lang === 'ta' ? `நாம் ${summary} பற்றி பேசிக் கொண்டிருந்தோம்.` : `We were discussing ${summary}.`) 
      : '';

    const reply = lang === 'ta'
      ? `நிச்சயமாக! நாம் விட்ட இடத்திலிருந்து தொடரலாம். ${summaryMention} தற்போது பொருத்தமான இல்லங்களை பார்க்கலாமா அல்லது வேறு விருப்பங்களை மாற்ற விரும்புகிறீர்களா?`
      : lang === 'ar'
      ? `أهلاً بعودتك! بالتأكيد نتابع من حيث توقفنا. ${summaryMention} هل ترغب في الاطلاع على خيارات مناسبة أم تفضل تعديل المعايير؟`
      : `Of course! We can pick up right where we left off. ${summaryMention} Would you like to explore matching residences or adjust your criteria?`;

    return { reply, context, propertyRecommendations: [], source: 'engine' };
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 3: HUMAN AGENT HANDOFF & VIEWING
  // -------------------------------------------------------------
  if (intents.isHandoffRequest || context.awaitingContact) {
    const contactInfo = extractContactDetails(message);
    if (contactInfo.phone || contactInfo.email || (context.clientPhone && context.clientName)) {
      const name = contactInfo.name || context.clientName || 'Valued Private Patron';
      const phone = contactInfo.phone || context.clientPhone || '+971 50 000 0000';
      const email = contactInfo.email || context.clientEmail || 'patron@sovereign-inquiry.com';

      if (isPostgresConfigured()) {
        try {
          await createLeadInDb({
            clientName: name,
            email,
            phone,
            roleType: context.purpose === 'For Sale' ? 'buyer' : 'tenant',
            propertyTitle: getContextSummary(context, 'en') || 'Dubai Prime Portfolio Inquiry',
            requirements: {
              budgetMaxAED: context.maxBudget || 200000,
              enclaves: [context.location || 'Dubai Marina'],
              bedrooms: context.bedrooms ? `${context.bedrooms} BHK` : '2 BHK',
              propertyTypes: [context.propertyType || 'Apartment'],
              notes: 'Handoff requested via LYKA AI Voice Assistant session. Customer consent confirmed.'
            },
            leadSource: 'AI Assistant'
          });
        } catch (dbErr: any) {
          console.warn('[Assistant Engine] Failed recording lead to PostgreSQL:', dbErr.message);
        }
      }

      context.awaitingContact = false;
      const reply = lang === 'ta'
        ? `மிக்க நன்றி, ${name}! உங்கள் பார்வை விருப்பம் பதிவு செய்யப்பட்டு, எங்கள் மூத்த ஆலோசகருக்கு தகவல் அனுப்பப்பட்டுள்ளது. ${phone} எண்ணில் எமது ஆலோசகர் உங்களை விரைவில் தொடர்புகொள்வார்.`
        : lang === 'ar'
        ? `شكراً جزيلاً لكم، ${name}! تم تسجيل طلبكم وتعيين مستشارنا العقاري المعتمد. سيتواصل معكم مستشارنا قريباً على الرقم ${phone}.`
        : `Thank you, ${name}! I have recorded your viewing request and notified our Senior Property Consultant. Our advisor will reach out directly on ${phone} to arrange your private escorted tour.`;

      return { reply, context, propertyRecommendations: [], source: 'engine', handoffTriggered: true, leadCreated: true };
    } else {
      context.awaitingContact = true;
      const reply = lang === 'ta'
        ? 'எங்கள் மூத்த ரியல் எஸ்டேட் ஆலோசகருடன் உங்களை இணைப்பதில் மகிழ்ச்சி. உங்களுக்கு வசதியான நேரத்தில் தொடர்புகொள்ள உங்கள் பெயரையும் மொபைல் எண்ணையும் குறிப்பிட முடியுமா?'
        : lang === 'ar'
        ? 'يسعدني جداً ترتيب تواصل مباشر مع أحد كبار مستشارينا العقاريين. هل يمكنكم تزويدي باسمكم الكريم ورقم الهاتف المناسب للتواصل معكم؟'
        : "I'd be delighted to connect you with our senior property consultant. May I have your name and preferred phone number so our advisor can reach out at a convenient time?";

      return { reply, context, propertyRecommendations: [], source: 'engine', handoffTriggered: true };
    }
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 3B: OUT OF DOMAIN BOUNDARY HANDLING
  // -------------------------------------------------------------
  if (intents.isOutOfDomain) {
    const reply = lang === 'ta'
      ? 'நான் லைகா, உங்கள் துபாய் ரியல் எஸ்டேட் ஆலோசகர். எனது வழிகாட்டுதல் துபாய் சொத்துக்கள், சட்டங்கள் மற்றும் முதலீடுகள் சார்ந்தது மட்டுமே. துபாயில் உங்களுக்கு தேவையான இல்லங்கள் அல்லது முதலீடுகள் பற்றி எப்படி உதவட்டும்?'
      : lang === 'ar'
      ? 'أنا لايكا، مستشارتكم المتخصصة في عقارات دبي والإقامة الاستثمارية. أعتذر عن عدم إمكانية الإجابة على استفسارات خارج نطاق العقارات في الإمارات. كيف يمكنني مساعدتكم في خططكم العقارية في دبي اليوم؟'
      : "I am LYKA, your dedicated Dubai Real Estate AI Consultant. While I specialize exclusively in Dubai properties, market insights, and UAE residency, I cannot provide advice on non-real estate topics. How can I assist you with your property plans or residence search in Dubai today?";

    return { reply, context, propertyRecommendations: [], source: 'engine' };
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 3C: FAREWELL & SESSION DEPARTURE
  // -------------------------------------------------------------
  if (intents.isFarewell) {
    const reply = lang === 'ta'
      ? 'மிக்க நன்றி! உங்களோடு உரையாடியதில் பெரும் மகிழ்ச்சி. பாதுகாப்பாக இருங்கள், மீண்டும் பேசுவோம். வணக்கம்!'
      : lang === 'tanglish'
      ? 'Romba thanks bro! Take care, nalaikku pesalam, bye!'
      : lang === 'ar'
      ? 'على الرحب والسعة دائماً! تشرفت بالحديث معكم. في أمان الله وحفظه، مع السلامة!'
      : "You're very welcome! It was an absolute pleasure chatting with you. Have a wonderful day ahead, take care and goodbye!";

    return { reply, context, propertyRecommendations: [], source: 'engine' };
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 3D: STATEMENT CORRECTIONS & VOICE PAUSES
  // -------------------------------------------------------------
  if (intents.isVoiceInterruption) {
    const reply = lang === 'ta'
      ? 'கவலைப்படவே வேண்டாம், உங்கள் நேரத்தை எடுத்துக் கொள்ளுங்கள்! நீங்கள் தயாரானதும் எனக்குத் தெரியப்படுத்துங்கள்.'
      : lang === 'tanglish'
      ? 'No problem bro, take your time! Neenga ready aana apram continue pannalaam.'
      : lang === 'ar'
      ? 'لا داعي للقلق على الإطلاق، خذ كامل وقتك وبانتظارك متى أردت المتابعة.'
      : 'No worries at all, take your time! I will be right here whenever you are ready to continue.';

    return { reply, context, propertyRecommendations: [], source: 'engine' };
  }

  if (intents.isStatementCorrection && !intents.isExplicitPropertySearch) {
    const summary = getContextSummary(context, lang === 'tanglish' ? 'en' : lang);
    const reply = lang === 'ta'
      ? `நிச்சயமாக! உங்கள் விருப்பங்களை மாற்றிக் குறித்துக் கொண்டேன்${summary ? ` (${summary})` : ''}. அடுத்து என்ன விவரங்களை பார்க்க விரும்புகிறீர்கள்?`
      : lang === 'tanglish'
      ? `Kandippa bro! Criteria update panniyaachu${summary ? ` (${summary})` : ''}. Next enna paakalaam?`
      : lang === 'ar'
      ? `تم تعديل المعايير بدقة وفق رغبتكم${summary ? ` (${summary})` : ''}. ما الذي ترغبون في استكشافه بعد ذلك؟`
      : `Understood! I have updated your criteria accordingly${summary ? ` (${summary})` : ''}. What would you like to explore next?`;

    return { reply, context, propertyRecommendations: [], source: 'engine' };
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 4: GREETINGS & CASUAL CONVERSATION (Zero Forced Property Search)
  // -------------------------------------------------------------
  if (intents.isGreeting || intents.isCasual || intents.isJokeOrHumour || intents.isShortAnswer || intents.isTopicChange) {
    context.stage = 'greeting';

    const userTurns = conversationHistory.filter(h => h.role === 'user');
    const isFirstTurn = userTurns.length === 0 && !existingContext.stage;
    const isHowAreYou = /how are you|how'?re you|how is it going|how are you doing|how'?s your day|eppadi irukkeenga|kayfa haluk|كيف حالك|شو اخبارك|எப்படி இருக்கீங்க|நலமா/i.test(message);
    const directGreetingReply = lang === 'ta'
      ? (isFirstTurn ? 'வணக்கம்! லைகா ரியாலிட்டிக்கு உங்களை அன்புடன் வரவேற்கிறேன். இன்று துபாயில் என்ன சொத்து தேடலுக்கு உதவ வேண்டுமென நினைக்கிறீர்கள்?' : 'வணக்கம்! நான் உங்கள் துபாய் சொத்து ஆலோசகர். உங்களுக்கு எதைப் பார்க்க விரும்புகிறீர்கள்?')
      : lang === 'tanglish'
      ? (isFirstTurn ? 'Vanakkam bro! LYKA Realty la Dubai property options ah explore pannanum. Rent ah buy ah? I can help with both.' : 'Vanakkam! Unga Dubai property search la enna help venum?')
      : lang === 'ar'
      ? (isFirstTurn ? 'مرحباً بكم في لايكا العقارية! يسعدني مساعدتكم في استكشاف عقارات دبي. ما الذي تبحثون عنه اليوم؟' : 'مرحباً بكم مجدداً! كيف يمكنني مساعدتكم في عقارات دبي اليوم؟')
      : (isFirstTurn ? "Hello! Welcome to LYKA Realty. I'm happy to help you explore Dubai properties. What are you looking for today?" : "Hello! I’m here to help with your Dubai property search. What would you like to explore?");

    if (intents.isGreeting || intents.isShortAnswer || isHowAreYou) {
      return { reply: directGreetingReply, context, propertyRecommendations: [], source: 'engine' };
    }

    // Retrieve conversational guidance via RAG from our 1,080 human conversation knowledge base
    const convGuidance = knowledgeService.searchConversations(message, { topK: 2, minScore: 1.0 });
    const convContext = knowledgeService.formatConversationalGuidanceForPrompt(convGuidance);

    const langInstruction = lang === 'ta'
      ? 'Strict Language Matching: Always reply in natural, fluent Tamil (தமிழ்).'
      : lang === 'tanglish'
      ? 'Strict Language Matching: The customer is speaking Tanglish (Tamil in English letters). Always reply in friendly, conversational Tanglish using natural Tamil-English phrasing (e.g. "Vanakkam bro!", "Kandippa kedaikkum", "Tension vendam").'
      : lang === 'ar'
      ? 'Strict Language Matching: Always reply in flawless, hospitable Arabic (العربية).'
      : 'Strict Language Matching: Always reply in natural, professional, empathetic English.';

    const systemInstruction = `You are LYKA, an articulate, warm, and highly knowledgeable Dubai luxury real estate consultant.
CRITICAL INSTRUCTIONS:
1. Speak naturally like an empathetic human advisor having a conversation. Never sound robotic.
2. If asked "how are you?", respond warmly: "I'm doing great! Thanks for asking. How can I help you with your Dubai property search today?"
3. Welcome message rule: ${isFirstTurn ? 'You may welcome the customer to LYKA Realty.' : 'Do NOT repeat the welcome message ("Welcome to LYKA Realty") as this is already an active conversation. Greet back warmly and directly.'}
4. Casual conversation rule: Never force property searches or recommend listings during casual small-talk, greetings, or jokes.
5. End with exactly ONE relevant follow-up question.
6. ${langInstruction}

${convContext}`;

    const historyStr = conversationHistory.slice(-4).map(h => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`).join('\n');
    const prompt = historyStr
      ? `Conversation History:\n${historyStr}\n\nCustomer: ${message}`
      : message;

    // 1. Prefer local Ollama when available, then Gemini when configured.
    const ollamaReply = await tryGenerateWithOllama(message, systemInstruction, historyStr);
    if (ollamaReply) {
      return { reply: ollamaReply, context, propertyRecommendations: [], source: 'ollama' };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.35,
            maxOutputTokens: 150
          }
        });

        const replyText = response.text?.trim();
        if (replyText) {
          return { reply: replyText, context, propertyRecommendations: [], source: 'gemini' };
        }
      } catch (e: any) {
        console.warn('[Assistant Engine] Gemini greeting generation fallback:', e.message);
      }
    }

    if (ollamaReply) {
      return { reply: ollamaReply, context, propertyRecommendations: [], source: 'ollama' };
    }

    // 2. Deterministic Natural Fallback Response
    let reply = '';
    if (isHowAreYou) {
      if (lang === 'ta') {
        reply = "நான் மிக நலம்! கேட்டதற்கு மிக்க நன்றி. உங்கள் துபாய் சொத்து தேடலில் இன்று எவ்வாறு உதவட்டும்?";
      } else if (lang === 'tanglish') {
        reply = "Naan romba nalla irukken bro! Kettadhukku thanks. Ungalukku Dubai property search la eppadi help pannattum?";
      } else if (lang === 'ar') {
        reply = "أنا بأفضل حال ولله الحمد، شكراً لسؤالكم اللطيف! كيف يمكنني مساعدتكم في البحث عن عقارات دبي اليوم؟";
      } else {
        reply = "I'm doing great! Thanks for asking. How can I help you with your Dubai property search today?";
      }
    } else if (intents.isJokeOrHumour) {
      if (lang === 'ta') {
        reply = "ஹா ஹா! அருமையான நகைச்சுவை. ரியல் எஸ்டேட்டில் உங்களுக்கு ஏதேனும் சந்தேகங்கள் இருந்தால் தாராளமாக கேளுங்கள்!";
      } else if (lang === 'tanglish') {
        reply = "Haha! Romba funny bro. AI kitta 5 million irundha naanum Palm Jumeirah la penthouse vaangirupen! Vera enna details paakalaam?";
      } else if (lang === 'ar') {
        reply = "هههه، دعابة لطيفة جداً! إذا كان لديك أي استفسار حول عقارات دبي، فأنا في خدمتك دائماً.";
      } else {
        reply = "Haha, good one! If I had 5 million dirhams in my digital wallet, I'd probably get a penthouse on the Palm! What else is on your wish list today?";
      }
    } else if (intents.emotionCategory === 'frustrated') {
      if (lang === 'ta') {
        reply = "உங்கள் வருத்தம் முற்றிலும் நியாயமானது. இங்கு தவறான விளம்பரங்கள் அல்லது தேவையற்ற அழுத்தங்கள் இருக்காது, துல்லியமான விவரங்களை மட்டும் தருகிறேன். நான் உங்களுக்கு எப்படி உதவட்டும்?";
      } else if (lang === 'tanglish') {
        reply = "Tension aagatheenga bro, I completely understand your frustration. Inga ungalukku 100% verified accurate details mattum dhaan kedaikkum. Enna details venum nu sollunga.";
      } else if (lang === 'ar') {
        reply = "أتفهم تماماً استياءكم وهو مبرر تماماً. نضمن لكم هنا الشفافية الكاملة والبيانات الرسمية المؤكدة دون أي تضليل. كيف يمكنني خدمتكم؟";
      } else {
        reply = "I completely understand your frustration and you are 100% right to expect better. There are zero sales pitches or fake listings here—just verified facts. How can I assist you directly?";
      }
    } else if (intents.isShortAnswer) {
      if (lang === 'ta') {
        reply = "சரிங்க! உங்கள் துபாய் சொத்து தேடலை தொடர அடுத்ததாக என்ன விவரங்களை பார்க்க விரும்புகிறீர்கள்?";
      } else if (lang === 'tanglish') {
        reply = "Super bro! Next enna details paakalaam nu sollunga.";
      } else if (lang === 'ar') {
        reply = "ممتاز! ما هي الخطوة التالية أو الاستفسار الذي ترغبون في طرحه؟";
      } else {
        reply = "Sounds good! Whenever you're ready, what criteria or questions would you like to explore next?";
      }
    } else if (intents.isGreeting) {
      if (isFirstTurn) {
        if (lang === 'ta') {
          reply = intents.greetingType === 'morning'
            ? 'காலை வணக்கம்! லைகா ரியாலிட்டிக்கு உங்களை அன்புடன் வரவேற்கிறேன். துபாயில் உங்கள் விருப்பமான இல்லத்தை தேர்ந்தெடுக்க உதவ தயாராக உள்ளேன். நீங்கள் வாடகைக்கு அல்லது வாங்குவதற்கு என்ன வகையான சொத்தை தேடுகிறீர்கள்?'
            : 'வணக்கம்! லைகா ரியாலிட்டிக்கு உங்களை அன்புடன் வரவேற்கிறேன். துபாயில் உங்கள் விருப்பமான இல்லத்தை தேர்ந்தெடுக்க உதவ தயாராக உள்ளேன். நீங்கள் வாடகைக்கு அல்லது வாங்குவதற்கு என்ன வகையான சொத்தை தேடுகிறீர்கள்?';
        } else if (lang === 'tanglish') {
          reply = 'Vanakkam bro! Welcome to LYKA Realty. Dubai la ungalukku enna maadhiri property theva, Rent ah illa Buy ah?';
        } else if (lang === 'ar') {
          reply = intents.greetingType === 'morning'
            ? 'صباح الخير وأهلاً بكم في دار لايكا العقارية! يسعدني جداً مساعدتكم في استكشاف أرقى عقارات دبي. ما الذي تتطلعون إليه اليوم، شراء أم إيجار؟'
            : 'أهلاً بكم في دار لايكا العقارية! يسعدني جداً مساعدتكم في استكشاف أرقى عقارات دبي. ما الذي تتطلعون إليه اليوم، شراء أم إيجار؟';
        } else {
          const timeGreeting = intents.greetingType === 'morning' ? 'Good morning!' : intents.greetingType === 'evening' ? 'Good evening!' : 'Hello!';
          reply = `${timeGreeting} Welcome to LYKA Realty. I'm happy to help you explore Dubai properties. What are you looking for today?`;
        }
      } else {
        // Follow-up greeting: NEVER repeat welcome message after turn 1!
        if (lang === 'ta') {
          reply = 'மீண்டும் வணக்கம்! உங்கள் துபாய் சொத்து தேடலில் இன்று எவ்வாறு உதவட்டும்?';
        } else if (lang === 'tanglish') {
          reply = 'Vanakkam bro! Welcome back. Next enna details check pannalaam?';
        } else if (lang === 'ar') {
          reply = 'أهلاً بك مجدداً! كيف يمكنني مساعدتك في استكشاف عقارات دبي اليوم؟';
        } else {
          reply = 'Hello again! How can I help you with your Dubai property search?';
        }
      }
    } else {
      // General casual talk
      if (lang === 'ta') {
        reply = 'நான் மிக நலம்! கேட்டதற்கு மிக்க நன்றி. உங்கள் துபாய் சொத்து தேடலில் இன்று எவ்வாறு உதவட்டும்?';
      } else if (lang === 'tanglish') {
        reply = 'Super bro! Kettadhukku thanks. Dubai la ungalukku eppadi help pannattum?';
      } else if (lang === 'ar') {
        reply = 'أنا بأفضل حال ولله الحمد، شكراً لسؤالكم اللطيف! كيف يمكنني مساعدتكم في البحث عن عقارات دبي اليوم؟';
      } else {
        reply = "I'm doing great! Thanks for asking. How can I help you with your Dubai property search today?";
      }
    }

    return { reply, context, propertyRecommendations: [], source: 'engine' };
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 5: PURPOSE IDENTIFICATION (Buy / Rent / Sell / Invest Clarification)
  // -------------------------------------------------------------
  if (intents.isPurposeSpecification && !intents.isExplicitPropertySearch && !context.location) {
    context.stage = 'discovery';
    let purposeReply = '';

    if (intents.detectedPurpose === 'For Sale') {
      if (lang === 'ta') {
        purposeReply = 'வாழ்த்துக்கள்! துபாயில் முழு உரிமை சொத்துக்கள் வாங்குவது மிக சிறந்த முதலீடு. நீங்கள் துபாய் மரினா, டவுன்டவுன் அல்லது பாம் ஜுமேரா போன்ற எந்த பகுதியை விரும்புகிறீர்கள்?';
      } else if (lang === 'ar') {
        purposeReply = 'قرار ممتاز! يوفر التملك الحر في دبي عوائد استثمارية قوية وبدون ضرائب. ما هي المناطق المفضلة لديكم، مثل وسط مدينة دبي أو دبي مارينا؟';
      } else {
        purposeReply = 'Excellent choice! Freehold ownership in Dubai offers strong capital growth and zero property taxes. Which community interests you most—such as Downtown Dubai or Dubai Marina?';
      }
    } else if (intents.detectedPurpose === 'For Rent') {
      if (lang === 'ta') {
        purposeReply = 'மகிழ்ச்சி! துபாயில் சிறந்த வாடகை குடியிருப்புகள் உள்ளன. நீங்கள் எத்தனை படுக்கையறைகள் கொண்ட இல்லத்தை தேடுகிறீர்கள், 1 அல்லது 2 BHK?';
      } else if (lang === 'ar') {
        purposeReply = 'يسعدني مساعدتكم في العثور على أفضل خيارات الإيجار. كم عدد غرف النوم التي تبحثون عنها، غرفة أم غرفتين وصالة؟';
      } else {
        purposeReply = 'Wonderful! Dubai offers fantastic rental residences. How many bedrooms are you looking for—a 1-bedroom or 2-bedroom home?';
      }
    } else if (intents.detectedPurpose === 'Invest') {
      if (lang === 'ta') {
        purposeReply = 'துபாயில் முதலீடு செய்வது அதிக வருவாய் தரும் திட்டம். உங்கள் உத்தேச முதலீட்டு பட்ஜெட் எவ்வளவு இருக்கும்?';
      } else if (lang === 'ar') {
        purposeReply = 'الاستثمار العقاري في دبي من أكثر الفرص عائداً واستقراراً. ما هو النطاق الاستثماري أو الميزانية التقديرية التي تفكرون بها؟';
      } else {
        purposeReply = 'Investing in Dubai real estate is a smart move with strong rental yields. What approximate budget or price range are you considering for your investment?';
      }
    } else {
      if (lang === 'ta') {
        purposeReply = 'உங்கள் சொத்தை சிறந்த விலையில் விற்பனை செய்ய எங்கள் மூத்த ஆலோசகர்கள் உதவுவர். உங்கள் சொத்து எந்த பகுதியில் அமைந்துள்ளது?';
      } else if (lang === 'ar') {
        purposeReply = 'يسعدنا مساعدتكم في تسويق وبيع عقاركم بأفضل قيمة سوقية. في أي منطقة من دبي يقع العقار؟';
      } else {
        purposeReply = 'We would be delighted to assist in marketing your property for top market value. In which Dubai community is your property located?';
      }
    }

    return { reply: purposeReply, context, propertyRecommendations: [], source: 'engine' };
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 6: DOMAIN KNOWLEDGE & RAG (Dubai Real Estate Advisor)
  // -------------------------------------------------------------
  if (intents.isKnowledgeQuestion && !intents.isExplicitPropertySearch) {
    context.stage = 'discovery';
    const ragResults = knowledgeService.searchKnowledge(message, { topK: 3, minScore: 5.0 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const knowledgeContext = knowledgeService.formatKnowledgeForPrompt(ragResults);
        const convGuidance = knowledgeService.searchConversations(message, { topK: 1, minScore: 1.0 });
        const convContext = knowledgeService.formatConversationalGuidanceForPrompt(convGuidance);

        const langInstruction = lang === 'ta'
          ? 'Strict Language Matching: Always reply in natural, fluent Tamil (தமிழ்).'
          : lang === 'tanglish'
          ? 'Strict Language Matching: Reply in friendly conversational Tanglish (Tamil in English letters).'
          : lang === 'ar'
          ? 'Strict Language Matching: Always reply in flawless Modern Standard Arabic (العربية).'
          : 'Strict Language Matching: Always reply in natural, professional English.';

        const systemInstruction = `You are LYKA, a premier luxury Dubai real estate consultant.
You behave like ChatGPT / Gemini in everyday conversations: articulate, warm, empathetic, and authoritative.
CRITICAL INSTRUCTIONS:
1. Speak naturally like an experienced human advisor. Never sound like a robotic customer service IVR.
2. Ground your answer strictly in the verified Dubai real estate knowledge base context provided below. Never invent arbitrary percentages, rules, or figures.
3. Length: Keep voice reply strictly between 45 and 80 words so speech synthesis speaks smoothly.
4. End with exactly ONE relevant follow-up question to advance the conversation naturally.
5. ${langInstruction} Never switch languages unless requested.

${convContext}

${knowledgeContext}`;

        const historyStr = conversationHistory.slice(-4).map(h => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`).join('\n');
        const prompt = historyStr
          ? `Conversation History:\n${historyStr}\n\nCustomer Question: ${message}`
          : message;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.35,
            maxOutputTokens: 250
          }
        });

        const replyText = response.text?.trim();
        if (replyText) {
          return { reply: replyText, context, propertyRecommendations: [], source: 'gemini' };
        }
      } catch (e: any) {
        console.warn('[Assistant Engine] Gemini RAG generation fallback:', e.message);
      }
    }

    const fallbackReply = synthesizeKnowledgeFallback(intents.advisoryTopic, message, lang, ragResults);
    return { reply: fallbackReply, context, propertyRecommendations: [], source: 'engine' };
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 7: RELATIVE BUDGET CHANGES
  // -------------------------------------------------------------
  if (intents.isCheaperRequest) {
    if (context.maxBudget) {
      context.maxBudget = Math.round(context.maxBudget * 0.85);
    } else if (context.lastRecommendedPrice) {
      context.maxBudget = Math.round(context.lastRecommendedPrice * 0.9);
    } else {
      context.maxBudget = 85000;
    }
  } else if (intents.isMoreExpensiveRequest) {
    if (context.maxBudget) {
      context.maxBudget = Math.round(context.maxBudget * 1.3);
    } else {
      context.maxBudget = 300000;
    }
  }

  // -------------------------------------------------------------
  // DECISION RULE: SHOULD WE QUERY THE DATABASE FOR PROPERTIES?
  // -------------------------------------------------------------
  // Only query PostgreSQL when:
  // - Customer explicitly asks to see properties ("Show me...", "What's available", etc.)
  // - Customer made a comparative search ("cheaper", "more expensive")
  // - Customer provided specific location + criteria and intent is clearly searching
  const shouldSearchProperties =
    intents.isExplicitPropertySearch ||
    intents.isCheaperRequest ||
    intents.isMoreExpensiveRequest ||
    (Boolean(context.location) && (context.bedrooms !== undefined || context.maxBudget !== undefined));

  if (!shouldSearchProperties) {
    // If not searching properties yet, maintain natural dialogue and ask ONE discovery question
    let discoveryReply = '';
    if (!context.purpose) {
      if (lang === 'ta') {
        discoveryReply = 'துபாய் ரியல் எஸ்டேட்டில் உங்களுக்கு உதவ விரும்புகிறேன். நீங்கள் வாங்குவதற்கு, வாடகைக்கு அல்லது முதலீட்டுக்கு பார்க்கிறீர்களா?';
      } else if (lang === 'ar') {
        discoveryReply = 'يسعدني مرافقتكم في استكشاف عقارات دبي. هل تتطلعون للشراء، أم الإيجار، أم الاستثمار؟';
      } else {
        discoveryReply = 'I would love to help guide your search. Are you looking to purchase a home, rent, or explore investment opportunities?';
      }
    } else {
      if (lang === 'ta') {
        discoveryReply = `நிச்சயமாக, உங்கள் விருப்பத்தை குறித்துக் கொண்டேன். துபாய் மரினா அல்லது பாம் ஜுமேரா போன்ற குறிப்பிட்ட பகுதிகளை பார்க்க விரும்புகிறீர்களா?`;
      } else if (lang === 'ar') {
        discoveryReply = `رائع، تم تدوين رغبتكم. هل هناك منطقة مفضلة لديكم في دبي، مثل دبي مارينا أو نخلة جميرا؟`;
      } else {
        discoveryReply = `Understood! Do you have a preferred location in mind, such as Dubai Marina or Palm Jumeirah?`;
      }
    }

    return { reply: discoveryReply, context, propertyRecommendations: [], source: 'engine' };
  }

  // -------------------------------------------------------------
  // DIALOGUE ROUTE 8: DATABASE SEARCH AGAINST LIVE 73,727 PROPERTIES
  // -------------------------------------------------------------
  context.stage = 'searching';
  let searchResults: PropertyRecord[] = [];
  try {
    if (isPostgresConfigured()) {
      let dbRes = await searchPropertiesFromDb({
        location: context.location,
        bedrooms: context.bedrooms !== undefined ? String(context.bedrooms) : undefined,
        propertyType: context.propertyType,
        maxPrice: context.maxBudget,
        minPrice: context.minBudget,
        purpose: context.purpose,
        furnishing: context.furnishing,
        isActive: true,
        limit: 4
      });

      // If no properties found with specific purpose (e.g. database contains rental portfolio),
      // broaden purpose search to show matching residences from our verified live portfolio
      if (dbRes.properties.length === 0 && context.purpose) {
        dbRes = await searchPropertiesFromDb({
          location: context.location,
          bedrooms: context.bedrooms !== undefined ? String(context.bedrooms) : undefined,
          propertyType: context.propertyType,
          maxPrice: context.maxBudget,
          minPrice: context.minBudget,
          furnishing: context.furnishing,
          isActive: true,
          limit: 4
        });
      }
      searchResults = dbRes.properties;
    }
  } catch (err: any) {
    console.warn('[Assistant Engine] Live DB search error:', err.message);
  }

  const recommendations = searchResults.map((p) => {
    const reasons: string[] = [];
    if (context.location && p.location.toLowerCase().includes(context.location.toLowerCase())) {
      reasons.push(p.location);
    }
    if (context.bedrooms !== undefined && p.bedrooms === context.bedrooms) {
      reasons.push(`${p.bedrooms} BHK`);
    }
    if (context.maxBudget && p.priceAED <= context.maxBudget) {
      reasons.push(`Under AED ${context.maxBudget.toLocaleString()}`);
    }
    return {
      ...p,
      matchReason: reasons.join(' · ') || 'Verified Dubai Listing',
      matchScore: 95
    };
  });

  if (recommendations.length > 0) {
    context.lastRecommendedPrice = recommendations[0].priceAED;
    context.lastRecommendedCount = recommendations.length;
  }

  // -------------------------------------------------------------
  // SYNTHESIZE NATURAL CONVERSATIONAL RESPONSE (Gemini 2.5 Flash or Fallback)
  // -------------------------------------------------------------
  const convGuidance = knowledgeService.searchConversations(message, { topK: 1, minScore: 1.0 });
  const convContext = knowledgeService.formatConversationalGuidanceForPrompt(convGuidance);

  const propContext = recommendations.length > 0
    ? recommendations.map(p => `- ID: ${p.id} | "${p.title}" in ${p.location} | Price: AED ${p.priceAED.toLocaleString()} (${p.purpose}) | Beds: ${p.bedrooms} | Baths: ${p.bathrooms} | Area: ${p.areaSqFt} sq.ft`).join('\n')
    : 'No active properties matched these exact parameters in the database.';

  const langInstruction = lang === 'ta'
    ? 'Language: Always reply in natural, fluent Tamil (தமிழ்).'
    : lang === 'tanglish'
    ? 'Language: Always reply in friendly conversational Tanglish (Tamil in English letters).'
    : lang === 'ar'
    ? 'Language: Always reply in flawless Modern Standard Arabic (العربية).'
    : 'Language: Always reply in natural, professional English.';

  const systemInstruction = `You are LYKA, a premier luxury Dubai real estate consultant.
You behave like ChatGPT / Gemini in everyday conversations: articulate, warm, empathetic, and knowledgeable.
CRITICAL INSTRUCTIONS:
1. Speak naturally like a real human advisor having a conversation. Never sound like a robotic customer service IVR.
2. Context Memory: The customer's current criteria are: Location="${context.location || 'Any'}", Bedrooms="${context.bedrooms !== undefined ? context.bedrooms : 'Any'}", Purpose="${context.purpose || 'For Rent'}", Max Budget="${context.maxBudget ? 'AED ' + context.maxBudget.toLocaleString() : 'Any'}". Do NOT re-ask questions already answered.
3. Length: Keep voice reply strictly between 35 and 65 words so speech synthesis speaks smoothly.
4. Recommendations: Reference 1 or 2 matching properties by title and exact price from the real database listings below. Never invent fake properties or prices.
5. End with exactly ONE relevant follow-up question (e.g. asking if they'd like to arrange a private viewing or narrow down criteria).
6. ${langInstruction}

${convContext}

ACTUAL VERIFIED DATABASE RESULTS:
${propContext}`;

  const historyStr = conversationHistory.slice(-4).map(h => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`).join('\n');
  const prompt = historyStr
    ? `Conversation History:\n${historyStr}\n\nCustomer Message: ${message}`
    : message;

  const ollamaReply = await tryGenerateWithOllama(message, systemInstruction, historyStr);
  if (ollamaReply) {
    return {
      reply: ollamaReply,
      context,
      propertyRecommendations: recommendations,
      source: 'ollama'
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.35,
          maxOutputTokens: 200
        }
      });

      const replyText = response.text?.trim();
      if (replyText) {
        return {
          reply: replyText,
          context,
          propertyRecommendations: recommendations,
          source: 'gemini'
        };
      }
    } catch (e: any) {
      console.warn('[Assistant Engine] Gemini generation fallback:', e.message);
    }
  }

  // Deterministic Natural Fallback Reply if AI Key is missing or rate limited
  let naturalReply = '';
  if (recommendations.length > 0) {
    const top = recommendations[0];
    const top2 = recommendations.length > 1 ? recommendations[1] : null;

    if (lang === 'ta') {
      const extra = top2 ? ` மற்றும் "${top2.title}" (AED ${top2.priceAED.toLocaleString()})` : '';
      naturalReply = `உங்கள் விருப்பப்படி, ${top.location} பகுதியில் "${top.title}" (AED ${top.priceAED.toLocaleString()})${extra} பரிந்துரைக்கிறேன். இவற்றின் வசதிகள் மற்றும் பார்வை ஏற்பாடுகளைப் பற்றி மேலும் அறிய விரும்புகிறீர்களா?`;
    } else if (lang === 'ar') {
      const extra = top2 ? ` وكذلك "${top2.title}" بقيمة ${top2.priceAED.toLocaleString()} درهم` : '';
      naturalReply = `بناءً على طلبكم، أقترح عليكم "${top.title}" في ${top.location} بقيمة ${top.priceAED.toLocaleString()} درهم سنوياً${extra}. هل ترغب في الاطلاع على تفاصيل إضافية أو حجز موعد معاينة؟`;
    } else {
      const extra = top2 ? ` and ${top2.title} at AED ${top2.priceAED.toLocaleString()}` : '';
      naturalReply = `I found excellent options matching your criteria, including ${top.title} in ${top.location} at AED ${top.priceAED.toLocaleString()} (${top.purpose})${extra}. Would you like me to arrange a private viewing or narrow them down further?`;
    }
  } else {
    if (lang === 'ta') {
      naturalReply = `மன்னிக்கவும், தற்போது நீங்கள் குறிப்பிட்ட அதே அளவுகோலில் நேரடி பட்டியல் கிடைக்கவில்லை. பாம் ஜுமேரா அல்லது டவுன்டவுன் போன்ற மாற்று பகுதிகளை பார்க்கலாமா?`;
    } else if (lang === 'ar') {
      naturalReply = `عذراً، لا تتوفر حالياً خيارات مطابقة تماماً لهذه المعايير في قاعدة بياناتنا. هل ترغب في استكشاف مناطق قريبة مثل وسط مدينة دبي أو نخلة جميرا؟`;
    } else {
      naturalReply = `I could not find an exact active match for those specific parameters right now. Would you like to explore nearby communities like Downtown Dubai or adjust the budget range?`;
    }
  }

  return {
    reply: naturalReply,
    context,
    propertyRecommendations: recommendations,
    source: 'engine'
  };
}
