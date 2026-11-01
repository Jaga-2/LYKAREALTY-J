import { knowledgeService } from '../server/knowledgeService.js';

async function run() {
  console.log('Testing KnowledgeService...');
  const count = await knowledgeService.loadKnowledgeBase();
  console.log(`Loaded ${count} chunks.`);
  
  const stats = knowledgeService.getStats();
  console.log('Stats:', stats);

  const testQueries = [
    'What is the DLD transfer fee and trustee fee?',
    'What are the requirements for the 10-year Golden Visa?',
    'Can you tell me about schools in Dubai Hills Estate?',
    'What are the rental yields in JVC and Dubai Marina?',
    'ما هي شروط الفيزا الذهبية في دبي؟',
    'துபாயில் கோல்டன் விசா வாங்குவது எப்படி?',
    'How does Ejari work and what is the security deposit?'
  ];

  for (const q of testQueries) {
    console.log(`\n========================================`);
    console.log(`Query: "${q}"`);
    const results = knowledgeService.searchKnowledge(q, { topK: 2 });
    console.log(`Found ${results.length} matches:`);
    for (const res of results) {
      console.log(`- [Score ${res.score.toFixed(1)}] ${res.docTitle} > ${res.sectionTitle} (${res.source})`);
      console.log(`  Snippet: ${res.content.slice(0, 150).replace(/\n/g, ' ')}...`);
    }
  }
}

run().catch(console.error);

