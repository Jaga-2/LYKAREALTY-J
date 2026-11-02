import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import * as db from './server/db.js';
import {
  requireAuth,
  optionalAuth,
  requireRole,
  generateSessionToken,
  removeSession,
  AuthenticatedRequest,
  AuthenticatedUser
} from './server/auth.js';
import { initPostgresDatabase, getDbStatus, isPostgresConfigured } from './server/postgres.js';
import {
  searchPropertiesFromDb,
  getPropertyByIdFromDb,
  findPropertiesForAssistantDb,
  PropertyRecord
} from './server/propertyService.js';
import {
  findUserByEmailFromDb,
  verifyUserPassword,
  createUserInDb,
  getAllStaffFromDb,
  getLeadsFromDb,
  createLeadInDb,
  updateLeadInDb,
  getSiteVisitsFromDb,
  createSiteVisitInDb,
  updateSiteVisitInDb,
  getAuditLogsFromDb,
  logAuditInDb,
  getUserShortlistFromDb,
  toggleShortlistInDb,
  mapDbUserToAuth
} from './server/crmDbService.js';
import { processAssistantTurn, AssistantConversationContext } from './server/assistantEngine.js';
import { knowledgeService } from './server/knowledgeService.js';
import {
  autoAssignLead,
  getNotificationsForUser,
  markNotificationRead,
  getLeadChecklist,
  toggleChecklistStep,
  clockIn,
  clockOut,
  getAttendance,
  getCommissions,
  createCommission,
  updateCommissionApproval,
  getDashboardStats
} from './server/autoAssignmentService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '500kb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = !origin || allowedOrigins.length === 0 ||
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

  if (origin && allowed) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// -------------------------------------------------------------
// RATE LIMITING & SECURITY MIDDLEWARE
// -------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before sending another query.',
      retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000)
    });
  }

  entry.count += 1;
  next();
}

// -------------------------------------------------------------
// HEALTH & DATABASE STATUS
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'ok',
    database: dbStatus,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOllamaConfigured: !!(process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL),
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// AUTHENTICATION & ROLE MANAGEMENT (/api/auth/*)
// -------------------------------------------------------------

app.get('/api/auth/local-staff-diagnostics', (req, res) => {
  const remoteAddress = String(req.ip || '');
  const isLocalRequest = remoteAddress === '127.0.0.1'
    || remoteAddress === '::1'
    || remoteAddress === '::ffff:127.0.0.1'
    || remoteAddress.startsWith('localhost');
  if (!isLocalRequest) {
    return res.status(404).json({ error: 'Not found.' });
  }

  const allowedRoles = new Set(['sales_agent', 'admin', 'super_admin', 'manager']);
  const staff = db.getDb().users
    .filter((user) => allowedRoles.has(user.role))
    .map((user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      passwordConfigured: user.passwordHash !== 'preset_demo_user'
    }));

  return res.json({ staff });
});

// Sign In with email / role / password (Client & General)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    if (isPostgresConfigured()) {
      try {
        const dbUser = await findUserByEmailFromDb(email);
        if (dbUser) {
          if (password) {
            const isValid = await verifyUserPassword(dbUser, password);
            if (!isValid) {
              return res.status(401).json({ error: 'Incorrect credentials for this account.' });
            }
          }
          if (role && dbUser.role !== role && !(role === 'admin' && dbUser.role === 'super_admin')) {
            return res.status(403).json({ error: 'The account exists, but its role does not match the selected login.' });
          }
          if (!dbUser.is_active) {
            return res.status(403).json({ error: 'This account is inactive. Contact a LYKA administrator.' });
          }
          const authUser = mapDbUserToAuth(dbUser);
          const token = generateSessionToken(authUser);
          return res.json({ token, user: authUser });
        }
        return res.status(401).json({ error: 'Account not found. Please verify the email address.' });
      } catch (dbErr: any) {
        console.warn('[Auth API] PostgreSQL auth error:', dbErr.message);
        return res.status(503).json({ error: 'Authentication service is temporarily unavailable.' });
      }
    }

    const localUser = db.findUserByEmail(email);
    if (!localUser || localUser.passwordHash === 'preset_demo_user') {
      return res.status(401).json({ error: 'Account not found or password is not configured.' });
    }
    if (role && localUser.role !== role) {
      return res.status(403).json({ error: 'The account exists, but its role does not match the selected login.' });
    }
    if (!password || crypto.createHash('sha256').update(password).digest('hex') !== localUser.passwordHash) {
      return res.status(401).json({ error: 'Incorrect credentials for this account.' });
    }
    const authUser: AuthenticatedUser = {
      id: localUser.id,
      email: localUser.email,
      role: localUser.role,
      name: localUser.name,
      phone: localUser.phone,
      title: localUser.title,
      avatar: localUser.avatar,
      assignedAgentId: localUser.assignedAgentId
    };
    const token = generateSessionToken(authUser);
    return res.json({ token, user: authUser });
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication failed: ' + err.message });
  }
});

