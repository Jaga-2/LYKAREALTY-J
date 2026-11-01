// Client-Side Offline Conversational Engine
// Activated when backend fetch fails, network is offline, or rate limited.

export interface ClientAssistantTurnResult {
  reply: string;
  context: any;
  propertyRecommendations: any[];
  source: 'fallback';
  quotaExceeded: boolean;
  handoffTriggered?: boolean;
}

export function detectLanguageClient(text: string, currentLang: string = 'en'): 'en' | 'ar' | 'ta' | 'tanglish' {
  const lower = text.toLowerCase();

  if (/(^|\s)(reply|respond|speak|talk|answer)\s+(in\s+)?english(\s+please)?$|english\s+(only|please)$/i.test(lower)) return 'en';
  if (/(^|\s)(reply|respond|speak|talk|answer)\s+(in\s+)?arabic(\s+please)?$|arabic\s+(only|please)$/i.test(lower)) return 'ar';
  if (/(^|\s)(reply|respond|speak|talk|answer)\s+(in\s+)?tamil(\s+please)?$|in\s+tamil(\s+please)?$/i.test(lower)) return 'ta';
  if (/(^|\s)(reply|respond|speak|talk|answer)\s+(in\s+)?tanglish(\s+please)?$|tanglish|vanakkam bro|kandippa|romba|eppadi|kedaikuma/i.test(lower)) return 'tanglish';

  if(/[஀-௿]/.test(text)) return 'ta';
  if(/[؀-ۿ]/.test(text)) return 'ar';

  if (lower.includes('vanakkam') || lower.includes('nandri') || lower.includes('eppadi') || lower.includes('romba')) return 'ta';
  if (lower.includes('marhaba') || lower.includes('shukran') || lower.includes('ahlan') || lower.includes('kayfa haluk')) return 'ar';

  return (currentLang as 'en' | 'ar' | 'ta' | 'tanglish') || 'en';
}

