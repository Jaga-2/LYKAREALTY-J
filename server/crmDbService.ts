import bcrypt from 'bcryptjs';
import { getPostgresPool } from './postgres.js';
import { AuthenticatedUser } from './auth.js';

export interface DbUser {
  id: number;
  email: string;
  hashed_password: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at?: Date;
}

export interface DbLead {
  id: number;
  customer_id?: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  conversation_id?: string | null;
  intent?: string | null;
  budget?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  location?: string | null;
  preferred_location?: string | null;
  bedrooms?: number | null;
  property_type?: string | null;
  furnished?: number | null;
  interested_property_id?: number | null;
  site_visit_id?: number | null;
  preferred_language?: string | null;
  assigned_employee_id?: number | null;
  timeline?: string | null;
  lead_score?: number | null;
  lead_status?: string | null;
  score_factors?: string | null;
  requirements_summary?: string | null;
  conversation_summary?: string | null;
  follow_up_notes?: string | null;
  lead_source?: string | null;
  contact_preference?: string | null;
  consent_contact?: number | null;
  follow_up_date?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface DbSiteVisit {
  id: number;
  property_id?: number | null;
  user_id?: number | null;
  lead_id?: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  preferred_date?: string | null;
  preferred_time?: string | null;
  notes?: string | null;
  status: string;
  assigned_agent_id?: number | null;
  rescheduled_date?: string | null;
  rescheduled_time?: string | null;
  confirmation_notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface DbAuditLog {
  id: number;
  user_id?: number | null;
  user_email: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: Date;
}

// Convert DB user row to frontend AuthenticatedUser
export function mapDbUserToAuth(row: any): AuthenticatedUser {
  return {
    id: String(row.id),
    email: row.email,
    role: row.role as any,
    name: row.full_name || row.email.split('@')[0],
    phone: row.phone || '',
    title: getRoleTitle(row.role),
    avatar: getRoleAvatar(row.role, row.id)
  };
}

function getRoleTitle(role: string): string {
  switch (role) {
    case 'super_admin': return 'Principal Executive Partner';
    case 'admin': return 'Head of Operations & Lead Management';
    case 'sales_agent': return 'Senior Sovereign Client Advisor';
    default: return 'Private Client';
  }
}

function getRoleAvatar(role: string, id: number): string {
  if (role === 'super_admin') return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';
  if (role === 'admin') return 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80';
  if (role === 'sales_agent') return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
}

// Map PostgreSQL lead to frontend Lead interface
export function mapDbLeadToFrontend(row: any, agentsMap?: Map<number, string>): any {
  const agentName = (agentsMap && row.assigned_employee_id && agentsMap.get(row.assigned_employee_id))
    ? agentsMap.get(row.assigned_employee_id)
    : (row.assigned_employee_id ? `Advisor #${row.assigned_employee_id}` : 'Unassigned (General Pool)');

  const statusMap: Record<string, string> = {
    'QUALIFIED': 'new',
    'NEW': 'new',
    'CONTACTED': 'contacted',
    'VIEWING_SCHEDULED': 'viewing_scheduled',
    'NEGOTIATION': 'negotiation',
    'UNDER_CONTRACT': 'under_contract',
    'WON': 'won',
    'LOST': 'lost'
  };

  const status = statusMap[row.lead_status?.toUpperCase()] || 'new';

  return {
    id: String(row.id),
    clientName: row.customer_name || 'Private Patron',
    email: row.customer_email || 'patron@lykarealty.ae',
    phone: row.customer_phone || '',
    roleType: row.intent === 'rent' ? 'tenant' : 'buyer',
    propertyInterestId: row.interested_property_id ? String(row.interested_property_id) : undefined,
    propertyTitle: row.requirements_summary || (row.location ? `Luxury Residence in ${row.location}` : 'Prime Dubai Residence'),
    requirements: {
      budgetMinAED: row.budget_min || (row.budget ? row.budget * 0.8 : 50000),
      budgetMaxAED: row.budget_max || row.budget || 500000,
      enclaves: [row.preferred_location || row.location || 'Dubai Marina'],
      propertyTypes: [row.property_type || 'Apartment'],
      bedrooms: row.bedrooms ? `${row.bedrooms} BHK` : '2 BHK',
      notes: row.conversation_summary || row.follow_up_notes || 'Captured via LYKA Platform.'
    },
    preferredCallbackTime: 'Afternoon GST',
    leadTemperature: (row.lead_score && row.lead_score >= 80) ? 'hot' : (row.lead_score && row.lead_score >= 50) ? 'warm' : 'cold',
    status,
    assignedAgentId: row.assigned_employee_id ? String(row.assigned_employee_id) : 'agent-01',
    assignedAgentName: agentName,
    source: row.lead_source === 'AI_CHAT' ? 'AI Assistant' : 'LYKA Editorial Web',
    referralDetails: 'Direct Web Platform',
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    lastContactedAt: row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    nextFollowUpDate: row.follow_up_date ? new Date(row.follow_up_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isOverdue: false
  };
}

// Map PostgreSQL site_visit to frontend ViewingAppointment
export function mapDbSiteVisitToFrontend(row: any): any {
  return {
    id: String(row.id),
    leadId: row.lead_id ? String(row.lead_id) : `lead-${row.id}`,
    propertyId: row.property_id ? String(row.property_id) : 'prop-general',
    propertyTitle: row.notes || 'Dubai Prime Residence Viewing',
    agentId: row.assigned_agent_id ? String(row.assigned_agent_id) : 'agent-01',
    agentName: row.assigned_agent_id ? `Advisor #${row.assigned_agent_id}` : 'Rashid Al-Falasi',
    clientName: row.customer_name,
    clientPhone: row.customer_phone,
    date: row.preferred_date || new Date().toISOString().split('T')[0],
    time: row.preferred_time || '15:00 GST',
    status: (row.status?.toLowerCase() as any) || 'requested',
    notes: row.confirmation_notes || row.notes || 'Private escorted viewing appointment.'
  };
}

// -----------------------------------------------------------------------
// USER & AUTHENTICATION DB SERVICES
// -----------------------------------------------------------------------

export async function findUserByEmailFromDb(email: string): Promise<DbUser | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  const res = await pool.query(
    'SELECT id, email, hashed_password, full_name, phone, role, is_active, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email.trim()]
  );

  return res.rows[0] || null;
}

export async function findUserByIdFromDb(id: number | string): Promise<DbUser | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId)) return null;

  const res = await pool.query(
    'SELECT id, email, hashed_password, full_name, phone, role, is_active, created_at FROM users WHERE id = $1 LIMIT 1',
    [numericId]
  );

  return res.rows[0] || null;
}

