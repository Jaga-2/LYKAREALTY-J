import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface KnowledgeChunk {
  id: string;
  sourceFile: string;
  docTitle: string;
  category: string;
  sectionTitle: string;
  content: string;
  tokens: Set<string>;
  tokenArray: string[];
}

export interface KnowledgeSearchResult {
  source: string;
  docTitle: string;
  category: string;
  sectionTitle: string;
  content: string;
  score: number;
}

// Common stop words to exclude from index tokens
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'about', 'above', 'after', 'again', 'against', 'all', 'am',
  'any', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few',
  'further', 'had', 'having', 'here', 'how', 'if', 'into', 'just', 'more', 'most',
  'my', 'no', 'nor', 'not', 'now', 'only', 'or', 'other', 'our', 'out', 'over',
  'own', 'same', 'should', 'so', 'some', 'such', 'than', 'then', 'there', 'their',
  'them', 'these', 'they', 'this', 'those', 'through', 'too', 'under', 'until',
  'up', 'very', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'would', 'you', 'your'
]);

// Multilingual cross-lingual semantic bridge
const CROSS_LINGUAL_MAP: { [key: string]: string[] } = {
  // Arabic terms
  'فيزا': ['visa', 'golden', 'residency', 'investor'],
  'الذهبية': ['golden', 'visa', 'residency', '10-year'],
  'إقامة': ['residency', 'visa', 'golden', 'emirates'],
  'اقامة': ['residency', 'visa', 'golden', 'emirates'],
  'تأشيرة': ['visa', 'residency', 'golden'],
  'شراء': ['buying', 'purchase', 'sales', 'secondary', 'off-plan'],
  'تملك': ['ownership', 'freehold', 'property', 'law'],
  'حر': ['freehold', 'ownership'],
  'إيجار': ['rent', 'rental', 'renting', 'ejari', 'lease'],
  'ايجار': ['rent', 'rental', 'renting', 'ejari', 'lease'],
  'ايجاري': ['ejari', 'tenancy', 'contract', 'rera'],
  'إيجاري': ['ejari', 'tenancy', 'contract', 'rera'],
  'رسوم': ['fees', 'costs', 'transaction', 'dld', 'trustee'],
  'ضرائب': ['taxes', 'tax', 'exempt', '0%'],
  'تكلفة': ['cost', 'costs', 'fees', 'transaction'],
  'تكاليف': ['costs', 'fees', 'transaction'],
  'تمويل': ['financing', 'mortgage', 'loan', 'bank'],
  'قرض': ['loan', 'mortgage', 'financing', 'bank'],
  'رهن': ['mortgage', 'financing', 'dld'],
  'عائد': ['yield', 'yields', 'roi', 'return', 'rental'],
  'عوائد': ['yields', 'yield', 'roi', 'rental'],
  'استثمار': ['investment', 'investor', 'invest', 'roi', 'yield'],
  'مدارس': ['schools', 'education', 'khda', 'curriculum'],
  'مدرسة': ['school', 'education', 'khda'],
  'تعليم': ['education', 'schools', 'khda'],
  'عائلة': ['family', 'relocation', 'kids', 'children'],
  'أطفال': ['children', 'family', 'pediatric', 'schools'],
  'مستشفى': ['hospital', 'healthcare', 'medical'],
  'دائرة': ['dld', 'department', 'land'],
  'الأراضي': ['land', 'dld', 'department'],
  'ريرا': ['rera', 'regulation', 'mollak', 'tenancy'],
  'مارينا': ['marina', 'dubai marina'],
  'داون': ['downtown'],
  'تاون': ['downtown'],
  'نخلة': ['palm', 'palm jumeirah'],
  'جميرا': ['jumeirah'],
  'تلال': ['hills', 'dubai hills'],
  'المرابع': ['arabian ranches', 'ranches'],

  // Tamil terms
  'விசா': ['visa', 'golden', 'residency'],
  'தங்க': ['golden', 'visa', 'residency'],
  'குடியிருப்பு': ['residency', 'visa', 'family'],
  'வாங்க': ['buying', 'purchase', 'sales', 'property'],
  'வாங்குவது': ['buying', 'purchase', 'sales'],
  'சொத்து': ['property', 'real estate', 'ownership'],
  'உரிமை': ['ownership', 'freehold'],
  'வாடகை': ['rent', 'rental', 'renting', 'ejari'],
  'எஜாரி': ['ejari', 'tenancy', 'contract'],
  'கட்டணம்': ['fees', 'costs', 'dld', 'transfer'],
  'செலவு': ['costs', 'fees', 'transaction'],
  'வரி': ['tax', 'taxes', '0%'],
  'கடன்': ['mortgage', 'loan', 'financing', 'bank'],
  'வங்கி': ['bank', 'mortgage', 'financing'],
  'முதலீடு': ['investment', 'investor', 'yield', 'roi'],
  'வருமானம்': ['income', 'yield', 'rental'],
  'பள்ளி': ['school', 'schools', 'khda', 'education'],
  'கல்வி': ['education', 'schools', 'khda'],
  'குடும்பம்': ['family', 'relocation', 'children'],
  'குழந்தைகள்': ['children', 'family', 'schools'],
  'மருத்துவமனை': ['hospital', 'healthcare', 'medical'],
  'துபாய்': ['dubai'],
  'மெரினா': ['dubai marina', 'marina'],
  'டவுன்டவுன்': ['downtown dubai', 'downtown'],
  'பாம்': ['palm', 'palm jumeirah'],
  'ஜுமேரா': ['jumeirah'],

  // Tanglish terms
  'vanakkam': ['hello', 'greeting', 'welcome'],
  'kedaikuma': ['available', 'options', 'listings'],
  'pudikkum': ['prefer', 'like', 'interested'],
  'veedu': ['home', 'residence', 'apartment', 'villa'],
  'panam': ['budget', 'money', 'price', 'payment'],
  'evalo': ['cost', 'price', 'fee', 'how much'],
  'nalla': ['best', 'good', 'prime']
};