export function processClientAssistantTurn(
  message: string,
  existingContext: any = {},
  conversationHistory: { role: string; text: string }[] = [],
  appLang: string = 'en'
): ClientAssistantTurnResult {
  const lower = message.toLowerCase().trim();
  const lang = detectLanguageClient(message, existingContext.preferredLanguage || appLang);
  const context = { ...existingContext, preferredLanguage: lang };

  // Determine if this is the first user turn
  const userTurns = conversationHistory.filter(h => h.role === 'user');
  const isFirstTurn = userTurns.length === 0 && !context.stage;

  // 1. Out of Domain
  const isOutOfDomain = /^(can you |could you |please )?(write a (python|javascript|code|script)|debug this code|solve this math|cure for|treatment for|headache|stomach ache|symptoms of|bitcoin trading|crypto trading|nfl score|football score|who won the match|recipe for|bake a cake|sing a song)/i.test(lower) ||
    /(write (python|code)|medical advice|diagnose me|prescribe medicine|crypto advice)/i.test(lower);

  if (isOutOfDomain) {
    const reply = lang === 'ta'
      ? 'நான் லைகா, உங்கள் துபாய் ரியல் எஸ்டேட் ஆலோசகர். எனது வழிகாட்டுதல் துபாய் சொத்துக்கள், சட்டங்கள் மற்றும் முதலீடுகள் சார்ந்தது மட்டுமே. துபாயில் உங்களுக்கு தேவையான இல்லங்கள் அல்லது முதலீடுகள் பற்றி எப்படி உதவட்டும்?'
      : lang === 'ar'
      ? 'أنا لايكا، مستشارتكم المتخصصة في عقارات دبي والإقامة الاستثمارية. أعتذر عن عدم إمكانية الإجابة على استفسارات خارج نطاق العقارات في الإمارات. كيف يمكنني مساعدتكم في خططكم العقارية في دبي اليوم؟'
      : "I am LYKA, your dedicated Dubai Real Estate AI Consultant. While I specialize exclusively in Dubai properties, market insights, and UAE residency, I cannot provide advice on non-real estate topics. How can I assist you with your property plans or residence search in Dubai today?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  // 2. Pause / Busy
  const isBusy = /i'?m busy|busy now|busy right now|call you later|talk later|can'?t talk|gotta go|take care|have to go|have a meeting|in a meeting|நேரம் இல்லை|இப்ப பிஸி|مشغول الأن|مشغول حاليا|مشغول/i.test(lower);
  if (isBusy) {
    context.isPaused = true;
    const reply = lang === 'ta'
      ? 'நிச்சயமாக, எந்த பிரச்சனையும் இல்லை! உங்கள் நேரத்தை எடுத்துக் கொள்ளுங்கள். நீங்கள் தயாராக இருக்கும் போது நாம் மீண்டும் பேசலாம். இனிய நாளாக அமையட்டும்!'
      : lang === 'ar'
      ? 'بالطبع، خذ كامل وقتك دون أي قلق. يمكننا المتابعة في أي وقت يناسبك لاحقاً. أتمنى لك يوماً رائعاً!'
      : "Of course, no worries at all. Take your time. We can continue whenever you're ready. Have a great day!";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  // 3. Resume
  const isResume = /can we continue|let'?s continue|continue|resume|i'?m back|shall we continue|மீண்டும் தொடரலாம்|تكملة|لنكمل|هل يمكننا المتابعة/i.test(lower);
  if (isResume || (context.isPaused && !/hello|hi|hey/i.test(lower))) {
    context.isPaused = false;
    const reply = lang === 'ta'
      ? 'நிச்சயமாக! நாம் விட்ட இடத்திலிருந்து தொடரலாம். உங்கள் விருப்பமான இல்லங்களை பற்றி மேலும் பேசலாமா அல்லது வேறு விவரங்களை அறிய விரும்புகிறீர்களா?'
      : lang === 'ar'
      ? 'أهلاً بعودتك! بالتأكيد نتابع من حيث توقفنا. هل ترغب في الاطلاع على خيارات سكنية مناسبة أم تفضل الاستفسار عن تفاصيل إضافية؟'
      : "Of course! We can pick up right where we left off. Would you like to explore matching residences or adjust your search criteria?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  // 4. Casual Questions ("How are you?", "Who are you?", etc.)
  const isHowAreYou = /how are you|how'?re you|how is it going|how are you doing|how'?s your day|eppadi irukkeenga|kayfa haluk|كيف حالك|شو اخبارك|எப்படி இருக்கீங்க|நலமா/i.test(lower);
  if (isHowAreYou) {
    context.stage = 'casual';
    const reply = lang === 'ta'
      ? "நான் மிக நலம்! கேட்டதற்கு மிக்க நன்றி. உங்கள் துபாய் சொத்து தேடலில் இன்று எவ்வாறு உதவட்டும்?"
      : lang === 'ar'
      ? "أنا بأفضل حال ولله الحمد، شكراً لسؤالكم اللطيف! كيف يمكنني مساعدتكم في البحث عن عقارات دبي اليوم؟"
      : "I'm doing great! Thanks for asking. How can I help you with your Dubai property search today?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  const isOtherCasual = /who are you|what can you do|nice to meet you|thank you|thanks|you'?re great|awesome|cool|من انت|شكرا|நன்றி/i.test(lower);
  if (isOtherCasual) {
    context.stage = 'casual';
    if (/thank|thanks|شكرا|நன்றி/i.test(lower)) {
      const reply = lang === 'ta'
        ? "மகிழ்ச்சி! துபாயில் உங்களுக்கு ஏதேனும் சொத்து விபரங்கள் அல்லது வழிகாட்டல் தேவையா?"
        : lang === 'ar'
        ? "على الرحب والسعة دائماً! هل هناك أي استفسار عقاري آخر يمكنني مساعدتكم به؟"
        : "You are most welcome! Is there anything else regarding Dubai properties or communities I can assist you with?";
      return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
    }

    const reply = lang === 'ta'
      ? "நான் லைகா, உங்கள் துபாய் ரியல் எஸ்டேட் ஆலோசகர். துபாயில் வாடகை, விற்பனை, முதலீடுகள் மற்றும் கோல்டன் விசா விபரங்களை அறிய நான் உதவ முடியும். நீங்கள் என்ன வகையான சொத்தை தேடுகிறீர்கள்?"
      : lang === 'ar'
      ? "أنا لايكا، مستشارتكم المتخصصة في عقارات دبي. يمكنني مساعدتكم في استكشاف العقارات للبيع أو الإيجار، حساب العوائد الاستثمارية، وشرح متطلبات الإقامة الذهبية. ما الذي تبحثون عنه اليوم؟"
      : "I am LYKA, your dedicated Dubai Real Estate AI Consultant. I can help guide your search for luxury rentals, freehold purchases, rental yields, and UAE Golden Visa requirements. What type of property interests you?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  // 5. Greetings
  const isMorning = /good\s*morning|sabah\s*al\s*khair|صباح الخير|காலை வணக்கம்/i.test(lower);
  const isAfternoon = /good\s*afternoon|مساء الخير|மதிய வணக்கம்/i.test(lower);
  const isEvening = /good\s*evening|مساء النور|மாலை வணக்கம்/i.test(lower);
  const isGeneralGreeting = /^(hello|hi|hey|greetings|howdy|vanakkam|marhaba|ahlan|salam|வணக்கம்|مرحبا|أهلا|سلام)[\s!.,?]*$/i.test(lower) ||
    /^(hi|hello|hey)[\s,]+(there|everyone|lyka|assistant|bot)?[\s!.,?]*$/i.test(lower);

  const isGreeting = isMorning || isAfternoon || isEvening || isGeneralGreeting ||
    /(?:^|\s)(hello|hi|hey|good\s*morning|good\s*evening|vanakkam|marhaba|ahlan)(?:$|[!.,?\s])/i.test(lower);

  if (isGreeting) {
    context.stage = 'greeting';
    let reply = '';
    if (isFirstTurn) {
      if (lang === 'ta') {
        reply = 'வணக்கம்! லைகா ரியாலிட்டிக்கு உங்களை அன்புடன் வரவேற்கிறேன். துபாயில் உங்கள் விருப்பமான இல்லத்தை தேர்ந்தெடுக்க உதவ தயாராக உள்ளேன். நீங்கள் வாடகைக்கு அல்லது வாங்குவதற்கு என்ன வகையான சொத்தை தேடுகிறீர்கள்?';
      } else if (lang === 'ar') {
        reply = isMorning
          ? 'صباح الخير وأهلاً بكم في دار لايكا العقارية! يسعدني جداً مساعدتكم في استكشاف أرقى عقارات دبي. ما الذي تتطلعون إليه اليوم، شراء أم إيجار؟'
          : 'أهلاً بكم في دار لايكا العقارية! يسعدني جداً مساعدتكم في استكشاف أرقى عقارات دبي. ما الذي تتطلعون إليه اليوم، شراء أم إيجار؟';
      } else {
        const timeGreeting = isMorning ? 'Good morning!' : isEvening ? 'Good evening!' : 'Hello!';
        reply = `${timeGreeting} Welcome to LYKA Realty. I'm happy to help you explore Dubai properties. What are you looking for today?`;
      }
    } else {
      // Turn > 1: Never repeat the welcome message!
      if (lang === 'ta') {
        reply = 'மீண்டும் வணக்கம்! உங்கள் துபாய் சொத்து தேடலில் இன்று எவ்வாறு உதவட்டும்?';
      } else if (lang === 'ar') {
        reply = 'أهلاً بك مجدداً! كيف يمكنني مساعدتك في استكشاف عقارات دبي اليوم؟';
      } else {
        reply = 'Hello again! How can I help you with your Dubai property search?';
      }
    }

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  // 6. Real Estate Domain Inquiries (Golden Visa, DLD fees, Mortgages, Ejari, Communities, Yields)
  if (/golden visa|visa|விசா|கோல்டன்|إقامة ذهبية|فيزا ذهبية/i.test(lower)) {
    context.stage = 'advisory';
    const reply = lang === 'ta'
      ? "துபாயின் முழு உரிமை (Freehold) பகுதிகளில் AED 2,000,000 அல்லது அதற்கு மேற்பட்ட மதிப்புள்ள சொத்துக்களில் முதலீடு செய்தால் உங்களுக்கும் உங்கள் குடும்பத்தினருக்கும் 10 ஆண்டு கோல்டன் விசா வழங்கப்படுகிறது. வங்கி கடன் சொத்துக்களும் உரிய வங்கியின் அனுமதியுடன் தகுதி பெறும். கோல்டன் விசா தகுதி கொண்ட முதலீட்டு சொத்துக்களை பார்க்க விரும்புகிறீர்களா?"
      : lang === 'ar'
      ? "تمنح دولة الإمارات إقامة ذهبية سيادية لمدة 10 سنوات للمستثمرين العقاريين بقيمة مليوني درهم فما فوق في مناطق التملك الحر، وتغطي الزوجة والأبناء دون قيود الإقامة خارج الدولة. هل ترغب في استكشاف عقارات استثمارية مؤهلة للإقامة الذهبية؟"
      : "The UAE grants a 10-year Golden Visa for real estate investments of AED 2,000,000 or more in designated freehold zones. This covers single or aggregated properties and extends to your family with zero absence restrictions. Would you like to explore prime investment properties that qualify for the Golden Visa?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  if (/transfer fee|trustee fee|dld fee|cost|charges|கட்டணம்|செலவு|வரி|رسوم/i.test(lower)) {
    context.stage = 'advisory';
    const reply = lang === 'ta'
      ? "துபாயில் சொத்து வாங்கும் போது நிலத் துறைக்கு (DLD) 4% மாற்றுக் கட்டணம் மற்றும் AED 580 தலைப்புப் பத்திரக் கட்டணம் செலுத்த வேண்டும். மேலும் பதிவு அறங்காவலர் கட்டணம் AED 4,000 (+ 5% VAT) மற்றும் 2% முகவர் கட்டணம் பொருந்தும். நீங்கள் குறிப்பிட்ட பட்ஜெட்டுக்கான மொத்த செலவைக் கணக்கிட உதவட்டுமா?"
      : lang === 'ar'
      ? "تبلغ رسوم نقل الملكية لدى دائرة الأراضي والأملاك (DLD) 4% من قيمة العقار بالإضافة إلى 580 درهماً لإصدار سند الملكية، ورسوم أمين التسجيل 4,000 درهم (+ 5% ضريبة) للعقارات بقيمة 500 ألف درهم فما فوق، مع عمولة وساطة 2%. هل ترغب في حساب إجمالي تكاليف الشراء لميزانية محددة؟"
      : "When acquiring property in Dubai, the government transfer fee is 4.0% paid to the Dubai Land Department (DLD) plus AED 580 for the title deed. Additionally, Registration Trustee offices charge AED 4,000 (+ 5% VAT) for properties of AED 500k and above, along with the standard 2% (+ VAT) brokerage commission. Would you like me to calculate the total acquisition budget for a specific purchase price?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  if (/ejari|tenancy|deposit|எஜாரி|இஜாரி|إيجاري/i.test(lower)) {
    context.stage = 'advisory';
    const reply = lang === 'ta'
      ? "துபாயில் அனைத்து வாடகை ஒப்பந்தங்களும் நிலத் துறையின் 'எஜாரி' (Ejari) அமைப்பில் பதிவு செய்யப்படுவது கட்டாயமாகும். பாதுகாப்பு வைப்புத் தொகை பொதுவாக மரச்சாமான்கள் அற்ற இல்லங்களுக்கு 5% மற்றும் மரச்சாமான்கள் உள்ள இல்லங்களுக்கு 10% ஆகும். நீங்கள் அப்பார்ட்மெண்ட் அல்லது வில்லா வாடகைக்கு தேடுகிறீர்களா?"
      : lang === 'ar'
      ? "يعد تسجيل عقد الإيجار عبر نظام 'إيجاري' التابع لدائرة الأراضي والأملاك إلزامياً لتوثيق العلاقة الإيجارية وحماية حقوق الطرفين. تبلغ وديعة التأمين 5% للعقارات غير المفروشة و10% للعقارات المفروشة. هل تبحث عن شقة للإيجار السنوي أم فيلا سكنية؟"
      : "All Dubai residential leases must be registered through the official DLD Ejari system to legally protect both parties. Standard security deposits are 5% of annual rent for unfurnished properties and 10% for furnished residences, and DEWA activates automatically upon registration. Are you looking for a rental apartment or a family villa?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  if (/mortgage|down payment|ltv|வங்கி கடன்|رهن|تمويل/i.test(lower)) {
    context.stage = 'advisory';
    const reply = lang === 'ta'
      ? "ஐக்கிய அரபு அமீரக மத்திய வங்கி விதிகளின்படி, வெளிநாட்டினர் AED 5 மில்லியனுக்கு உட்பட்ட முதல் இல்லத்திற்கு 80% வரை வீட்டுக் கடன் பெறலாம் (20% முன்பணம்). நீங்கள் வங்கி கடன் மூலம் இல்லம் வாங்க திட்டமிடுகிறீர்களா?"
      : lang === 'ar'
      ? "تسمح لوائح المصرف المركزي الإماراتي للمقيمين الأجانب بالحصول على تمويل عقاري بنسبة تصل إلى 80% من قيمة العقار الأول (دفعة أولى 20%) للعقارات حتى 5 ملايين درهم. هل ترغب في حساب القسط الشهري أو مناقشة خيارات التمويل؟"
      : "Under UAE Central Bank regulations, expatriate buyers can finance up to 80% Loan-to-Value (LTV) for first home purchases under AED 5 million, requiring a 20% down payment (or 15% for UAE nationals). Would you like to explore financing options or calculate estimated monthly installments?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  if (/family|kids|children|school|khda|பள்ளி|குடும்பம்|مدارس|عائلة/i.test(lower)) {
    context.stage = 'advisory';
    const reply = lang === 'ta'
      ? "குடும்பத்துடன் குடியேற துபாய் ஹில்ஸ் எஸ்டேட் மற்றும் அரேபியன் ரான்செஸ் மிகச் சிறந்த பகுதிகளாகும். இங்கு KHDA 'Outstanding' தரவரிசை பெற்ற JESS மற்றும் GEMS வெலிங்டன் போன்ற தலைசிறந்த சர்வதேச பள்ளிகள், பூங்காக்கள் மற்றும் கிங்ஸ் காலேஜ் மருத்துவமனை உள்ளன. நீங்கள் குடும்பத்திற்கு வில்லா விரும்புகிறீர்களா அல்லது டவுன்ஹவுஸ் பார்க்கிறீர்களா?"
      : lang === 'ar'
      ? "تعتبر مجمعات دبي هيلز استيت والمرابع العربية أفضل الوجهات للعائلات، وتضم مدارس دولية مرموقة بتقييم 'متميز' من هيئة المعرفة (KHDA) مثل مدرسة جميرا للتخاطب بالإنجليزية وأكاديمية جيمس ولينغتون. هل تفضلون فيلا عائلية أم تاون هاوس؟"
      : "For family relocation, Dubai Hills Estate and Arabian Ranches offer the ideal master-planned suburban lifestyle, featuring KHDA 'Outstanding' accredited schools like Jumeirah English Speaking School (JESS) and GEMS Wellington Academy, pedestrian parks, and King's College Hospital. Would you prefer an independent family villa or a contemporary townhouse?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  if (/waterfront|beach|sea view|கடற்கரை|بحر|شاطئ/i.test(lower)) {
    context.stage = 'advisory';
    const reply = lang === 'ta'
      ? "துபாயில் பாம் ஜுமேரா, துபாய் மரினா மற்றும் JBR ஆகியவை உலகத்தரம் வாய்ந்த கடற்கரை வாழ்க்கை முறையை வழங்குகின்றன. இவற்றில் நேரடி கடல் பார்வை மற்றும் கடற்கரை வசதிகள் உள்ளன. நீங்கள் வாடகைக்கு அல்லது வாங்குவதற்கு எவ்வகை இல்லத்தை விரும்புகிறீர்கள்?"
      : lang === 'ar'
      ? "توفر دبي خيارات استثنائية للحياة الشاطئية والواجهات البحرية، ولا سيما في نخلة جميرا ودبي مارينا وجميرا بيتش ريزيدنس (JBR)، حيث الإطلالات البحرية المباشرة والمراسي الفاخرة. هل تفضلون شقة بإطلالة مائية أم فيلا شاطئية خاصة؟"
      : "Dubai offers premier waterfront living across Palm Jumeirah, Dubai Marina, and JBR, featuring private beach access, yacht marinas, and panoramic sea views. Would you prefer an iconic waterfront apartment or an exclusive beachfront villa?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  if (/buy or rent|buying vs renting|வாங்குவது vs வாடகை|شراء أم استئجار/i.test(lower)) {
    context.stage = 'advisory';
    const reply = lang === 'ta'
      ? "நீங்கள் 4 ஆண்டுகள் துபாயில் தங்க திட்டமிட்டிருந்தால், வாடகைக்கு இருப்பதை விட சொந்தமாக வாங்குவது நிதி ரீதியாக மிகவும் பயனளிக்கும். சொத்து வாங்குவதற்கான செலவுகள் (சுமார் 6%-7%) 3-4 ஆண்டுகளில் வாடகை சேமிப்பு மற்றும் சொத்து மதிப்பு உயர்வு மூலம் ஈடுசெய்யப்படும். நீங்கள் நீண்ட கால தங்குவதற்கு வீடு பார்க்கிறீர்களா அல்லது முதலீட்டு நோக்கில் பார்க்கிறீர்களா?"
      : lang === 'ar'
      ? "إذا كنتم تخططون للإقامة في دبي لمدة 4 سنوات، فإن الشراء يتفوق مالياً على الإيجار. تسترد تكاليف الشراء الأولية البالغة 6% إلى 7% في غضون 3 إلى 4 سنوات عبر توفير مبالغ الإيجار ونمو القيمة السوقية للعقار وتجنب الزيادات السنوية. هل تبحثون عن استقرار سكني دائم أم الاستثمار بعد المغادرة؟"
      : "If residing in Dubai for 4 years, buying typically offers superior financial returns over renting. Upfront purchasing costs of ~6% to 7% are typically amortized and recouped within 3 to 4 years through rental savings and capital appreciation, while protecting you from annual rent escalation. Are you looking for a long-term primary home or a future investment asset?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  // 7. Purpose Selection (Buy vs Rent vs Invest vs Sell)
  if (/want to buy|looking to buy|like to buy|purchase|வாங்குவதற்கு|شراء/i.test(lower)) {
    context.purpose = 'For Sale';
    context.stage = 'discovery';
    const reply = lang === 'ta'
      ? "வாழ்த்துக்கள்! துபாயில் முழு உரிமை சொத்துக்கள் வாங்குவது மிக சிறந்த முதலீடு. நீங்கள் துபாய் மரினா, டவுன்டவுன் அல்லது பாம் ஜுமேரா போன்ற எந்த பகுதியை விரும்புகிறீர்கள்?"
      : lang === 'ar'
      ? "قرار ممتاز! يوفر التملك الحر في دبي عوائد استثمارية قوية وبدون ضرائب. ما هي المناطق المفضلة لديكم، مثل وسط مدينة دبي أو دبي مارينا؟"
      : "Excellent choice! Freehold ownership in Dubai offers strong capital growth and zero property taxes. Which community interests you most—such as Downtown Dubai or Dubai Marina?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  if (/want to rent|looking to rent|like to rent|for rent|annual rent|வாடகைக்கு|إيجار/i.test(lower)) {
    context.purpose = 'For Rent';
    context.stage = 'discovery';
    const reply = lang === 'ta'
      ? "மகிழ்ச்சி! துபாயில் சிறந்த வாடகை குடியிருப்புகள் உள்ளன. நீங்கள் எத்தனை படுக்கையறைகள் கொண்ட இல்லத்தை தேடுகிறீர்கள், 1 அல்லது 2 BHK?"
      : lang === 'ar'
      ? "يسعدني مساعدتكم في العثور على أفضل خيارات الإيجار. كم عدد غرف النوم التي تبحثون عنها، غرفة أم غرفتين وصالة؟"
      : "Wonderful! Dubai offers fantastic rental residences. How many bedrooms are you looking for—a 1-bedroom or 2-bedroom home?";

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  // Locations
  const knownLocations = ['dubai marina', 'palm jumeirah', 'downtown dubai', 'business bay', 'dubai hills', 'arabian ranches'];
  for (const loc of knownLocations) {
    if (lower.includes(loc)) {
      context.location = loc.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // Bedrooms
  if (/1[\s-]*bed|one[\s-]*bed/i.test(lower)) context.bedrooms = 1;
  else if (/2[\s-]*bed|two[\s-]*bed/i.test(lower)) context.bedrooms = 2;
  else if (/3[\s-]*bed|three[\s-]*bed/i.test(lower)) context.bedrooms = 3;

  // 8. General Follow-Up / Discovery
  if (context.location && context.bedrooms !== undefined) {
    const reply = lang === 'ta'
      ? `உங்கள் விருப்பப்படி ${context.location} பகுதியில் ${context.bedrooms} படுக்கையறை இல்லங்களை குறித்துக் கொண்டேன். உங்களின் உத்தேச பட்ஜெட் வரம்பு எவ்வளவு?`
      : lang === 'ar'
      ? `تم تدوين تفضيلاتكم لـ ${context.bedrooms} غرف نوم في ${context.location}. ما هو النطاق التقديري للميزانية المحددة لديكم؟`
      : `I have noted your interest in ${context.bedrooms}-bedroom residences in ${context.location}. What is your approximate annual budget or price range?`;

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  if (context.location) {
    const reply = lang === 'ta'
      ? `${context.location} ஒரு சிறந்த பகுதி. நீங்கள் எத்தனை படுக்கையறைகள் கொண்ட இல்லத்தை தேடுகிறீர்கள்?`
      : lang === 'ar'
      ? `تعتبر ${context.location} من أرقى المناطق السكنية في دبي. كم عدد غرف النوم التي تبحثون عنها؟`
      : `${context.location} is an outstanding choice. How many bedrooms are you looking for?`;

    return { reply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
  }

  // Default natural follow-up
  const defaultReply = lang === 'ta'
    ? "துபாயில் உங்களுக்கு பொருத்தமான இல்லத்தை தேர்ந்தெடுக்க உதவ தயாராக உள்ளேன். நீங்கள் வாடகைக்கு அல்லது வாங்குவதற்கு பார்க்கிறீர்களா?"
    : lang === 'ar'
    ? "يسعدني مساعدتكم في استكشاف سوق دبي العقاري. هل تتطلعون إلى الشراء أم الإيجار؟"
    : "I'd be glad to assist with your Dubai real estate search. Are you looking to purchase a property or explore rental residences?";

  return { reply: defaultReply, context, propertyRecommendations: [], source: 'fallback', quotaExceeded: true };
}