export async function verifyUserPassword(user: DbUser, plainPassword: string): Promise<boolean> {
  if (!user.hashed_password) return false;

  // 1. Try standard bcrypt comparison
  try {
    if (bcrypt.compareSync(plainPassword, user.hashed_password)) {
      return true;
    }
  } catch (err) {
    // continue
  }

  return false;
}

export async function createUserInDb(data: {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role?: string;
}): Promise<DbUser> {
  const pool = getPostgresPool();
  if (!pool) throw new Error('Database pool not available.');

  const role = data.role || 'customer';
  const plainPass = data.password || 'LykaClient2025!';
  const hashed = bcrypt.hashSync(plainPass, 12);

  const res = await pool.query(
    `INSERT INTO users (email, hashed_password, full_name, phone, role, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW())
     RETURNING id, email, hashed_password, full_name, phone, role, is_active, created_at`,
    [data.email.toLowerCase().trim(), hashed, data.fullName.trim(), data.phone || '', role]
  );

  return res.rows[0];
}

async function postgresTableExists(tableName: string): Promise<boolean> {
  const pool = getPostgresPool();
  if (!pool) return false;

  try {
    const res = await pool.query(
      `SELECT to_regclass($1) AS table_exists`,
      [tableName]
    );
    return !!res.rows[0]?.table_exists;
  } catch {
    return false;
  }
}