// Staff Secure Login (Discreet Route: /staff)
app.post('/api/auth/staff-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Corporate email and password are required.' });
    }

    if (isPostgresConfigured()) {
      try {
        const dbUser = await findUserByEmailFromDb(email);
        if (dbUser) {
          if (!['sales_agent', 'admin', 'super_admin', 'manager'].includes(dbUser.role)) {
            return res.status(403).json({ error: 'Access restricted to authorized LYKA Realty personnel.' });
          }
          if (!dbUser.is_active) {
            return res.status(403).json({ error: 'This staff account is inactive. Contact a LYKA administrator.' });
          }

          const isValid = await verifyUserPassword(dbUser, password);
          if (!isValid) {
            return res.status(401).json({ error: 'Invalid staff password.' });
          }

          const authUser = mapDbUserToAuth(dbUser);
          const token = generateSessionToken(authUser);

          try {
            await logAuditInDb({
              userId: dbUser.id,
              userEmail: dbUser.email,
              userRole: dbUser.role,
              action: 'STAFF_AUTHENTICATED',
              resourceType: 'auth',
              resourceId: String(dbUser.id),
              details: `Staff member ${authUser.name} signed in successfully to role ${dbUser.role}`,
              ipAddress: req.ip
            });
          } catch {}

          return res.json({ token, user: authUser });
        }
      } catch (dbErr: any) {
        console.warn('[Auth API] PostgreSQL staff auth error, falling back to local staff accounts:', dbErr.message);
      }
    }

    const localUser = db.findUserByEmail(email);
    if (!localUser) {
      return res.status(401).json({ error: 'Staff account not found. Please verify the corporate email address.' });
    }
    if (!['sales_agent', 'admin', 'super_admin', 'manager'].includes(localUser.role)) {
      return res.status(403).json({ error: 'Access restricted to authorized LYKA Realty personnel.' });
    }
    if (!localUser.passwordHash || localUser.passwordHash === 'preset_demo_user') {
      return res.status(401).json({ error: 'Local staff password is not configured. Use the secure local password setup procedure.' });
    }

    let localPasswordValid = false;
    if (localUser.passwordHash.startsWith('$2')) {
      localPasswordValid = bcrypt.compareSync(password, localUser.passwordHash);
    } else {
      localPasswordValid = crypto.createHash('sha256').update(password).digest('hex') === localUser.passwordHash;
    }
    if (!localPasswordValid) {
      return res.status(401).json({ error: 'Invalid staff credentials. Check the email and password.' });
    }

    const authUser: AuthenticatedUser = {
      id: localUser.id,
      email: localUser.email,
      role: localUser.role,
      name: localUser.name,
      phone: localUser.phone,
      title: localUser.title,
      avatar: localUser.avatar,
      assignedAgentId: localUser.assignedAgentId
    };
    const token = generateSessionToken(authUser);
    return res.json({ token, user: authUser });

  } catch (err: any) {
    res.status(500).json({ error: 'Staff authentication failed: ' + err.message });
  }
});

// Customer Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Name and email are required for registration.' });
    }

    if (isPostgresConfigured()) {
      const existing = await findUserByEmailFromDb(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
      }

      const created = await createUserInDb({
        email,
        fullName: name,
        phone,
        password: password || 'LykaClient2025!',
        role: 'customer'
      });

      const authUser = mapDbUserToAuth(created);
      const token = generateSessionToken(authUser);

      await logAuditInDb({
        userId: created.id,
        userEmail: created.email,
        userRole: 'customer',
        action: 'CUSTOMER_REGISTERED',
        resourceType: 'user',
        resourceId: String(created.id),
        details: `Customer ${name} registered on LYKA Realty platform`,
        ipAddress: req.ip
      });

      return res.status(201).json({
        token,
        user: authUser
      });
    }

    const newUser = db.registerCustomerUser({ name, email, phone: phone || '' });
    const authUser: AuthenticatedUser = {
      id: newUser.id,
      email: newUser.email,
      role: 'customer',
      name: newUser.name,
      phone: newUser.phone,
      title: newUser.title,
      avatar: newUser.avatar,
      assignedAgentId: newUser.assignedAgentId
    };

    const token = generateSessionToken(authUser);

    res.status(201).json({
      token,
      user: authUser
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Current Authenticated User Session
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  const token = req.headers.authorization?.substring(7).trim();
  if (token) removeSession(token);
  res.json({ message: 'Session terminated successfully.' });
});

