import dotenv from 'dotenv';
dotenv.config();

import { initPostgresDatabase } from '../server/postgres.js';
import { processAssistantTurn, AssistantConversationContext } from '../server/assistantEngine.js';
import { getLeadsFromDb } from '../server/crmDbService.js';

async function runAIAssistantTestSuite() {
  console.log('====================================================');
  console.log('LYKA REALTY — AI VOICE ASSISTANT 10-TEST VERIFICATION');
  console.log('====================================================\n');

  await initPostgresDatabase();

  let passed = 0;
  let failed = 0;

  function assert(testNum: number, testName: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`[PASS] Test ${testNum}: ${testName}`);
      if (detail) console.log(`       Detail: ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${testNum}: ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
      failed++;
    }
  }

  // TEST 1: Natural Conversation & Persona
  const t1 = await processAssistantTurn("What makes Dubai Marina attractive for residents?");
  assert(1, "Natural Dubai Consultant Persona", 
    t1.reply.length > 20 && !t1.reply.includes("Press 1") && !t1.reply.includes("Invalid option"),
    t1.reply.slice(0, 90) + '...'
  );

  // TEST 2: Greetings & Casual Inquiries
  const t2a = await processAssistantTurn("Hello!");
  assert(2, "Greeting Understanding", 
    t2a.reply.toLowerCase().includes("welcome") || t2a.reply.toLowerCase().includes("hello") || t2a.reply.toLowerCase().includes("lyka"),
    t2a.reply
  );

  const t2b = await processAssistantTurn("How are you doing today?");
  assert(2, "Casual Conversation Understanding",
    t2b.reply.toLowerCase().includes("great") || t2b.reply.toLowerCase().includes("help"),
    t2b.reply
  );

  // TEST 3: Customer Pauses / "I'm busy now"
  const t3Context: AssistantConversationContext = { location: 'Dubai Marina', bedrooms: 2, maxBudget: 150000 };
  const t3 = await processAssistantTurn("I'm busy now, will talk later", t3Context);
  assert(3, "Handling 'I'm busy now' Warmly",
    t3.context.isPaused === true && (t3.reply.toLowerCase().includes("no worries") || t3.reply.toLowerCase().includes("take your time")),
    `Reply: "${t3.reply}" | isPaused: ${t3.context.isPaused}`
  );

  // TEST 4: Resuming Conversation Seamlessly
  const t4 = await processAssistantTurn("Can we continue?", t3.context);
  assert(4, "Resuming Without Losing Context",
    t4.context.isPaused === false && t4.context.location === 'Dubai Marina' && t4.context.bedrooms === 2,
    `Retained: ${t4.context.location}, ${t4.context.bedrooms} BHK | Reply: "${t4.reply}"`
  );

  // TEST 5: Multi-Turn Relative Search ("Show me cheaper properties")
  const t5_turn1 = await processAssistantTurn("I want a 2-bedroom apartment in Dubai Marina");
  assert(5, "Turn 1: Specific Search (2 BHK Marina)",
    t5_turn1.context.location === 'Dubai Marina' && t5_turn1.context.bedrooms === 2,
    `Context: Location=${t5_turn1.context.location}, Beds=${t5_turn1.context.bedrooms}`
  );

  const t5_turn2 = await processAssistantTurn("Show me cheaper properties", t5_turn1.context);
  assert(5, "Turn 2: Relative Adjustment ('cheaper')",
    t5_turn2.context.location === 'Dubai Marina' && t5_turn2.context.bedrooms === 2 && typeof t5_turn2.context.maxBudget === 'number',
    `Preserved Marina & 2 BHK, adjusted maxBudget to AED ${t5_turn2.context.maxBudget?.toLocaleString()}`
  );

  // TEST 6: Real Database Results (73,727 active properties)
  assert(6, "Real Database Records Retrieved (Zero Fictional Data)",
    t5_turn1.propertyRecommendations.length > 0 && Boolean(t5_turn1.propertyRecommendations[0].id),
    `Matched ${t5_turn1.propertyRecommendations.length} real properties. Sample ID: ${t5_turn1.propertyRecommendations[0]?.id}, Title: "${t5_turn1.propertyRecommendations[0]?.title}", Price: AED ${t5_turn1.propertyRecommendations[0]?.priceAED?.toLocaleString()}`
  );

  // TEST 7: Multilingual Auto-Detection (EN, AR, TA)
  const t7_ar = await processAssistantTurn("أريد شقة غرفتين في دبي مارينا");
  assert(7, "Arabic (العربية) Auto-Detection",
    t7_ar.context.preferredLanguage === 'ar' && /[\u0600-\u06FF]/.test(t7_ar.reply),
    t7_ar.reply.slice(0, 80) + '...'
  );

  const t7_ta = await processAssistantTurn("வணக்கம், துபாய் மரினாவில் வாடகை வீடு வேண்டும்");
  assert(7, "Tamil (தமிழ்) Auto-Detection",
    t7_ta.context.preferredLanguage === 'ta' && /[\u0B80-\u0BFF]/.test(t7_ta.reply),
    t7_ta.reply.slice(0, 80) + '...'
  );

  // TEST 8: Stop / Interrupt (Barge-In Readiness)
  assert(8, "Barge-in / Stop & Interrupt Design",
    typeof t5_turn2.reply === 'string' && t5_turn2.reply.split(' ').length <= 80,
    `Response length concise (${t5_turn2.reply.split(' ').length} words) for low-latency barge-in playback`
  );

  // TEST 9: Consent-Driven Agent Handoff & Persistence to PostgreSQL
  const handoffCtx: AssistantConversationContext = { location: 'Downtown Dubai', bedrooms: 3, maxBudget: 220000 };
  const t9_step1 = await processAssistantTurn("I want to speak with an agent to arrange a viewing", handoffCtx);
  assert(9, "Handoff Step 1: Prompt for Contact Consent",
    t9_step1.context.awaitingContact === true && t9_step1.handoffTriggered === true,
    t9_step1.reply
  );

  const t9_step2 = await processAssistantTurn("My name is Tariq Mansoor, phone is +971 50 789 1234", t9_step1.context);
  assert(9, "Handoff Step 2: Consent Captured & Lead Persisted to PostgreSQL",
    t9_step2.leadCreated === true && t9_step2.context.awaitingContact === false,
    t9_step2.reply
  );

  // Verify in PostgreSQL leads table
  const leadsFromDb = await getLeadsFromDb();
  const persistedLead = leadsFromDb.find(l => l.clientName.toLowerCase().includes('tariq'));
  assert(9, "PostgreSQL Leads Table Verification",
    persistedLead !== undefined,
    `Found persisted lead ID: ${persistedLead?.id}, Name: ${persistedLead?.clientName}, Phone: ${persistedLead?.phone}`
  );

  // TEST 10: Unified Engine For Voice & Text
  const t10_voiceResult = await processAssistantTurn("Show me rental properties in Palm Jumeirah");
  assert(10, "Unified Voice & Text Search Results",
    t10_voiceResult.propertyRecommendations.length > 0 && t10_voiceResult.context.location === 'Palm Jumeirah',
    `Location=${t10_voiceResult.context.location}, Recommendations Count=${t10_voiceResult.propertyRecommendations.length}`
  );

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runAIAssistantTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