export async function getAllStaffFromDb(): Promise<any[]> {
  const pool = getPostgresPool();
  if (!pool) return [];

  const hasCommissions = await postgresTableExists('public.commissions');

  // Fetch staff with real lead counts from the DB (no hardcoded metrics).
  // Production schema currently exposes leads/users but not the bonus commissions table.
  const res = await pool.query(
    hasCommissions
      ? `
        SELECT
          u.id, u.email, u.full_name, u.phone, u.role, u.is_active, u.created_at,
          COALESCE(open_leads.cnt, 0)    AS active_deals_count,
          COALESCE(won_leads.cnt, 0)     AS deals_closed_ytd,
          COALESCE(vol.total_vol, 0)     AS total_volume_aed,
          COALESCE(all_leads.cnt, 0)     AS assigned_leads_count
        FROM users u
        LEFT JOIN (
          SELECT assigned_employee_id, COUNT(*) AS cnt
            FROM leads
           WHERE lead_status NOT IN ('WON','LOST')
           GROUP BY assigned_employee_id
        ) open_leads  ON open_leads.assigned_employee_id = u.id
        LEFT JOIN (
          SELECT assigned_employee_id, COUNT(*) AS cnt
            FROM leads
           WHERE lead_status = 'WON'
             AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
           GROUP BY assigned_employee_id
        ) won_leads   ON won_leads.assigned_employee_id = u.id
        LEFT JOIN (
          SELECT agent_id, SUM(deal_amount) AS total_vol
            FROM commissions
           WHERE approval_status = 'approved'
           GROUP BY agent_id
        ) vol         ON vol.agent_id = u.id
        LEFT JOIN (
          SELECT assigned_employee_id, COUNT(*) AS cnt
            FROM leads
           GROUP BY assigned_employee_id
        ) all_leads   ON all_leads.assigned_employee_id = u.id
        WHERE u.role IN ('sales_agent', 'admin', 'super_admin', 'manager')
        ORDER BY u.id ASC
      `
      : `
        SELECT
          u.id, u.email, u.full_name, u.phone, u.role, u.is_active, u.created_at,
          COALESCE(open_leads.cnt, 0)    AS active_deals_count,
          COALESCE(won_leads.cnt, 0)     AS deals_closed_ytd,
          0                             AS total_volume_aed,
          COALESCE(all_leads.cnt, 0)     AS assigned_leads_count
        FROM users u
        LEFT JOIN (
          SELECT assigned_employee_id, COUNT(*) AS cnt
            FROM leads
           WHERE lead_status NOT IN ('WON','LOST')
           GROUP BY assigned_employee_id
        ) open_leads  ON open_leads.assigned_employee_id = u.id
        LEFT JOIN (
          SELECT assigned_employee_id, COUNT(*) AS cnt
            FROM leads
           WHERE lead_status = 'WON'
             AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
           GROUP BY assigned_employee_id
        ) won_leads   ON won_leads.assigned_employee_id = u.id
        LEFT JOIN (
          SELECT assigned_employee_id, COUNT(*) AS cnt
            FROM leads
           GROUP BY assigned_employee_id
        ) all_leads   ON all_leads.assigned_employee_id = u.id
        WHERE u.role IN ('sales_agent', 'admin', 'super_admin', 'manager')
        ORDER BY u.id ASC
      `
  );

  return res.rows.map((row) => ({
    id: String(row.id),
    name: row.full_name || row.email.split('@')[0],
    email: row.email,
    phone: row.phone || '+971 4 812 9000',
    role: row.role === 'manager' ? 'admin' : row.role,
    title: getRoleTitle(row.role),
    avatar: getRoleAvatar(row.role, row.id),
    baseSalaryAED: row.role === 'super_admin' ? 85000 : row.role === 'admin' ? 45000 : 35000,
    commissionRatePercent: row.role === 'sales_agent' ? 45 : 0,
    activeDealsCount: Number(row.active_deals_count),
    dealsClosedYTD: Number(row.deals_closed_ytd),
    totalVolumeAED: Number(row.total_volume_aed),
    status: row.is_active ? 'active' : 'on_leave',
    assignedLeadsCount: Number(row.assigned_leads_count)
  }));
}

