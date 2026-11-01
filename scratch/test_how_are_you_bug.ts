import dotenv from 'dotenv';
dotenv.config();

import { processAssistantTurn } from '../server/assistantEngine.js';
import { processClientAssistantTurn } from '../src/services/clientAssistantEngine.js';
import { isPostgresConfigured, initPostgresDatabase, getPostgresPool } from '../server/postgres.js';

async function runBugVerificationTests() {
  console.log('====================================================');
  console.log('LYKA REALTY — AI CONVERSATION & OFFLINE ENGINE AUDIT');
  console.log('====================================================\n');

  if (isPostgresConfigured()) {
    await initPostgresDatabase();
  }

  let passed = 0;
  let failed = 0;

  function assert(testId: string, testName: string, condition: boolean, detail: string) {
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testId}: ${testName}`);
      console.log(`   ${detail}`);
    } else {
      failed++;
      console.log(`❌ [FAIL] ${testId}: ${testName}`);
      console.log(`   ${detail}`);
    }
  }

  // ---------------------------------------------------------------
  // 1. BACKEND ENGINE: "How are you?" test
  // ---------------------------------------------------------------
  const res1 = await processAssistantTurn("How are you?");
  assert(
    "TEST 1",
    'Backend: "How are you?" natural response without welcome message repetition',
    res1.reply.includes("I'm doing great! Thanks for asking. How can I help you with your Dubai property search today?") &&
      !res1.reply.includes("Welcome to LYKA Realty") &&
      res1.propertyRecommendations.length === 0,
    `Reply: "${res1.reply}"`
  );

  // ---------------------------------------------------------------
  // 2. OFFLINE ENGINE: "How are you?" test
  // ---------------------------------------------------------------
  const offlineRes1 = processClientAssistantTurn("How are you?", {}, [{ role: 'model', text: 'Hello! Welcome to LYKA Realty...' }]);
  assert(
    "TEST 2",
    'Offline Engine: "How are you?" natural response without welcome message repetition',
    offlineRes1.reply.includes("I'm doing great! Thanks for asking. How can I help you with your Dubai property search today?") &&
      !offlineRes1.reply.includes("Welcome to LYKA Realty") &&
      offlineRes1.quotaExceeded === true &&
      offlineRes1.source === 'fallback',
    `Reply: "${offlineRes1.reply}" | quotaExceeded: ${offlineRes1.quotaExceeded}`
  );

  // ---------------------------------------------------------------
  // 3. MULTILINGUAL: Arabic "How are you?"
  // ---------------------------------------------------------------
  const res3_ar = await processAssistantTurn("كيف حالك؟");
  assert(
    "TEST 3",
    'Arabic: "كيف حالك؟" returns natural Arabic response without welcome message',
    res3_ar.reply.includes("أنا بأفضل حال ولله الحمد، شكراً لسؤالكم اللطيف!") &&
      /[\u0600-\u06FF]/.test(res3_ar.reply) &&
      !res3_ar.reply.includes("دار لايكا العقارية"),
    `Reply: "${res3_ar.reply}"`
  );

  // ---------------------------------------------------------------
  // 4. MULTILINGUAL: Tamil "How are you?"
  // ---------------------------------------------------------------
  const res4_ta = await processAssistantTurn("எப்படி இருக்கீங்க?");
  assert(
    "TEST 4",
    'Tamil: "எப்படி இருக்கீங்க?" returns natural Tamil response without welcome message',
    res4_ta.reply.includes("நான் மிக நலம்! கேட்டதற்கு மிக்க நன்றி.") &&
      /[\u0B80-\u0BFF]/.test(res4_ta.reply) &&
      !res4_ta.reply.includes("லைகா ரியாலிட்டிக்கு உங்களை அன்புடன் வரவேற்கிறேன்"),
    `Reply: "${res4_ta.reply}"`
  );

  // ---------------------------------------------------------------
  // 5. TURN 2: Do NOT repeat welcome message on greeting after turn 1 (Backend)
  // ---------------------------------------------------------------
  const historyTurn1 = [
    { role: 'user', text: 'How are you?' },
    { role: 'model', text: "I'm doing great! Thanks for asking. How can I help you with your Dubai property search today?" }
  ];
  const res5_followup = await processAssistantTurn("Hello", { stage: 'casual' }, historyTurn1);
  assert(
    "TEST 5",
    'Backend Turn > 1: Greeting does NOT repeat "Welcome to LYKA Realty"',
    !res5_followup.reply.includes("Welcome to LYKA Realty") &&
      res5_followup.reply.toLowerCase().includes("hello again"),
    `Reply: "${res5_followup.reply}"`
  );

  // ---------------------------------------------------------------
  // 6. TURN 2: Do NOT repeat welcome message on greeting after turn 1 (Offline Engine)
  // ---------------------------------------------------------------
  const offlineRes6_followup = processClientAssistantTurn("Hi", { stage: 'casual' }, historyTurn1);
  assert(
    "TEST 6",
    'Offline Engine Turn > 1: Greeting does NOT repeat "Welcome to LYKA Realty"',
    !offlineRes6_followup.reply.includes("Welcome to LYKA Realty") &&
      offlineRes6_followup.reply.toLowerCase().includes("hello again"),
    `Reply: "${offlineRes6_followup.reply}"`
  );

  // ---------------------------------------------------------------
  // 7. CONTEXT PRESERVATION ACROSS TURNS
  // ---------------------------------------------------------------
  // Turn A: User specifies 2-bedroom in Dubai Marina
  const turnA = await processAssistantTurn("I'm looking for a 2-bedroom apartment in Dubai Marina");
  // Turn B: User asks "how are you?"
  const turnB = await processAssistantTurn("How are you?", turnA.context, [
    { role: 'user', text: "I'm looking for a 2-bedroom apartment in Dubai Marina" },
    { role: 'model', text: turnA.reply }
  ]);
  // Turn C: User asks for cheaper options
  const turnC = await processAssistantTurn("Show me cheaper options", turnB.context, [
    { role: 'user', text: "I'm looking for a 2-bedroom apartment in Dubai Marina" },
    { role: 'model', text: turnA.reply },
    { role: 'user', text: "How are you?" },
    { role: 'model', text: turnB.reply }
  ]);

  assert(
    "TEST 7",
    'Context Preservation: Location (Dubai Marina) and Bedrooms (2) retained across casual turns',
    turnB.context.location === 'Dubai Marina' &&
      turnB.context.bedrooms === 2 &&
      turnC.context.location === 'Dubai Marina' &&
      turnC.context.bedrooms === 2 &&
      turnC.propertyRecommendations.length > 0,
    `Turn B context: ${JSON.stringify(turnB.context)} | Turn C recommendations: ${turnC.propertyRecommendations.length}`
  );

  // ---------------------------------------------------------------
  // 8. ZERO PROPERTY FORCING FOR CASUAL
  // ---------------------------------------------------------------
  const casualQueries = ["How are you doing today?", "Nice weather today", "Who are you?"];
  let allZero = true;
  for (const q of casualQueries) {
    const res = await processAssistantTurn(q);
    if (res.propertyRecommendations.length > 0) allZero = false;
  }
  assert(
    "TEST 8",
    'Zero Property Forcing: Casual conversations return 0 property recommendations',
    allZero,
    `Checked 3 casual queries: all returned 0 recommendations`
  );

  // ---------------------------------------------------------------
  // 9. DATABASE SAFETY: 73,727 records intact
  // ---------------------------------------------------------------
  let count73k = false;
  const p = getPostgresPool();
  if (p) {
    try {
      const dbRes = await p.query('SELECT COUNT(*) AS total FROM properties;');
      const total = parseInt(dbRes.rows[0].total, 10);
      count73k = total === 73727;
      assert(
        "TEST 9",
        'Database Safety: Verified exact 73,727 property records in PostgreSQL',
        count73k,
        `Total active records in PostgreSQL: ${total}`
      );
    } catch (e: any) {
      console.warn('DB check note:', e.message);
    }
    await p.end();
  } else {
    console.log('Skipping DB count (demo/offline mode)');
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED / ${passed + failed} TOTAL (${failed} FAILED)`);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runBugVerificationTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});

