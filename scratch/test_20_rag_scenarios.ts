import dotenv from 'dotenv';
dotenv.config();

import { processAssistantTurn, AssistantConversationContext } from '../server/assistantEngine.js';
import { knowledgeService } from '../server/knowledgeService.js';
import { isPostgresConfigured, getPostgresPool, initPostgresDatabase } from '../server/postgres.js';

interface TestCase {
  id: number;
  name: string;
  query: string;
  initialContext?: AssistantConversationContext;
  validate: (res: any) => { pass: boolean; details: string };
}

const testCases: TestCase[] = [
  // 1. Casual greeting
  {
    id: 1,
    name: 'Casual Greeting (No Forced Search)',
    query: 'Hello!',
    validate: (res) => {
      const pass = res.reply.length > 10 &&
        res.propertyRecommendations.length === 0 &&
        (res.reply.toLowerCase().includes('welcome') || res.reply.toLowerCase().includes('help'));
      return { pass, details: `Reply: "${res.reply.slice(0, 70)}..."` };
    }
  },

  // 2. Casual small talk
  {
    id: 2,
    name: 'Casual Small Talk',
    query: 'How are you doing today?',
    validate: (res) => {
      const pass = res.reply.length > 10 &&
        res.propertyRecommendations.length === 0 &&
        (res.reply.toLowerCase().includes('great') || res.reply.toLowerCase().includes('doing'));
      return { pass, details: `Reply: "${res.reply.slice(0, 70)}..."` };
    }
  },

  // 3. Market fundamentals
  {
    id: 3,
    name: 'Market Fundamentals & Tax Benefits',
    query: 'Can you explain the Dubai property market and tax benefits?',
    validate: (res) => {
      const pass = (res.reply.includes('0%') || res.reply.toLowerCase().includes('tax') || res.reply.includes('3.6725')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 4. DLD transfer fees and transaction costs
  {
    id: 4,
    name: 'DLD Transfer Fees & Trustee Fees',
    query: 'What are the transfer fees and trustee fees when buying property?',
    validate: (res) => {
      const pass = (res.reply.includes('4%') || res.reply.includes('4.0%')) &&
        (res.reply.includes('4,000') || res.reply.includes('DLD')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 5. Renting & Ejari process
  {
    id: 5,
    name: 'Renting & Ejari Process',
    query: 'How does Ejari work and what are the security deposits?',
    validate: (res) => {
      const pass = (res.reply.toLowerCase().includes('ejari') || res.reply.includes('5%')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 6. Mortgages & LTV limits
  {
    id: 6,
    name: 'Mortgages & LTV Limits for Expats',
    query: 'What are the mortgage rules and down payment for expats?',
    validate: (res) => {
      const pass = (res.reply.includes('80%') || res.reply.includes('20%') || res.reply.toLowerCase().includes('central bank')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 7. Golden Visa requirements
  {
    id: 7,
    name: 'Golden Visa Requirements (AED 2,000,000)',
    query: 'What are the requirements for the 10-year Golden Visa?',
    validate: (res) => {
      const pass = (res.reply.includes('2,000,000') || res.reply.includes('2 million') || res.reply.includes('2M')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 8. Freehold vs Leasehold zones
  {
    id: 8,
    name: 'Freehold vs Leasehold Zones',
    query: 'What is the difference between freehold and leasehold in Dubai?',
    validate: (res) => {
      const pass = (res.reply.toLowerCase().includes('freehold') || res.reply.includes('100%') || res.reply.includes('99')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 9. Family relocation & schools
  {
    id: 9,
    name: 'Family Relocation & Top Schools',
    query: 'We are relocating with kids. What are good communities near top British schools?',
    validate: (res) => {
      const pass = (res.reply.includes('Dubai Hills') || res.reply.includes('Arabian Ranches') || res.reply.includes('KHDA')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 10. Waterfront luxury lifestyle
  {
    id: 10,
    name: 'Waterfront Luxury Living (Palm / Marina)',
    query: 'I want a waterfront home with beach access and sea views',
    validate: (res) => {
      const pass = (res.reply.toLowerCase().includes('palm') || res.reply.toLowerCase().includes('marina')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 11. Buying vs Renting decision
  {
    id: 11,
    name: 'Buying vs Renting Decision (4-Year Stay)',
    query: 'Should I buy or rent if staying in Dubai for 4 years?',
    validate: (res) => {
      const pass = (res.reply.toLowerCase().includes('buying') || res.reply.includes('3 to 4') || res.reply.includes('amortized')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 12. Rental yields & ROI calculations
  {
    id: 12,
    name: 'Rental Yields & ROI (JVC vs Downtown)',
    query: 'What rental yields can I expect in JVC compared to Downtown?',
    validate: (res) => {
      const pass = (res.reply.includes('7.5%') || res.reply.includes('9.2%') || res.reply.includes('6.0%') || res.reply.toLowerCase().includes('yield')) &&
        res.propertyRecommendations.length === 0;
      return { pass, details: `Reply: "${res.reply.slice(0, 90)}..."` };
    }
  },

  // 13. Customer pause / busy
  {
    id: 13,
    name: 'Customer Pause ("I\'m busy now")',
    query: "I'm busy now, have to jump on a call",
    validate: (res) => {
      const pass = res.context.isPaused === true &&
        (res.reply.toLowerCase().includes('no worries') || res.reply.toLowerCase().includes('time') || res.reply.toLowerCase().includes('ready'));
      return { pass, details: `Context isPaused: ${res.context.isPaused}. Reply: "${res.reply.slice(0, 60)}..."` };
    }
  },

  // 14. Context resumption
  {
    id: 14,
    name: 'Context Resumption ("I\'m back, let\'s continue")',
    query: "I'm back, let's continue",
    initialContext: { isPaused: true, location: 'Dubai Marina', bedrooms: 2, purpose: 'For Rent' },
    validate: (res) => {
      const pass = res.context.isPaused === false &&
        (res.reply.toLowerCase().includes('pick up') || res.reply.toLowerCase().includes('where we left off') || res.reply.toLowerCase().includes('continue'));
      return { pass, details: `Context isPaused: ${res.context.isPaused}. Reply: "${res.reply.slice(0, 70)}..."` };
    }
  },

  // 15. Relative search (cheaper options)
  {
    id: 15,
    name: 'Relative Search ("Show me cheaper options in Dubai Marina")',
    query: 'Show me cheaper options in Dubai Marina',
    initialContext: { location: 'Dubai Marina', maxBudget: 150000, lastRecommendedPrice: 140000, purpose: 'For Rent' },
    validate: (res) => {
      const budgetReduced = res.context.maxBudget !== undefined && res.context.maxBudget < 150000;
      const pass = budgetReduced && res.propertyRecommendations.length > 0;
      return { pass, details: `New Max Budget: AED ${res.context.maxBudget?.toLocaleString()}, Recommendations: ${res.propertyRecommendations.length}` };
    }
  },

  // 16. Arabic legal/transaction query
  {
    id: 16,
    name: 'Arabic Legal Query (Strictly in Arabic)',
    query: 'ما هي شروط وإجراءات تسجيل عقد إيجاري ورسوم دائرة الأراضي؟',
    validate: (res) => {
      // Must contain Arabic characters and not switch to English
      const arabicChars = (res.reply.match(/[\u0600-\u06FF]/g) || []).length;
      const pass = arabicChars > 30 && (res.reply.includes('إيجاري') || res.reply.includes('الأراضي') || res.reply.includes('4%'));
      return { pass, details: `Arabic chars: ${arabicChars}. Reply snippet: "${res.reply.slice(0, 70)}..."` };
    }
  },

  // 17. Tamil family relocation query
  {
    id: 17,
    name: 'Tamil Family Query (Strictly in Tamil)',
    query: 'துபாயில் குடும்பத்துடன் குடியேற சிறந்த பகுதிகள் மற்றும் பள்ளிகள் எவை?',
    validate: (res) => {
      // Must contain Tamil characters and not switch to English
      const tamilChars = (res.reply.match(/[\u0B80-\u0BFF]/g) || []).length;
      const pass = tamilChars > 30 && (res.reply.includes('துபாய்') || res.reply.includes('பள்ளி') || res.reply.includes('ஹில்ஸ்'));
      return { pass, details: `Tamil chars: ${tamilChars}. Reply snippet: "${res.reply.slice(0, 70)}..."` };
    }
  },

  // 18. Out-of-domain query
  {
    id: 18,
    name: 'Out-of-Domain Boundary Handling (Python Code / Medical)',
    query: 'Can you write a python script for sorting an array?',
    validate: (res) => {
      const pass = res.reply.toLowerCase().includes('real estate') &&
        (res.reply.toLowerCase().includes('specialize') || res.reply.toLowerCase().includes('cannot provide') || res.reply.toLowerCase().includes('exclusive'));
      return { pass, details: `Reply: "${res.reply.slice(0, 80)}..."` };
    }
  },

  // 19. Live PostgreSQL property search
  {
    id: 19,
    name: 'Live PostgreSQL Property Search (2 BHK in Dubai Marina)',
    query: 'Show me available 2-bedroom apartments in Dubai Marina',
    validate: (res) => {
      const hasProps = res.propertyRecommendations.length > 0;
      const realProps = res.propertyRecommendations.every((p: any) => p.id && p.priceAED > 0 && p.location);
      const marinaProps = res.propertyRecommendations.filter((p: any) => p.location.toLowerCase().includes('marina')).length;
      const pass = hasProps && realProps;
      return { pass, details: `Found ${res.propertyRecommendations.length} listings (${marinaProps} in Marina), top price: AED ${res.propertyRecommendations[0]?.priceAED?.toLocaleString()}` };
    }
  },

  // 20. Viewing request & Lead handoff
  {
    id: 20,
    name: 'Viewing Request & CRM Lead Creation',
    query: 'I want to arrange a viewing for this weekend, my phone is +971501234567 and name is Sarah',
    initialContext: { location: 'Dubai Marina', bedrooms: 2, maxBudget: 180000, purpose: 'For Rent' },
    validate: (res) => {
      const pass = res.handoffTriggered === true &&
        res.leadCreated === true &&
        (res.reply.includes('Sarah') || res.reply.includes('+971501234567') || res.reply.toLowerCase().includes('recorded'));
      return { pass, details: `Handoff: ${res.handoffTriggered}, LeadCreated: ${res.leadCreated}. Reply: "${res.reply.slice(0, 70)}..."` };
    }
  }
];

async function runTestSuite() {
  console.log('===============================================================');
  console.log('LYKA REALTY – 20-SCENARIO RAG & CONVERSATIONAL ASSISTANT AUDIT');
  console.log('===============================================================\n');

  // Ensure knowledge base is loaded
  const chunkCount = await knowledgeService.loadKnowledgeBase();
  console.log(`[Setup] Knowledge base loaded with ${chunkCount} chunks across 13 domains.`);
  
  if (isPostgresConfigured()) {
    console.log('[Setup] Initializing PostgreSQL connection...');
    await initPostgresDatabase();
  }
  console.log(`[Setup] PostgreSQL Connected: ${isPostgresConfigured()}\n`);

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      const result = await processAssistantTurn(tc.query, tc.initialContext || {});
      const { pass, details } = tc.validate(result);

      if (pass) {
        passed++;
        console.log(`✅ [TEST ${tc.id.toString().padStart(2, '0')}] PASS: ${tc.name}`);
        console.log(`   ${details}`);
      } else {
        failed++;
        console.log(`❌ [TEST ${tc.id.toString().padStart(2, '0')}] FAIL: ${tc.name}`);
        console.log(`   ${details}`);
        console.log(`   Full Reply: "${result.reply}"`);
      }
    } catch (err: any) {
      failed++;
      console.log(`❌ [TEST ${tc.id.toString().padStart(2, '0')}] ERROR: ${tc.name} -> ${err.message}`);
    }
  }

  console.log('\n===============================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED / ${testCases.length} TOTAL (${failed} FAILED)`);
  console.log('===============================================================');

  const p = getPostgresPool();
  if (p) {
    await p.end();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(console.error);
