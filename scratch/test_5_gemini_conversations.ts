import dotenv from 'dotenv';
dotenv.config();

import { processAssistantTurn, AssistantConversationContext } from '../server/assistantEngine.js';
import { knowledgeService } from '../server/knowledgeService.js';

interface TestResult {
  testNumber: number;
  testName: string;
  userMessage: string;
  contextBefore: AssistantConversationContext;
  assistantReply: string;
  contextAfter: AssistantConversationContext;
  source: 'gemini' | 'ollama' | 'engine';
  isRealGemini: boolean;
  propertyRecommendationsCount: number;
  checksPassed: { [checkName: string]: boolean };
}

async function run5GeminiTests() {
  console.log('===============================================================');
  console.log('LYKA REALTY AI ASSISTANT — 5-CONVERSATION AUDIT');
  console.log('===============================================================');

  // Verify Knowledge Base is loaded
  const chunkCount = await knowledgeService.loadKnowledgeBase();
  console.log(`Knowledge Base loaded: ${chunkCount} chunks.`);
  
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  console.log(`Gemini API Key configured: ${hasGeminiKey ? 'YES' : 'NO (Will utilize deterministic fallback)'}`);
  
  let geminiApiCallsMade = 0;
  const results: TestResult[] = [];

  // -----------------------------------------------------------------
  // TEST 1: GREETINGS & CASUAL CONVERSATION (Zero Forced Property Search)
  // -----------------------------------------------------------------
  console.log('\n--- Running Test 1: Greetings & Small Talk ---');
  let ctx1: AssistantConversationContext = {};
  const history1: { role: string; text: string }[] = [];
  const msg1 = "Good morning! How are you doing today?";
  
  const res1 = await processAssistantTurn(msg1, ctx1, history1);
  if (res1.source === 'gemini') geminiApiCallsMade++;

  results.push({
    testNumber: 1,
    testName: "Greetings & Casual Conversation",
    userMessage: msg1,
    contextBefore: { ...ctx1 },
    assistantReply: res1.reply,
    contextAfter: { ...res1.context },
    source: res1.source,
    isRealGemini: res1.source === 'gemini',
    propertyRecommendationsCount: res1.propertyRecommendations.length,
    checksPassed: {
      "Zero forced property search": res1.propertyRecommendations.length === 0,
      "Answered how are you": /(great|well|good|fine|doing)/i.test(res1.reply),
      "Single follow-up question": (res1.reply.match(/\?/g) || []).length <= 1,
      "English language preserved": !/[\u0B80-\u0BFF\u0600-\u06FF]/.test(res1.reply)
    }
  });

  // -----------------------------------------------------------------
  // TEST 2: PROPERTY DISCOVERY (Gathering Purpose & Criteria)
  // -----------------------------------------------------------------
  console.log('\n--- Running Test 2: Property Discovery ---');
  let ctx2: AssistantConversationContext = { ...res1.context };
  const history2 = [
    { role: 'user', text: msg1 },
    { role: 'assistant', text: res1.reply }
  ];
  const msg2 = "I'm looking to rent a 2 bedroom apartment in Dubai Marina under 120k AED";
  
  const res2 = await processAssistantTurn(msg2, ctx2, history2);
  if (res2.source === 'gemini') geminiApiCallsMade++;

  results.push({
    testNumber: 2,
    testName: "Property Discovery & Criteria Extraction",
    userMessage: msg2,
    contextBefore: { ...ctx2 },
    assistantReply: res2.reply,
    contextAfter: { ...res2.context },
    source: res2.source,
    isRealGemini: res2.source === 'gemini',
    propertyRecommendationsCount: res2.propertyRecommendations.length,
    checksPassed: {
      "Location extracted (Dubai Marina)": res2.context.location === 'Dubai Marina',
      "Bedrooms extracted (2 BHK)": res2.context.bedrooms === 2,
      "Purpose extracted (For Rent)": res2.context.purpose === 'For Rent',
      "Budget extracted (120,000 AED)": res2.context.maxBudget === 120000,
      "No robotic repetition of welcome": !/Welcome to LYKA Realty/i.test(res2.reply)
    }
  });

  // -----------------------------------------------------------------
  // TEST 3: SHORT ANSWERS (Handling brevity without breaking dialog)
  // -----------------------------------------------------------------
  console.log('\n--- Running Test 3: Short Answers ---');
  let ctx3: AssistantConversationContext = { ...res2.context };
  const history3 = [
    ...history2,
    { role: 'user', text: msg2 },
    { role: 'assistant', text: res2.reply }
  ];
  const msg3 = "Cool";
  
  const res3 = await processAssistantTurn(msg3, ctx3, history3);
  if (res3.source === 'gemini') geminiApiCallsMade++;

  results.push({
    testNumber: 3,
    testName: "Short Answers Handling",
    userMessage: msg3,
    contextBefore: { ...ctx3 },
    assistantReply: res3.reply,
    contextAfter: { ...res3.context },
    source: res3.source,
    isRealGemini: res3.source === 'gemini',
    propertyRecommendationsCount: res3.propertyRecommendations.length,
    checksPassed: {
      "Handled brevity smoothly": res3.reply.length > 10,
      "Did not crash or repeat welcome": !/Welcome to LYKA Realty/i.test(res3.reply),
      "Maintained context intact": res3.context.location === 'Dubai Marina' && res3.context.bedrooms === 2
    }
  });

  // -----------------------------------------------------------------
  // TEST 4: CONVERSATION MEMORY & STATEMENT CORRECTION
  // -----------------------------------------------------------------
  console.log('\n--- Running Test 4: Conversation Memory & Correction ---');
  let ctx4: AssistantConversationContext = { ...res3.context };
  const history4 = [
    ...history3,
    { role: 'user', text: msg3 },
    { role: 'assistant', text: res3.reply }
  ];
  const msg4 = "Wait, I made a mistake, my budget is 3 million and I want to buy, not rent";
  
  const res4 = await processAssistantTurn(msg4, ctx4, history4);
  if (res4.source === 'gemini') geminiApiCallsMade++;

  results.push({
    testNumber: 4,
    testName: "Conversation Memory & Correction Update",
    userMessage: msg4,
    contextBefore: { ...ctx4 },
    assistantReply: res4.reply,
    contextAfter: { ...res4.context },
    source: res4.source,
    isRealGemini: res4.source === 'gemini',
    propertyRecommendationsCount: res4.propertyRecommendations.length,
    checksPassed: {
      "Corrected budget to 3M": res4.context.maxBudget === 3000000,
      "Corrected purpose to For Sale": res4.context.purpose === 'For Sale',
      "Preserved previous location (Dubai Marina)": res4.context.location === 'Dubai Marina',
      "Confirmed correction cleanly": /(update|noted|understood|criteria|sale|buy)/i.test(res4.reply)
    }
  });

  // -----------------------------------------------------------------
  // TEST 5: LANGUAGE PRESERVATION (Tanglish & Multilingual Dialogue)
  // -----------------------------------------------------------------
  console.log('\n--- Running Test 5: Language Preservation (Tanglish/Tamil) ---');
  let ctx5: AssistantConversationContext = {};
  const history5: { role: string; text: string }[] = [];
  const msg5 = "Vanakkam bro, Dubai la budget friendly apartment kedaikuma?";
  
  const res5 = await processAssistantTurn(msg5, ctx5, history5);
  if (res5.source === 'gemini') geminiApiCallsMade++;

  results.push({
    testNumber: 5,
    testName: "Language Preservation (Tanglish)",
    userMessage: msg5,
    contextBefore: { ...ctx5 },
    assistantReply: res5.reply,
    contextAfter: { ...res5.context },
    source: res5.source,
    isRealGemini: res5.source === 'gemini',
    propertyRecommendationsCount: res5.propertyRecommendations.length,
    checksPassed: {
      "Language detected as tanglish or tamil": res5.context.preferredLanguage === 'tanglish' || res5.context.preferredLanguage === 'ta',
      "Responded in Tanglish/Tamil vocabulary": /(vanakkam|bro|kedaikkum|kedaikuma|nalla|romba|dubai)/i.test(res5.reply),
      "Zero forced property push": res5.propertyRecommendations.length === 0,
      "Single question follow-up": (res5.reply.match(/\?/g) || []).length <= 1
    }
  });

  // -----------------------------------------------------------------
  // SUMMARY REPORT
  // -----------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('AUDIT SUMMARY & RESULTS');
  console.log('===============================================================');
  console.log(`Total Gemini conversation sessions run: ${results.length} (Capped at exactly 5)`);
  console.log(`Total Real Gemini API calls made: ${geminiApiCallsMade}`);
  console.log(`Execution Engine used: ${geminiApiCallsMade > 0 ? 'REAL GEMINI 2.5 FLASH' : 'DETERMINISTIC CONVERSATIONAL FALLBACK ENGINE'}`);
  console.log('---------------------------------------------------------------');

  for (const r of results) {
    console.log(`\nTEST #${r.testNumber}: ${r.testName}`);
    console.log(`Customer Message: "${r.userMessage}"`);
    console.log(`Assistant Reply:  "${r.assistantReply}"`);
    console.log(`Engine Source:    [${r.source.toUpperCase()}] (Real Gemini: ${r.isRealGemini ? 'YES' : 'NO'})`);
    console.log(`Context After:    ${JSON.stringify(r.contextAfter)}`);
    console.log(`Checks Evaluation:`);
    for (const [chk, passed] of Object.entries(r.checksPassed)) {
      console.log(`  - ${chk}: ${passed ? 'PASSED' : 'FAILED'}`);
    }
  }

  const allChecksPassed = results.every(r => Object.values(r.checksPassed).every(v => v === true));
  console.log('\n---------------------------------------------------------------');
  console.log(`OVERALL STATUS: ${allChecksPassed ? '100% OF CHECKS PASSED' : 'SOME CHECKS FAILED'}`);
  console.log('===============================================================');
}

run5GeminiTests().catch(console.error);

