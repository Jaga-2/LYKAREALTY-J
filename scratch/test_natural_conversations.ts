import dotenv from 'dotenv';
dotenv.config();

import { initPostgresDatabase } from '../server/postgres.js';
import { processAssistantTurn } from '../server/assistantEngine.js';

async function testNaturalConversations() {
  console.log('====================================================');
  console.log('LYKA REALTY — NATURAL EVERYDAY CONVERSATION AUDIT');
  console.log('====================================================\n');

  await initPostgresDatabase();

  let passed = 0;
  let failed = 0;

  function assert(num: number, title: string, condition: boolean, detail: string) {
    if (condition) {
      console.log(`✅ [PASS] #${num}: ${title}\n       ${detail}\n`);
      passed++;
    } else {
      console.error(`❌ [FAIL] #${num}: ${title}\n       ${detail}\n`);
      failed++;
    }
  }

  // 1. GREETINGS & CASUAL TALK (No forced property search)
  const turn1 = await processAssistantTurn("Good morning! How are you doing today?");
  assert(1, "Greeting + Casual Small Talk (Zero forced properties)",
    turn1.propertyRecommendations.length === 0 && 
    (turn1.reply.toLowerCase().includes("good morning") || turn1.reply.toLowerCase().includes("great")),
    `Reply: "${turn1.reply}" | Properties Returned: ${turn1.propertyRecommendations.length}`
  );

  // 2. CASUAL TALK: "Hi" alone
  const turn2 = await processAssistantTurn("Hi!");
  assert(2, "Simple 'Hi' Greeting",
    turn2.propertyRecommendations.length === 0 && turn2.reply.toLowerCase().includes("welcome"),
    `Reply: "${turn2.reply}" | Properties Returned: ${turn2.propertyRecommendations.length}`
  );

  // 3. LIFESTYLE INTEREST: Family with kids (No forced property search)
  const turn3 = await processAssistantTurn("I'm planning to move to Dubai with my family. We have two school-aged kids.");
  assert(3, "Understanding Family Lifestyle Interests",
    turn3.propertyRecommendations.length === 0 && 
    (turn3.reply.toLowerCase().includes("family") || turn3.reply.toLowerCase().includes("dubai hills") || turn3.reply.toLowerCase().includes("school")),
    `Reply: "${turn3.reply}" | Properties Returned: ${turn3.propertyRecommendations.length}`
  );

  // 4. PURPOSE DISCOVERY: Clarifying Buy vs Rent
  const turn4 = await processAssistantTurn("We want to buy a home for our family.", turn3.context);
  assert(4, "Gradual Purpose Identification (Buy)",
    turn4.context.purpose === 'For Sale' && 
    (turn4.reply.toLowerCase().includes("freehold") || turn4.reply.toLowerCase().includes("purchase") || turn4.reply.toLowerCase().includes("choice")),
    `Purpose set: ${turn4.context.purpose} | Reply: "${turn4.reply}"`
  );

  // 5. LIFESTYLE: Coastal / Waterfront views
  const turn5 = await processAssistantTurn("We really love waterfront and sea views.");
  assert(5, "Understanding Waterfront Interests",
    turn5.propertyRecommendations.length === 0 &&
    (turn5.reply.toLowerCase().includes("waterfront") || turn5.reply.toLowerCase().includes("palm") || turn5.reply.toLowerCase().includes("marina")),
    `Reply: "${turn5.reply}" | Properties Returned: ${turn5.propertyRecommendations.length}`
  );

  // 6. ADVISORY: Golden Visa question
  const turn6 = await processAssistantTurn("What are the rules for the 10-year Golden Visa?");
  assert(6, "Advisory on Golden Visa",
    turn6.propertyRecommendations.length === 0 &&
    (turn6.reply.includes("2 million") || turn6.reply.toLowerCase().includes("golden visa")),
    `Reply: "${turn6.reply}" | Properties Returned: ${turn6.propertyRecommendations.length}`
  );

  // 7. EXPLICIT PROPERTY SEARCH (Now search the 73,727 database records!)
  const turn7 = await processAssistantTurn("Show me 2-bedroom apartments in Dubai Marina", turn4.context);
  assert(7, "Explicit Property Search (Live PostgreSQL Records)",
    turn7.propertyRecommendations.length > 0 &&
    turn7.context.location === 'Dubai Marina' &&
    turn7.context.bedrooms === 2,
    `Matched ${turn7.propertyRecommendations.length} listings. Top: "${turn7.propertyRecommendations[0]?.title}" (AED ${turn7.propertyRecommendations[0]?.priceAED?.toLocaleString()}) in ${turn7.propertyRecommendations[0]?.location}`
  );

  // 8. RELATIVE PRICE ADJUSTMENT ("Show me cheaper properties")
  const turn8 = await processAssistantTurn("Show me cheaper properties", turn7.context);
  assert(8, "Relative Adjustment Retains Marina & 2 BHK with Lower Price",
    turn8.propertyRecommendations.length > 0 &&
    turn8.context.location === 'Dubai Marina' &&
    turn8.context.bedrooms === 2 &&
    typeof turn8.context.maxBudget === 'number',
    `Preserved Location: ${turn8.context.location}, Beds: ${turn8.context.bedrooms}, Adjusted Budget: AED ${turn8.context.maxBudget?.toLocaleString()}`
  );

  // 9. MULTILINGUAL: Arabic Natural Conversation
  const turn9_ar = await processAssistantTurn("صباح الخير، كيف حالك؟");
  assert(9, "Arabic Natural Greeting & Casual Talk",
    turn9_ar.propertyRecommendations.length === 0 &&
    turn9_ar.context.preferredLanguage === 'ar' &&
    /[\u0600-\u06FF]/.test(turn9_ar.reply),
    `Reply (Arabic): "${turn9_ar.reply}"`
  );

  // 10. MULTILINGUAL: Tamil Natural Conversation
  const turn10_ta = await processAssistantTurn("காலை வணக்கம், எப்படி இருக்கீங்க?");
  assert(10, "Tamil Natural Greeting & Casual Talk",
    turn10_ta.propertyRecommendations.length === 0 &&
    turn10_ta.context.preferredLanguage === 'ta' &&
    /[\u0B80-\u0BFF]/.test(turn10_ta.reply),
    `Reply (Tamil): "${turn10_ta.reply}"`
  );

  // 11. PAUSE & RESUME
  const turn11_busy = await processAssistantTurn("I'm busy now, will talk later", turn8.context);
  assert(11, "Pause without context loss",
    turn11_busy.context.isPaused === true && turn11_busy.reply.toLowerCase().includes("no worries"),
    `Reply: "${turn11_busy.reply}"`
  );

  const turn11_resume = await processAssistantTurn("Can we continue?", turn11_busy.context);
  assert(11, "Resume retaining Dubai Marina context",
    turn11_resume.context.isPaused === false && turn11_resume.context.location === 'Dubai Marina',
    `Reply: "${turn11_resume.reply}"`
  );

  console.log('====================================================');
  console.log(`TOTAL NATURAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

testNaturalConversations().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});