// -----------------------------------------------------------------------
// LEADS DB SERVICES
// -----------------------------------------------------------------------

export async function getLeadsFromDb(agentId?: string): Promise<any[]> {
  const pool = getPostgresPool();
  if (!pool) return [];

  // Build agents lookup map
  const staffRes = await pool.query('SELECT id, full_name FROM users WHERE role IN (\'sales_agent\', \'admin\', \'super_admin\', \'manager\')');
  const agentsMap = new Map<number, string>();
  for (const s of staffRes.rows) {
    agentsMap.set(s.id, s.full_name);
  }

  let query = 'SELECT * FROM leads';
  const params: any[] = [];

  if (agentId) {
    const numAgentId = parseInt(agentId, 10);
    if (!isNaN(numAgentId)) {
      query += ' WHERE assigned_employee_id = $1';
      params.push(numAgentId);
    }
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  const res = await pool.query(query, params);
  return res.rows.map((row) => mapDbLeadToFrontend(row, agentsMap));
}

export async function createLeadInDb(leadData: {
  clientName: string;
  email: string;
  phone: string;
  roleType?: string;
  propertyTitle?: string;
  propertyInterestId?: string;
  requirements?: any;
  leadSource?: string;
  notes?: string;
  budgetMinAED?: number;
  budgetMaxAED?: number;
}): Promise<any> {
  const pool = getPostgresPool();
  if (!pool) throw new Error('Database pool unavailable.');

  // Check for duplicate by email
  const existing = await pool.query(
    'SELECT id FROM leads WHERE LOWER(customer_email) = LOWER($1) ORDER BY id DESC LIMIT 1',
    [leadData.email.trim()]
  );

  const budgetMin = leadData.budgetMinAED || leadData.requirements?.budgetMinAED || null;
  const budgetMax = leadData.budgetMaxAED || leadData.requirements?.budgetMaxAED || null;
  const budget = budgetMax || budgetMin || 150000;
  const location = leadData.requirements?.enclaves?.[0] || 'Dubai Marina';
  const propType = leadData.requirements?.propertyTypes?.[0] || 'Apartment';
  const bedrooms = leadData.requirements?.bedrooms ? parseInt(leadData.requirements.bedrooms, 10) || 2 : 2;
  const notes = leadData.notes || leadData.requirements?.notes || 'Customer touchpoint recorded.';
  const interestedPropId = leadData.propertyInterestId ? parseInt(leadData.propertyInterestId, 10) || null : null;

  // Assign to default first sales agent (id: 2 Demo Sales Agent)
  const defaultAgentId = 2;

  if (existing.rows.length > 0) {
    // Update existing lead touchpoint
    const leadId = existing.rows[0].id;
    await pool.query(
      `UPDATE leads 
       SET follow_up_notes = CONCAT(COALESCE(follow_up_notes, ''), E'\\n', $1::text),
           updated_at = NOW()
       WHERE id = $2`,
      [`[${new Date().toISOString()}] New touchpoint: ${notes}`, leadId]
    );

    const updated = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    return { lead: mapDbLeadToFrontend(updated.rows[0]), isDuplicate: true };
  }

  const res = await pool.query(
    `INSERT INTO leads (
       customer_name, customer_email, customer_phone, intent, budget, budget_min, budget_max,
       location, preferred_location, bedrooms, property_type, interested_property_id,
       assigned_employee_id, lead_score, lead_status, conversation_summary, follow_up_notes,
       lead_source, contact_preference, consent_contact, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 85, 'NEW', $14, $15, $16, 'ANY', 1, NOW(), NOW()
     ) RETURNING *`,
    [
      leadData.clientName.trim(),
      leadData.email.toLowerCase().trim(),
      leadData.phone || '',
      leadData.roleType === 'tenant' ? 'rent' : 'buy',
      budget,
      budgetMin,
      budgetMax,
      location,
      location,
      bedrooms,
      propType,
      interestedPropId,
      defaultAgentId,
      leadData.propertyTitle || 'Prime Dubai Residence',
      notes,
      leadData.leadSource || 'LYKA Web Platform'
    ]
  );

  return { lead: mapDbLeadToFrontend(res.rows[0]), isDuplicate: false };
}

export async function updateLeadInDb(leadId: string, updates: any, actorName?: string): Promise<any> {
  const pool = getPostgresPool();
  if (!pool) throw new Error('Database pool unavailable.');

  const id = parseInt(leadId, 10);
  if (isNaN(id)) throw new Error('Invalid lead ID');

  const fields: string[] = ['updated_at = NOW()'];
  const values: any[] = [];
  let idx = 1;

  if (updates.status) {
    fields.push(`lead_status = $${idx++}`);
    values.push(updates.status.toUpperCase());
  }

  if (updates.assignedAgentId) {
    const agentNum = parseInt(updates.assignedAgentId, 10);
    if (!isNaN(agentNum)) {
      fields.push(`assigned_employee_id = $${idx++}`);
      values.push(agentNum);
    }
  }

  if (updates.leadTemperature) {
    const score = updates.leadTemperature === 'hot' ? 90 : updates.leadTemperature === 'warm' ? 60 : 30;
    fields.push(`lead_score = $${idx++}`);
    values.push(score);
  }

  if (updates.notes || actorName) {
    const noteText = `[Update by ${actorName || 'System'}]: ${updates.notes || 'Status modified'}`;
    fields.push(`follow_up_notes = CONCAT(COALESCE(follow_up_notes, ''), E'\\n', $${idx++}::text)`);
    values.push(noteText);
  }

  values.push(id);
  const sql = `UPDATE leads SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  const res = await pool.query(sql, values);

  if (res.rows.length === 0) throw new Error('Lead not found');
  return mapDbLeadToFrontend(res.rows[0]);
}

// -----------------------------------------------------------------------
// SITE VISITS / VIEWINGS DB SERVICES
// -----------------------------------------------------------------------

export async function getSiteVisitsFromDb(agentId?: string): Promise<any[]> {
  const pool = getPostgresPool();
  if (!pool) return [];

  let query = 'SELECT * FROM site_visits';
  const params: any[] = [];

  if (agentId) {
    const numAgentId = parseInt(agentId, 10);
    if (!isNaN(numAgentId)) {
      query += ' WHERE assigned_agent_id = $1';
      params.push(numAgentId);
    }
  }

  query += ' ORDER BY created_at DESC LIMIT 100';
  const res = await pool.query(query, params);
  return res.rows.map(mapDbSiteVisitToFrontend);
}

export async function createSiteVisitInDb(data: {
  propertyId?: string;
  leadId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  assignedAgentId?: string;
}): Promise<any> {
  const pool = getPostgresPool();
  if (!pool) throw new Error('Database pool unavailable.');

  const propId = data.propertyId ? parseInt(data.propertyId, 10) || 62980 : 62980;
  const leadId = data.leadId ? parseInt(data.leadId, 10) || null : null;
  const agentId = data.assignedAgentId ? parseInt(data.assignedAgentId, 10) || 2 : 2;

  const res = await pool.query(
    `INSERT INTO site_visits (
       property_id, lead_id, customer_name, customer_email, customer_phone,
       preferred_date, preferred_time, notes, status, assigned_agent_id, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, 'requested', $9, NOW(), NOW()
     ) RETURNING *`,
    [
      propId,
      leadId,
      data.customerName.trim(),
      data.customerEmail.toLowerCase().trim(),
      data.customerPhone || '',
      data.preferredDate || new Date().toISOString().split('T')[0],
      data.preferredTime || '15:00 GST',
      data.notes || 'Viewing requested via LYKA Platform.',
      agentId
    ]
  );

  return mapDbSiteVisitToFrontend(res.rows[0]);
}

export async function updateSiteVisitInDb(id: string, updates: any): Promise<any> {
  const pool = getPostgresPool();
  if (!pool) throw new Error('Database pool unavailable.');

  const visitId = parseInt(id, 10);
  if (isNaN(visitId)) throw new Error('Invalid viewing ID');

  const fields: string[] = ['updated_at = NOW()'];
  const values: any[] = [];
  let idx = 1;

  if (updates.status) {
    fields.push(`status = $${idx++}`);
    values.push(updates.status);
  }

  if (updates.notes) {
    fields.push(`confirmation_notes = $${idx++}`);
    values.push(updates.notes);
  }

  values.push(visitId);
  const sql = `UPDATE site_visits SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  const res = await pool.query(sql, values);

  if (res.rows.length === 0) throw new Error('Viewing not found');
  return mapDbSiteVisitToFrontend(res.rows[0]);
}

// -----------------------------------------------------------------------
// AUDIT LOGS DB SERVICES
// -----------------------------------------------------------------------

export async function getAuditLogsFromDb(): Promise<any[]> {
  const pool = getPostgresPool();
  if (!pool) return [];

  const res = await pool.query(
    'SELECT id, user_id, user_email, user_role, action, resource_type, resource_id, details, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 100'
  );

  return res.rows.map((row) => ({
    id: String(row.id),
    timestamp: row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 16) : '',
    actorName: row.user_email?.split('@')[0] || 'System',
    actorRole: row.user_role || 'Operations',
    action: row.action,
    target: row.details || `${row.resource_type} #${row.resource_id || ''}`,
    ipAddress: row.ip_address || '127.0.0.1',
    severity: (row.action.includes('ERROR') || row.action.includes('SECURITY')) ? 'security' : 'info'
  }));
}