class KnowledgeService {
  private chunks: KnowledgeChunk[] = [];
  private idfMap: Map<string, number> = new Map();
  private isLoaded: boolean = false;
  private basePath: string;

  constructor() {
    this.basePath = path.resolve(__dirname, 'knowledgeBase');
  }

  /**
   * Tokenizes text into lowercase clean words excluding common stop words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/[\s-]+/)
      .map(w => w.trim())
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  }

  /**
   * Helper to collect all files from target directory and any subdirectories (like conversations)
   */
  private getFilesRecursively(dir: string, baseDir: string = dir): { filename: string; fullPath: string }[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir);
    const results: { filename: string; fullPath: string }[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...this.getFilesRecursively(fullPath, baseDir));
      } else if (stat.isFile()) {
        const relativeName = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        results.push({ filename: relativeName, fullPath });
      }
    }

    return results;
  }

  /**
   * Scans and loads all knowledge documents in the knowledgeBase directory and subdirectories
   */
  public async loadKnowledgeBase(customPath?: string): Promise<number> {
    const targetDir = customPath ? path.resolve(customPath) : this.basePath;
    
    if (!fs.existsSync(targetDir)) {
      console.warn(`[KnowledgeService] Directory not found: ${targetDir}`);
      return 0;
    }

    const fileList = this.getFilesRecursively(targetDir);
    const newChunks: KnowledgeChunk[] = [];

    for (const file of fileList) {
      const ext = path.extname(file.filename).toLowerCase();
      if (!['.md', '.txt', '.json', '.csv'].includes(ext)) continue;

      const rawContent = fs.readFileSync(file.fullPath, 'utf8');
      const chunks = this.parseDocument(file.filename, rawContent, ext);
      newChunks.push(...chunks);
    }

    this.chunks = newChunks;
    this.computeIdf();
    this.isLoaded = true;

    console.log(`[KnowledgeService] Loaded ${this.chunks.length} knowledge chunks from ${fileList.length} documents.`);
    return this.chunks.length;
  }

  /**
   * Parses document content into structured chunks based on file type
   */
  private parseDocument(filename: string, content: string, ext: string): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    const baseName = path.basename(filename, ext);

    // Skip monolithic CSV dataset if JSON is already present to prevent monolithic chunking
    if (ext === '.csv' && baseName.includes('conversations_dataset')) {
      return [];
    }
    
    // Human-readable document title from filename
    const docTitle = baseName
      .replace(/^\d+_/, '')
      .split('_')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');

    const category = this.categorizeDocument(baseName);

    if (ext === '.json') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          parsed.forEach((item, idx) => {
            // Check if item is from our 1,080 conversations dataset
            if (item && typeof item === 'object' && item.customer_message) {
              const text = `Customer Message: "${item.customer_message}" (Emotion: ${item.emotion_mood || 'neutral'}, Language: ${item.language || 'english'})\nIntent: ${item.detected_intent || 'conversation'}\nRecommended Action: ${item.recommended_action || 'respond_naturally'}\nSample Response Style: "${item.expected_response || ''}"`;
              const tokens = this.tokenize(`${item.customer_message} ${item.detected_intent || ''} ${item.emotion_mood || ''} ${item.recommended_action || ''} ${item.expected_response || ''} ${item.category || ''}`);
              chunks.push({
                id: `${baseName}_${item.id || idx}`,
                sourceFile: filename,
                docTitle: 'Conversational Knowledge Base',
                category: 'Conversational Guidance',
                sectionTitle: `${item.category || docTitle} (${item.id || idx})`,
                content: text,
                tokens: new Set(tokens),
                tokenArray: tokens
              });
            } else {
              const text = typeof item === 'string' ? item : JSON.stringify(item, null, 2);
              const tokens = this.tokenize(text);
              chunks.push({
                id: `${baseName}_json_${idx}`,
                sourceFile: filename,
                docTitle,
                category,
                sectionTitle: `${docTitle} Item ${idx + 1}`,
                content: text,
                tokens: new Set(tokens),
                tokenArray: tokens
              });
            }
          });
        }
      } catch (err) {
        console.error(`[KnowledgeService] Error parsing JSON file ${filename}:`, err);
      }
      return chunks;
    }

    // Markdown / Text chunking by headers
    const lines = content.split('\n');
    let currentSection = docTitle;
    let currentLines: string[] = [];
    let sectionIdx = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^#{1,3}\s+(.+)$/);

      if (headerMatch) {
        if (currentLines.length > 0) {
          const sectionContent = currentLines.join('\n').trim();
          if (sectionContent.length > 40) {
            const tokens = this.tokenize(`${currentSection} ${sectionContent}`);
            chunks.push({
              id: `${baseName}_sec_${sectionIdx++}`,
              sourceFile: filename,
              docTitle,
              category,
              sectionTitle: currentSection,
              content: sectionContent,
              tokens: new Set(tokens),
              tokenArray: tokens
            });
          }
          currentLines = [];
        }
        currentSection = headerMatch[1].trim();
      } else {
        currentLines.push(line);
      }
    }

    // Flush final section
    if (currentLines.length > 0) {
      const sectionContent = currentLines.join('\n').trim();
      if (sectionContent.length > 40) {
        const tokens = this.tokenize(`${currentSection} ${sectionContent}`);
        chunks.push({
          id: `${baseName}_sec_${sectionIdx++}`,
          sourceFile: filename,
          docTitle,
          category,
          sectionTitle: currentSection,
          content: sectionContent,
          tokens: new Set(tokens),
          tokenArray: tokens
        });
      }
    }

    return chunks;
  }

  private categorizeDocument(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('greeting') || lower.includes('smalltalk')) return 'Conversation: Greetings & Small Talk';
    if (lower.includes('emotion') || lower.includes('rapport')) return 'Conversation: Emotions & De-escalation';
    if (lower.includes('navigation')) return 'Conversation: Dialog Navigation';
    if (lower.includes('linguistic') || lower.includes('voice')) return 'Conversation: Voice & Linguistic Nuance';
    if (lower.includes('multilingual')) return 'Conversation: Multilingual (Tamil, Tanglish, Arabic)';
    if (lower.includes('categories_guide')) return 'Conversation: Master Architecture';
    if (lower.includes('conversations_dataset')) return 'Conversational Guidance';
    if (lower.includes('conversation_patterns')) return 'Conversation: Lexicon Patterns';

    if (lower.includes('market') || lower.includes('fundamental')) return 'Market Fundamentals';
    if (lower.includes('community') || lower.includes('residential')) return 'Communities & Neighborhoods';
    if (lower.includes('property_type')) return 'Property Types';
    if (lower.includes('buying') || lower.includes('selling')) return 'Buying & Selling';
    if (lower.includes('renting') || lower.includes('leasing')) return 'Renting & Tenancy';
    if (lower.includes('freehold')) return 'Ownership & Freehold';
    if (lower.includes('dld') || lower.includes('rera')) return 'DLD & RERA Regulations';
    if (lower.includes('mortgage') || lower.includes('finance')) return 'Mortgages & Finance';
    if (lower.includes('cost') || lower.includes('fee')) return 'Transaction Costs';
    if (lower.includes('yield') || lower.includes('investment')) return 'Rental Yields & ROI';
    if (lower.includes('golden_visa') || lower.includes('visa')) return 'Golden Visa & Residency';
    if (lower.includes('family') || lower.includes('school')) return 'Family Relocation & Schools';
    if (lower.includes('faq')) return 'Customer FAQs';
    return 'Dubai Real Estate Guide';
  }

  /**
   * Computes Inverse Document Frequency (IDF) for all tokens across chunks
   */
  private computeIdf(): void {
    this.idfMap.clear();
    const docCount = this.chunks.length;
    if (docCount === 0) return;

    const docFreq: Map<string, number> = new Map();

    for (const chunk of this.chunks) {
      for (const token of chunk.tokens) {
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }

    for (const [token, freq] of docFreq.entries()) {
      // Standard smoothed BM25 IDF formula
      const idf = Math.log(1 + (docCount - freq + 0.5) / (freq + 0.5));
      this.idfMap.set(token, Math.max(idf, 0.1));
    }
  }

  /**
   * Expands query using cross-lingual mappings for Arabic and Tamil
   */
  private expandQueryTokens(query: string): string[] {
    const rawTokens = this.tokenize(query);
    const expandedTokens = new Set<string>(rawTokens);

    // Cross-lingual semantic lookup
    for (const [key, mappedList] of Object.entries(CROSS_LINGUAL_MAP)) {
      if (query.includes(key)) {
        mappedList.forEach(term => {
          this.tokenize(term).forEach(t => expandedTokens.add(t));
        });
      }
    }

    return Array.from(expandedTokens);
  }

  /**
   * Search knowledge base using BM25-inspired token similarity and phrase matching
   */
  public searchKnowledge(
    query: string,
    options: { topK?: number; minScore?: number } = {}
  ): KnowledgeSearchResult[] {
    if (!this.isLoaded || this.chunks.length === 0) {
      this.loadKnowledgeBaseSync();
    }

    const topK = options.topK || 3;
    const minScore = options.minScore || 1.5;

    const queryTokens = this.expandQueryTokens(query);
    if (queryTokens.length === 0) return [];

    const lowerQuery = query.toLowerCase();
    const scoredResults: KnowledgeSearchResult[] = [];

    for (const chunk of this.chunks) {
      let score = 0;
      const lowerTitle = chunk.sectionTitle.toLowerCase();
      const lowerDoc = chunk.docTitle.toLowerCase();
      const lowerContent = chunk.content.toLowerCase();

      // 1. BM25-style token matching
      for (const token of queryTokens) {
        if (chunk.tokens.has(token)) {
          const idf = this.idfMap.get(token) || 1.0;
          
          // Term frequency in chunk
          let tf = 0;
          for (const chunkToken of chunk.tokenArray) {
            if (chunkToken === token) tf++;
          }

          const tfScore = Math.sqrt(tf);
          score += idf * tfScore;

          // Header title boost
          if (lowerTitle.includes(token) || lowerDoc.includes(token)) {
            score += idf * 2.5;
          }
        }
      }

      // 2. Exact phrase bonus (e.g., "golden visa", "dld fee", "dubai marina")
      const phrases = [
        'golden visa', 'dld fee', 'transfer fee', 'ejari', 'rental yield',
        'freehold', 'mortgage', 'down payment', 'dubai marina', 'palm jumeirah',
        'downtown dubai', 'dubai hills', 'arabian ranches', 'service charge',
        'decree 43', 'khda', 'escrow', 'form f'
      ];

      for (const phrase of phrases) {
        if (lowerQuery.includes(phrase)) {
          if (lowerContent.includes(phrase)) score += 6.0;
          if (lowerTitle.includes(phrase)) score += 10.0;
        }
      }

      // Real estate domain documents boost for knowledge inquiries
      if (!chunk.category.startsWith('Conversation')) {
        score += 3.0;
      }

      if (score >= minScore) {
        scoredResults.push({
          source: chunk.sourceFile,
          docTitle: chunk.docTitle,
          category: chunk.category,
          sectionTitle: chunk.sectionTitle,
          content: chunk.content,
          score
        });
      }
    }

    // Sort descending by relevance score and pick topK
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, topK);
  }

  /**
   * Synchronous fallback loader for immediate availability
   */
  private loadKnowledgeBaseSync(): void {
    if (this.isLoaded) return;
    if (!fs.existsSync(this.basePath)) return;

    try {
      const fileList = this.getFilesRecursively(this.basePath);
      const newChunks: KnowledgeChunk[] = [];

      for (const file of fileList) {
        const ext = path.extname(file.filename).toLowerCase();
        if (!['.md', '.txt', '.json', '.csv'].includes(ext)) continue;

        const rawContent = fs.readFileSync(file.fullPath, 'utf8');
        const chunks = this.parseDocument(file.filename, rawContent, ext);
        newChunks.push(...chunks);
      }

      this.chunks = newChunks;
      this.computeIdf();
      this.isLoaded = true;
    } catch (e) {
      console.error('[KnowledgeService] Failed to load knowledge base synchronously:', e);
    }
  }

  /**
   * Specifically search conversation guidance chunks
   */
  public searchConversations(
    query: string,
    options: { topK?: number; minScore?: number } = {}
  ): KnowledgeSearchResult[] {
    if (!this.isLoaded || this.chunks.length === 0) {
      this.loadKnowledgeBaseSync();
    }

    const topK = options.topK || 2;
    const minScore = options.minScore || 1.0;

    const queryTokens = this.expandQueryTokens(query);
    if (queryTokens.length === 0) return [];

    const lowerQuery = query.toLowerCase();
    const scoredResults: KnowledgeSearchResult[] = [];

    // Filter to chunks from conversation documents and dataset
    const convChunks = this.chunks.filter(c => 
      c.category.startsWith('Conversation') || 
      c.sourceFile.includes('conversation') || 
      c.docTitle.includes('Conversation')
    );

    for (const chunk of convChunks) {
      let score = 0;
      const lowerTitle = chunk.sectionTitle.toLowerCase();
      const lowerDoc = chunk.docTitle.toLowerCase();
      const lowerContent = chunk.content.toLowerCase();

      for (const token of queryTokens) {
        if (chunk.tokens.has(token)) {
          const idf = this.idfMap.get(token) || 1.0;
          let tf = 0;
          for (const chunkToken of chunk.tokenArray) {
            if (chunkToken === token) tf++;
          }
          score += idf * Math.sqrt(tf);
          if (lowerTitle.includes(token) || lowerDoc.includes(token)) {
            score += idf * 2.0;
          }
        }
      }

      // Exact substring match bonus
      if (lowerContent.includes(lowerQuery.slice(0, 25))) {
        score += 8.0;
      }

      if (score >= minScore) {
        scoredResults.push({
          source: chunk.sourceFile,
          docTitle: chunk.docTitle,
          category: chunk.category,
          sectionTitle: chunk.sectionTitle,
          content: chunk.content,
          score
        });
      }
    }

    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, topK);
  }

  /**
   * Formats retrieved conversational guidance for LLM prompt context
   */
  public formatConversationalGuidanceForPrompt(results: KnowledgeSearchResult[]): string {
    if (results.length === 0) return '';

    const lines: string[] = [
      '### CONVERSATIONAL STYLE & BEHAVIORAL GUIDANCE (HUMAN CONVERSATION KB):',
      'The following guidance and examples demonstrate how top human advisors naturally handle similar user emotions, intents, and colloquial phrasing.',
      'CRITICAL: Use these examples strictly as contextual guidance and inspiration for your tone, empathy, and structure. Do NOT recite or copy them verbatim as hardcoded scripts. Adapt naturally to the conversation.'
    ];

    results.forEach((res, i) => {
      lines.push(`\n--- [Guidance Example ${i + 1}: ${res.sectionTitle}] ---`);
      lines.push(res.content);
    });

    lines.push('\n### END OF CONVERSATIONAL GUIDANCE\n');
    return lines.join('\n');
  }

  /**
   * Formats retrieved knowledge into a clean prompt context string
   */
  public formatKnowledgeForPrompt(results: KnowledgeSearchResult[]): string {
    if (results.length === 0) return '';

    const lines: string[] = [
      '### RELEVANT DUBAI REAL ESTATE KNOWLEDGE BASE CONTEXT (RAG):',
      'The following verified facts and regulations apply to Dubai real estate. Ground your answers strictly in these facts without inventing figures or rules.'
    ];

    results.forEach((res, i) => {
      lines.push(`\n--- [Source Reference ${i + 1}: ${res.docTitle} - ${res.sectionTitle}] ---`);
      lines.push(res.content);
    });

    lines.push('\n### END OF KNOWLEDGE BASE CONTEXT\n');
    return lines.join('\n');
  }

  public getStats() {
    const documentCount = new Set(this.chunks.map(c => c.sourceFile)).size;
    return {
      isLoaded: this.isLoaded,
      chunkCount: this.chunks.length,
      documentCount,
      categories: Array.from(new Set(this.chunks.map(c => c.category)))
    };
  }
}

export const knowledgeService = new KnowledgeService();