// -------------------------------------------------------------
// PROPERTIES API (/api/properties) — LIVE 73,727 POSTGRESQL CATALOGUE
// -------------------------------------------------------------

app.get('/api/properties', async (req, res) => {
  try {
    const {
      query,
      city,
      location,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      purpose,
      furnishing,
      isActive,
      page,
      limit,
      sortBy
    } = req.query;

    if (isPostgresConfigured()) {
      try {
        const searchResult = await searchPropertiesFromDb({
          query: typeof query === 'string' ? query : undefined,
          city: typeof city === 'string' ? city : undefined,
          location: typeof location === 'string' ? location : undefined,
          propertyType: typeof propertyType === 'string' ? propertyType : undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          bedrooms: typeof bedrooms === 'string' ? bedrooms : undefined,
          bathrooms: typeof bathrooms === 'string' ? bathrooms : undefined,
          purpose: typeof purpose === 'string' ? purpose : undefined,
          furnishing: typeof furnishing === 'string' ? furnishing : undefined,
          isActive: isActive !== undefined ? isActive === 'true' : true,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 24,
          sortBy: typeof sortBy === 'string' ? (sortBy as any) : undefined
        });
        return res.json(searchResult);
      } catch (dbErr: any) {
        console.warn('[Properties API] PostgreSQL search error, falling back to local catalog:', dbErr.message);
      }
    }

    // Local in-memory fallback if database is offline
    const localProps = db.searchProperties({
      query: typeof query === 'string' ? query : undefined,
      location: typeof location === 'string' ? location : undefined,
      propertyType: typeof propertyType === 'string' ? propertyType : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: typeof bedrooms === 'string' ? bedrooms : undefined
    });
    res.json({
      properties: localProps,
      total: localProps.length,
      page: 1,
      limit: localProps.length,
      totalPages: 1
    });
  } catch (err: any) {
    console.error('[Properties API] Error:', err);
    res.status(500).json({ error: 'Failed fetching properties: ' + err.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    if (isPostgresConfigured()) {
      try {
        const property = await getPropertyByIdFromDb(req.params.id);
        if (property) {
          return res.json(property);
        }
      } catch (dbErr: any) {
        console.warn('[Properties API] PostgreSQL getById error, falling back to local catalog:', dbErr.message);
      }
    }
    const localProp = db.getPropertyById(req.params.id);
    if (!localProp) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    res.json(localProp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// AI VOICE ASSISTANT WITH REAL 73,727 DATABASE RECOMMENDATIONS
// -------------------------------------------------------------

function generateDomainFallbackReply(prompt: string, language: string = 'en', matchedProps: any[] = []) {
  const p = prompt.toLowerCase();

  // If real properties were matched from database, synthesize tailored reply
  if (matchedProps && matchedProps.length > 0) {
    const top = matchedProps[0].property;
    const top2 = matchedProps.length > 1 ? matchedProps[1].property : null;

    if (language === 'ta') {
      const secondMention = top2 ? ` மற்றும் "${top2.title}" (AED ${top2.priceAED.toLocaleString()})` : '';
      return `உங்கள் கேள்விக்கு ஏற்ப, துபாயின் சிறந்த சொத்தாக "${top.title}" (${top.location}) பரிந்துரைக்கப்படுகிறது. இதன் வாடகை/விற்பனை மதிப்பு AED ${top.priceAED.toLocaleString()} ஆகும். ${top.bedrooms} படுக்கையறைகள் மற்றும் ${top.bathrooms} குளியலறைகளுடன்${secondMention}, நீங்கள் உடனடியாக பார்வையிடலாம். நேரடி பார்வைக்கு ஏற்பாடு செய்யட்டுமா?`;
    }
    if (language === 'ar') {
      const secondMention = top2 ? ` وكذلك "${top2.title}" بقيمة ${top2.priceAED.toLocaleString()} درهم` : '';
      return `بناءً على طلبكم، نوصي بمشاهدة "${top.title}" في ${top.location} بقيمة ${top.priceAED.toLocaleString()} درهم. يضم العقار ${top.bedrooms} غرف نوم بمساحة ${top.areaSqFt.toLocaleString()} قدم مربع${secondMention}. هل ترغب في حجز موعد معاينة مع مستشارنا العقاري؟`;
    }
    const secondMention = top2 ? ` We also have ${top2.title} in ${top2.location} at AED ${top2.priceAED.toLocaleString()}.` : '';
    return `Based on our live Dubai portfolio, I recommend ${top.title} in ${top.location}, listed at AED ${top.priceAED.toLocaleString()} (${top.purpose}). This residence spans ${top.areaSqFt.toLocaleString()} sq.ft with ${top.bedrooms} bedrooms and ${top.bathrooms} bathrooms.${secondMention} Would you like to arrange a viewing or speak with a property consultant?`;
  }

  // Generic real estate advisory
  if (language === 'ta') {
    if (p.includes('விசா') || p.includes('visa')) {
      return `ஐக்கிய அரபு அமீரகத்தின் 10 ஆண்டு கோல்டன் விசா திட்டத்தின் கீழ், AED 2,000,000 க்கும் அதிகமான சொத்து முதலீடுகள் முழு குடும்பத்திற்கும் விசா தகுதி அளிக்கிறது. எங்கள் ஆலோசகர்கள் முழு சட்ட வழிகாட்டலை வழங்குவர்.`;
    }
    return `வணக்கம்! லைகா ரியாலிட்டியின் நேரலை போர்ட்ஃபோலியோவில் துபாய் மரினா, பாம் ஜுமேரா, டவுன்டவுன் உள்ளிட்ட பகுதிகளில் உள்ள 73,000 க்கும் மேற்பட்ட சொத்துக்கள் உள்ளன. நீங்கள் விரும்பும் பகுதி அல்லது பட்ஜெட் பற்றி கூறுங்கள்.`;
  }

  if (language === 'ar') {
    if (p.includes('فيزا') || p.includes('إقامة ذهبية')) {
      return `تمنح دولة الإمارات الإقامة الذهبية لمدة 10 سنوات للمستثمرين العقاريين بقيمة تفوق مليوني درهم لكافة أفراد العائلة. يتولى فريقنا في دبي تسهيل كافة الإجراءات الرسمية.`;
    }
    return `مرحباً بكم في لايكا العقارية. تضم محفظتنا أكثر من 73,000 عقار نشط في دبي مارينا، نخلة جميرا، ووسط مدينة دبي. يرجى إخباري بالمنطقة المفضلة وعدد الغرف وميزانيتكم لمساعدتكم.`;
  }

  return `Welcome to LYKA Realty. Our connected Dubai portfolio includes over 73,000 verified residences across Dubai Marina, Downtown, Palm Jumeirah, and prime residential communities. How may I assist with your property search or viewing arrangements today?`;
}

app.post('/api/assistant', rateLimitMiddleware, async (req, res) => {
  try {
    const { message, language = 'en', conversationContext = {}, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const trimmedMsg = message.trim().slice(0, 1000);
    const existingContext = {
      ...conversationContext,
      preferredLanguage: conversationContext.preferredLanguage || language
    };

    const turnResult = await processAssistantTurn(trimmedMsg, existingContext, conversationHistory);

    return res.json({
      reply: turnResult.reply,
      conversationContext: turnResult.context,
      propertyRecommendations: turnResult.propertyRecommendations,
      source: turnResult.source,
      handoffTriggered: turnResult.handoffTriggered || false,
      leadCreated: turnResult.leadCreated || false,
      quotaExceeded: false
    });
  } catch (err: any) {
    console.error('[AI Assistant] Server error:', err);
    return res.status(500).json({
      error: 'An unexpected error occurred while processing your voice advisory inquiry.'
    });
  }
});

// RAG Knowledge Base Endpoints (Dynamic stats, search & hot-reload)
app.get('/api/assistant/knowledge', (req, res) => {
  res.json(knowledgeService.getStats());
});

app.post('/api/assistant/knowledge/search', (req, res) => {
  const { query, topK } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required.' });
  const results = knowledgeService.searchKnowledge(query, { topK: Number(topK) || 3 });
  res.json({ query, resultsCount: results.length, results });
});

app.post('/api/assistant/knowledge/reload', async (req, res) => {
  const count = await knowledgeService.loadKnowledgeBase();
  res.json({ message: 'Knowledge base reloaded successfully.', chunkCount: count });
});

// -------------------------------------------------------------
// CRM REST APIS (BACKEND-ENFORCED PERMISSIONS & PERSISTENCE)
// -------------------------------------------------------------

// LEADS: Role-based access control
app.get('/api/crm/leads', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Access denied. Customers cannot view internal CRM leads.' });
    }

    if (isPostgresConfigured()) {
      try {
        const targetAgentId = user.role === 'sales_agent' ? user.id : (typeof req.query.agentId === 'string' ? req.query.agentId : undefined);
        const leads = await getLeadsFromDb(targetAgentId);
        return res.json(leads);
      } catch (dbErr: any) {
        console.warn('[CRM API] PostgreSQL leads error, falling back to local dataset:', dbErr.message);
      }
    }

    // Local fallback
    if (user.role === 'sales_agent') {
      return res.json(db.getLeads(user.id));
    }
    const { agentId } = req.query;
    return res.json(db.getLeads(typeof agentId === 'string' ? agentId : undefined));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Lead (with intelligent de-duplication and auto-assignment)
app.post('/api/crm/leads', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (isPostgresConfigured()) {
      try {
        const result = await createLeadInDb(req.body);
        // Auto-assign new leads only (not duplicate touchpoints)
        if (!result.isDuplicate && result.lead?.id) {
          const leadIdNum = parseInt(result.lead.id, 10);
          if (!isNaN(leadIdNum)) {
            // Fire-and-forget (non-blocking); failures logged but don't block response
            autoAssignLead(leadIdNum, req.body.clientName || 'New Customer').catch((e) =>
              console.warn('[AutoAssign] non-fatal error:', e)
            );
          }
        }
        return res.status(result.isDuplicate ? 200 : 201).json({
          ...result.lead,
          isDuplicateNotice: result.isDuplicate ? 'Customer touchpoint linked to existing record' : undefined
        });
      } catch (dbErr: any) {
        console.warn('[CRM API] PostgreSQL create lead error, falling back to local dataset:', dbErr.message);
      }
    }

    const { lead, isDuplicate } = db.createLead(req.body);
    res.status(isDuplicate ? 200 : 201).json({
      ...lead,
      isDuplicateNotice: isDuplicate ? 'Customer touchpoint linked to existing record' : undefined
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Lead: Permissions enforced
app.patch('/api/crm/leads/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (isPostgresConfigured()) {
      const updated = await updateLeadInDb(id, req.body, user.name);
      return res.json(updated);
    }

    const existing = db.getLeads().find((l) => l.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Sales Agent can ONLY update their assigned lead and CANNOT reassign to another agent
    if (user.role === 'sales_agent') {
      if (existing.assignedAgentId !== user.id) {
        return res.status(403).json({ error: 'Access denied. You can only manage leads assigned to your portfolio.' });
      }
      if (req.body.assignedAgentId && req.body.assignedAgentId !== user.id) {
        return res.status(403).json({ error: 'Sales agents are not authorized to reassign leads. Contact Operations Admin.' });
      }
    }

    const { actorName, ...updates } = req.body;
    const updated = db.updateLead(id, updates, user.name || actorName);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ACTIVITIES: Calls, WhatsApp, Meetings
app.get('/api/crm/activities', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { leadId } = req.query;

    if (user.role === 'sales_agent') {
      const acts = db.getActivities(typeof leadId === 'string' ? leadId : undefined, user.id);
      return res.json(acts);
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      const { agentId } = req.query;
      const acts = db.getActivities(
        typeof leadId === 'string' ? leadId : undefined,
        typeof agentId === 'string' ? agentId : undefined
      );
      return res.json(acts);
    }

    res.status(403).json({ error: 'Access denied.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/activities', requireAuth, requireRole('sales_agent', 'admin', 'super_admin'), (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const activityData = {
      ...req.body,
      agentId: user.role === 'sales_agent' ? user.id : req.body.agentId || user.id,
      agentName: user.name
    };
    const newAct = db.logActivity(activityData);
    res.status(201).json(newAct);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// VIEWINGS / SITE VISITS
app.get('/api/crm/viewings', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    if (isPostgresConfigured()) {
      try {
        const viewings = await getSiteVisitsFromDb(user.role === 'sales_agent' ? user.id : undefined);
        return res.json(viewings);
      } catch (dbErr: any) {
        console.warn('[CRM API] PostgreSQL viewings error, falling back to local dataset:', dbErr.message);
      }
    }
    const viewings = db.getViewingsForUser(user);
    res.json(viewings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/viewings', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (isPostgresConfigured()) {
      try {
        const newViewing = await createSiteVisitInDb(req.body);
        return res.status(201).json(newViewing);
      } catch (dbErr: any) {
        console.warn('[CRM API] PostgreSQL create viewing error, falling back to local dataset:', dbErr.message);
      }
    }
    const newViewing = db.createViewing(req.body);
    res.status(201).json(newViewing);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/crm/viewings/:id', requireAuth, requireRole('sales_agent', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (isPostgresConfigured()) {
      const updated = await updateSiteVisitInDb(id, req.body);
      return res.json(updated);
    }
    const updated = db.updateViewing(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Viewing not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// TRANSACTIONS & COMMISSIONS: Protected Executive Access
app.get('/api/crm/transactions', requireAuth, requireRole('sales_agent', 'super_admin'), (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const txs = db.getTransactionsForUser(user);
    res.json(txs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// STAFF & COMPENSATION: Protected Access
app.get('/api/crm/staff', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    if (isPostgresConfigured()) {
      try {
        const staff = await getAllStaffFromDb();
        if (user.role === 'sales_agent') {
          return res.json(staff.filter((s: any) => s.role === 'sales_agent'));
        }
        return res.json(staff);
      } catch (dbErr: any) {
        console.warn('[CRM API] PostgreSQL staff error, falling back to local dataset:', dbErr.message);
      }
    }
    const staff = db.getStaffForUser(user);
    res.json(staff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/crm/staff/:id', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = db.updateStaff(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Staff member not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// AUDIT LOGS & COMPLIANCE: Super Admin Only
app.get('/api/crm/audit-logs', requireAuth, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    if (isPostgresConfigured()) {
      try {
        const logs = await getAuditLogsFromDb();
        return res.json(logs);
      } catch (dbErr: any) {
        console.warn('[CRM API] PostgreSQL audit-logs error, falling back to local dataset:', dbErr.message);
      }
    }
    res.json(db.getAuditLogs());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/compliance', requireAuth, requireRole('super_admin'), (req: AuthenticatedRequest, res) => {
  try {
    res.json(db.getComplianceDocs());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SHORTLISTS: Saved properties in database
app.get('/api/crm/shortlists', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    if (isPostgresConfigured()) {
      const numUserId = parseInt(user.id, 10);
      if (!isNaN(numUserId)) {
        const ids = await getUserShortlistFromDb(numUserId);
        return res.json({ shortlist: ids });
      }
    }
    res.json({ shortlist: [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/shortlists/toggle', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { propertyId } = req.body;
    if (!propertyId) return res.status(400).json({ error: 'Property ID required' });

    if (isPostgresConfigured()) {
      const numUserId = parseInt(user.id, 10);
      if (!isNaN(numUserId)) {
        const result = await toggleShortlistInDb(numUserId, propertyId);
        return res.json(result);
      }
    }
    res.json({ saved: true, propertyId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CUSTOMER ENQUIRIES: Customer can only access their own, Admin/Super Admin access all
app.get('/api/crm/enquiries', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const enquiries = db.getEnquiriesForUser(user);
    res.json(enquiries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/enquiries', (req, res) => {
  try {
    const created = db.createEnquiry(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Voice Assistant Direct CRM Lead Creation
app.post('/api/crm/assistant/lead', async (req, res) => {
  try {
    const { clientName, phone, email, notes, propertyTitle, budget } = req.body;
    if (isPostgresConfigured()) {
      try {
        const result = await createLeadInDb({
          clientName: clientName || 'Voice Inquirer',
          email: email || 'confidential@sovereign-inquiry.com',
          phone: phone || '+971 50 000 0000',
          roleType: 'buyer',
          propertyTitle: propertyTitle || 'Prime Dubai Portfolio',
          notes: notes || 'Lead captured via LYKA Sovereign AI Voice Concierge.',
          budgetMinAED: budget?.min || 100000000,
          budgetMaxAED: budget?.max || 250000000,
          leadSource: 'AI Assistant'
        });
        // Auto-assign if new
        if (!result.isDuplicate && result.lead?.id) {
          const leadIdNum = parseInt(result.lead.id, 10);
          if (!isNaN(leadIdNum)) {
            autoAssignLead(leadIdNum, clientName || 'Voice Inquirer').catch((e) =>
              console.warn('[AutoAssign] assistant lead non-fatal error:', e)
            );
          }
        }
        return res.status(result.isDuplicate ? 200 : 201).json(result.lead);
      } catch (dbErr: any) {
        console.warn('[CRM API] PostgreSQL assistant lead error, falling back to local dataset:', dbErr.message);
      }
    }

    const { lead, isDuplicate } = db.createLead({
      clientName: clientName || 'Voice Inquirer',
      email: email || 'confidential@sovereign-inquiry.com',
      phone: phone || '+971 50 000 0000',
      roleType: 'buyer',
      propertyTitle: propertyTitle || 'Prime Dubai Portfolio',
      requirements: {
        budgetMinAED: budget?.min || 100000000,
        budgetMaxAED: budget?.max || 250000000,
        enclaves: ['Palm Jumeirah', 'Jumeirah Bay Island'],
        propertyTypes: ['Ultra-Prime Estate'],
        bedrooms: '5+',
        notes: notes || 'Lead captured via LYKA Sovereign AI Voice Concierge.'
      },
      preferredCallbackTime: 'Immediate / Afternoon GST',
      leadTemperature: 'hot',
      status: 'new',
      assignedAgentId: 'agent-01',
      assignedAgentName: 'Rashid Al-Falasi',
      source: 'AI Assistant',
      referralDetails: 'Captured via LYKA Voice Assistant session',
      lastContactedAt: new Date().toISOString().split('T')[0],
      nextFollowUpDate: new Date().toISOString().split('T')[0],
      isOverdue: false
    });
    res.status(isDuplicate ? 200 : 201).json(lead);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// NOTIFICATIONS API
// -------------------------------------------------------------

app.get('/api/notifications', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userId = parseInt(user.id, 10);
    if (isNaN(userId)) return res.json([]);

    if (isPostgresConfigured()) {
      try {
        const unreadOnly = req.query.unread === 'true';
        const notifications = await getNotificationsForUser(userId, user.role, unreadOnly);
        return res.json(notifications);
      } catch (dbErr: any) {
        console.warn('[Notifications] DB error:', dbErr.message);
      }
    }
    res.json([]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userId = parseInt(user.id, 10);
    const notifId = parseInt(req.params.id, 10);
    if (isNaN(userId) || isNaN(notifId)) return res.status(400).json({ error: 'Invalid ID' });

    if (isPostgresConfigured()) {
      const ok = await markNotificationRead(notifId, userId);
      return res.json({ success: ok });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// DASHBOARD STATS API (real DB — no hardcoded metrics)
// -------------------------------------------------------------

app.get('/api/crm/dashboard/stats', requireAuth, requireRole('admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    if (isPostgresConfigured()) {
      try {
        const stats = await getDashboardStats();
        if (stats) return res.json(stats);
      } catch (dbErr: any) {
        console.warn('[Dashboard Stats] DB error:', dbErr.message);
      }
    }
    // Local fallback with real counts from local DB
    const allLeads = db.getLeads();
    res.json({
      totalCustomers: 0,
      totalLeads: allLeads.length,
      newLeads: allLeads.filter((l: any) => l.status === 'new').length,
      assignedLeads: allLeads.filter((l: any) => l.assignedAgentId).length,
      pendingLeads: allLeads.filter((l: any) => l.status === 'new').length,
      contactedLeads: allLeads.filter((l: any) => l.status === 'contacted').length,
      viewingScheduledLeads: allLeads.filter((l: any) => l.status === 'viewing_scheduled').length,
      negotiationLeads: allLeads.filter((l: any) => l.status === 'negotiation').length,
      wonLeads: allLeads.filter((l: any) => l.status === 'won').length,
      lostLeads: allLeads.filter((l: any) => l.status === 'lost').length,
      todayLeads: 0,
      monthlyLeadCounts: [],
      agentPerformance: []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// LEAD CHECKLIST API
// -------------------------------------------------------------

app.get('/api/crm/checklist/:leadId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    if (user.role === 'customer') return res.status(403).json({ error: 'Access denied.' });

    const leadId = parseInt(req.params.leadId, 10);
    if (isNaN(leadId)) return res.status(400).json({ error: 'Invalid lead ID' });

    const checklist = await getLeadChecklist(leadId);
    res.json(checklist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/crm/checklist/:leadId/:stepKey', requireAuth, requireRole('sales_agent', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const leadId = parseInt(req.params.leadId, 10);
    if (isNaN(leadId)) return res.status(400).json({ error: 'Invalid lead ID' });

    const { stepKey } = req.params;
    const { isCompleted, notes } = req.body;
    const actorId = parseInt(user.id, 10);

    const result = await toggleChecklistStep(
      leadId,
      stepKey,
      Boolean(isCompleted),
      isNaN(actorId) ? 0 : actorId,
      user.name || 'Agent',
      notes
    );

    if (!result) {
      // Graceful fallback when DB not configured
      return res.json({ stepKey, isCompleted: Boolean(isCompleted), leadId, notes: notes ?? null });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ATTENDANCE API
// -------------------------------------------------------------

app.get('/api/crm/attendance', requireAuth, requireRole('sales_agent', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userId = parseInt(user.id, 10);

    // Sales agents see only their own attendance
    const targetUserId = user.role === 'sales_agent' ? (isNaN(userId) ? undefined : userId) : undefined;
    const { from, to } = req.query;

    if (isPostgresConfigured()) {
      try {
        const records = await getAttendance(
          targetUserId,
          typeof from === 'string' ? from : undefined,
          typeof to === 'string' ? to : undefined
        );
        return res.json(records);
      } catch (dbErr: any) {
        console.warn('[Attendance] DB error:', dbErr.message);
      }
    }
    res.json([]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/attendance/clock-in', requireAuth, requireRole('sales_agent', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userId = parseInt(user.id, 10);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    if (isPostgresConfigured()) {
      try {
        const record = await clockIn(userId, req.body.notes);
        return res.json(record ?? { message: 'Clocked in', userId, timestamp: new Date().toISOString() });
      } catch (dbErr: any) {
        console.warn('[Attendance] clock-in DB error:', dbErr.message);
      }
    }
    res.json({ message: 'Clocked in (local mode)', userId, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/attendance/clock-out', requireAuth, requireRole('sales_agent', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userId = parseInt(user.id, 10);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    if (isPostgresConfigured()) {
      try {
        const record = await clockOut(userId, req.body.notes);
        return res.json(record ?? { message: 'Clocked out', userId, timestamp: new Date().toISOString() });
      } catch (dbErr: any) {
        console.warn('[Attendance] clock-out DB error:', dbErr.message);
      }
    }
    res.json({ message: 'Clocked out (local mode)', userId, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// COMMISSIONS API
// -------------------------------------------------------------

app.get('/api/crm/commissions', requireAuth, requireRole('sales_agent', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userId = parseInt(user.id, 10);
    const agentId = user.role === 'sales_agent' ? (isNaN(userId) ? undefined : userId) : undefined;

    if (isPostgresConfigured()) {
      try {
        const records = await getCommissions(agentId);
        return res.json(records);
      } catch (dbErr: any) {
        console.warn('[Commissions] DB error:', dbErr.message);
      }
    }
    const txs = db.getTransactionsForUser(user);
    res.json(txs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/commissions', requireAuth, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    if (isPostgresConfigured()) {
      try {
        const record = await createCommission(req.body);
        return res.status(201).json(record ?? { message: 'Commission created' });
      } catch (dbErr: any) {
        console.warn('[Commissions] create DB error:', dbErr.message);
      }
    }
    res.status(201).json({ message: 'Commission recorded (local mode)', ...req.body });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/crm/commissions/:id/approve', requireAuth, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const commissionId = parseInt(req.params.id, 10);
    const approverId = parseInt(user.id, 10);
    if (isNaN(commissionId) || isNaN(approverId)) return res.status(400).json({ error: 'Invalid IDs' });

    const { status, notes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    if (isPostgresConfigured()) {
      try {
        const record = await updateCommissionApproval(commissionId, status, approverId, notes);
        return res.json(record ?? { message: 'Updated', commissionId, status });
      } catch (dbErr: any) {
        console.warn('[Commissions] approve DB error:', dbErr.message);
      }
    }
    res.json({ message: 'Approval updated (local mode)', commissionId, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// VITE / STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  // Initialize Dubai Real Estate Knowledge Base (RAG)
  await knowledgeService.loadKnowledgeBase();

  // Initialize PostgreSQL schema if configured
  if (isPostgresConfigured()) {
    console.log('[PostgreSQL] Connecting to configured database...');
    await initPostgresDatabase();
  } else {
    console.log('[LYKA Realty] Database running in DEMO_LOCAL mode (crm_db.json). For production PostgreSQL, set DATABASE_URL.');
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[LYKA Realty] Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