export async function logAuditInDb(entry: {
  userId?: number;
  userEmail: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
}): Promise<void> {
  const pool = getPostgresPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_email, user_role, action, resource_type, resource_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        entry.userId || null,
        entry.userEmail,
        entry.userRole,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.details || null,
        entry.ipAddress || null
      ]
    );
  } catch (err: any) {
    console.warn('[Audit Log] Failed recording audit entry to PostgreSQL:', err.message);
  }
}

// -----------------------------------------------------------------------
// SHORTLISTS DB SERVICES
// -----------------------------------------------------------------------

export async function getUserShortlistFromDb(userId: number): Promise<string[]> {
  const pool = getPostgresPool();
  if (!pool) return [];

  const res = await pool.query(
    'SELECT property_id FROM shortlists WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  return res.rows.map((r) => String(r.property_id));
}

export async function toggleShortlistInDb(userId: number, propertyId: string | number): Promise<{ saved: boolean; propertyId: string }> {
  const pool = getPostgresPool();
  const propNum = typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId;
  if (!pool || isNaN(propNum)) return { saved: false, propertyId: String(propertyId) };

  const existing = await pool.query(
    'SELECT id FROM shortlists WHERE user_id = $1 AND property_id = $2',
    [userId, propNum]
  );

  if (existing.rows.length > 0) {
    await pool.query('DELETE FROM shortlists WHERE user_id = $1 AND property_id = $2', [userId, propNum]);
    return { saved: false, propertyId: String(propNum) };
  } else {
    await pool.query(
      'INSERT INTO shortlists (user_id, property_id, created_at) VALUES ($1, $2, NOW())',
      [userId, propNum]
    );
    return { saved: true, propertyId: String(propNum) };
  }
}
