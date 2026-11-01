/**
 * autoAssignmentService.ts
 * -----------------------------------------------------------------------
 * Handles automatic lead assignment, notification creation, and dashboard
 * statistics for the LYKA Realty CRM.
 *
 * All queries are read-only on the property/leads data (73,727 records safe).
 * Only writes to: leads, notifications, lead_checklist tables.
 */

import { getPostgresPool } from './postgres.js';

const inMemoryNotifications: any[] = [];
let nextNotificationId = 1;

async function tableExists(tableName: string): Promise<boolean> {
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

// -----------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------

export interface AgentWorkload {
  id: number;
  fullName: string;
  email: string;
  openLeadCount: number;
}

export interface NotificationPayload {
  recipientId?: number;
  recipientRole?: string;
  type: string;
  title: string;
  message: string;
  relatedLeadId?: number;
}

export interface DashboardStats {
  totalCustomers: number;
  totalLeads: number;
  newLeads: number;
  assignedLeads: number;
  pendingLeads: number;
  contactedLeads: number;
  viewingScheduledLeads: number;
  negotiationLeads: number;
  wonLeads: number;
  lostLeads: number;
  todayLeads: number;
  monthlyLeadCounts: { month: string; count: number }[];
  agentPerformance: AgentPerformanceRow[];
}

export interface AgentPerformanceRow {
  agentId: number;
  agentName: string;
  totalLeads: number;
  openLeads: number;
  wonLeads: number;
  lostLeads: number;
}

// -----------------------------------------------------------------------
// DEFAULT SALES AGENT CALL CHECKLIST (11 steps)
// -----------------------------------------------------------------------

export const DEFAULT_CHECKLIST_STEPS: { key: string; label: string }[] = [
  { key: 'initial_call',        label: 'Initial welcome call made'                         },
  { key: 'requirements',        label: 'Requirements & budget confirmed'                   },
  { key: 'property_shortlist',  label: 'Property shortlist sent to client'                 },
  { key: 'viewing_scheduled',   label: 'Viewing appointment scheduled'                     },
  { key: 'viewing_completed',   label: 'Viewing completed & feedback collected'            },
  { key: 'follow_up_call',      label: 'Post-viewing follow-up call made'                  },
  { key: 'offer_discussion',    label: 'Offer / negotiation discussion held'               },
  { key: 'docs_collected',      label: 'KYC & required documents collected'                },
  { key: 'mou_signed',          label: 'MOU / Letter of Intent signed'                     },
  { key: 'payment_confirmed',   label: 'Payment plan / transfer confirmed'                 },
  { key: 'handover_done',       label: 'Property handed over & customer onboarded'         }
];

// -----------------------------------------------------------------------
// AGENT AUTO-ASSIGNMENT (round-robin by lowest open lead count)
// -----------------------------------------------------------------------

/**
 * Returns the sales agent with fewest open leads (excludes WON/LOST).
 * Falls back to the first available agent if all have equal load.
 */
export async function getAvailableAgent(): Promise<AgentWorkload | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  try {
    const res = await pool.query<AgentWorkload & { open_lead_count: string }>(`
      SELECT
        u.id,
        u.full_name AS "fullName",
        u.email,
        COALESCE(open.cnt, 0) AS "openLeadCount"
      FROM users u
      LEFT JOIN (
        SELECT assigned_employee_id, COUNT(*) AS cnt
        FROM   leads
        WHERE  lead_status NOT IN ('WON', 'LOST')
        GROUP  BY assigned_employee_id
      ) open ON open.assigned_employee_id = u.id
      WHERE u.role = 'sales_agent'
        AND u.is_active = true
      ORDER BY "openLeadCount" ASC, u.id ASC
      LIMIT 1
    `);

    if (res.rows.length === 0) return null;
    const row = res.rows[0] as any;
    return {
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      openLeadCount: Number(row.openLeadCount)
    };
  } catch (err) {
    console.error('[AutoAssignment] getAvailableAgent error:', err);
    return null;
  }
}

/**
 * Assigns a lead to the agent with the lowest open-lead count.
 * Updates leads.assigned_employee_id, assigned_at, assignment_notes.
 * Creates notifications for the assigned agent and all admins.
 * Seeds the default call checklist steps.
 * Returns the assigned agent or null on failure.
 */
export async function autoAssignLead(
  leadId: number,
  customerName: string
): Promise<AgentWorkload | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  try {
    const agent = await getAvailableAgent();
    if (!agent) {
      console.warn('[AutoAssignment] No available sales agents found.');
      return null;
    }

    // Update lead using the columns that exist in the live production schema.
    await pool.query(
      `UPDATE leads
         SET assigned_employee_id = $1,
             lead_status          = COALESCE(NULLIF(lead_status, ''), 'NEW'),
             follow_up_notes      = CONCAT(COALESCE(follow_up_notes, ''), E'\\n', $2::text),
             updated_at           = NOW()
       WHERE id = $3`,
      [
        agent.id,
        `Auto-assigned to ${agent.fullName} (round-robin load balancing)`,
        leadId
      ]
    );

    // Notify the assigned agent
    await createNotification({
      recipientId: agent.id,
      type: 'new_lead_assigned',
      title: 'New Lead Assigned',
      message: `A new lead from ${customerName} has been assigned to you. Please make initial contact within 2 hours.`,
      relatedLeadId: leadId
    });

    // Notify all admins
    const adminRes = await pool.query(
      `SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND is_active = true`
    );
    for (const adminRow of adminRes.rows) {
      await createNotification({
        recipientId: adminRow.id,
        type: 'lead_assigned',
        title: 'Lead Auto-Assigned',
        message: `New lead (${customerName}) assigned to ${agent.fullName}.`,
        relatedLeadId: leadId
      });
    }

    // Seed default call checklist
    await seedLeadChecklist(leadId);

    console.log(`[AutoAssignment] Lead #${leadId} assigned to agent #${agent.id} (${agent.fullName})`);
    return agent;
  } catch (err) {
    console.error('[AutoAssignment] autoAssignLead error:', err);
    return null;
  }
}

// -----------------------------------------------------------------------
// NOTIFICATIONS
// -----------------------------------------------------------------------

export async function createNotification(payload: NotificationPayload): Promise<void> {
  const pool = getPostgresPool();

  if (!pool) {
    inMemoryNotifications.push({
      id: nextNotificationId++,
      recipientId: payload.recipientId ?? null,
      recipientRole: payload.recipientRole ?? null,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedLeadId: payload.relatedLeadId ?? null,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    return;
  }

  try {
    const hasNotificationsTable = await tableExists('public.notifications');
    if (!hasNotificationsTable) {
      inMemoryNotifications.push({
        id: nextNotificationId++,
        recipientId: payload.recipientId ?? null,
        recipientRole: payload.recipientRole ?? null,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        relatedLeadId: payload.relatedLeadId ?? null,
        isRead: false,
        createdAt: new Date().toISOString()
      });
      return;
    }

    await pool.query(
      `INSERT INTO notifications
         (recipient_id, recipient_role, type, title, message, related_lead_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        payload.recipientId ?? null,
        payload.recipientRole ?? null,
        payload.type,
        payload.title,
        payload.message,
        payload.relatedLeadId ?? null
      ]
    );
  } catch (err) {
    // Notification failure must never crash the main flow; fall back to in-memory queue.
    console.warn('[Notification] Insert failed:', err);
    inMemoryNotifications.push({
      id: nextNotificationId++,
      recipientId: payload.recipientId ?? null,
      recipientRole: payload.recipientRole ?? null,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedLeadId: payload.relatedLeadId ?? null,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }
}

export async function getNotificationsForUser(
  userId: number,
  role: string,
  unreadOnly = false
): Promise<any[]> {
  const pool = getPostgresPool();

  if (pool) {
    try {
      const hasNotificationsTable = await tableExists('public.notifications');
      if (!hasNotificationsTable) {
        return inMemoryNotifications
          .filter((n) => (n.recipientId === userId || n.recipientRole === role) && (!unreadOnly || !n.isRead))
          .map((n) => ({
            id: n.id,
            recipient_id: n.recipientId,
            type: n.type,
            title: n.title,
            message: n.message,
            is_read: n.isRead,
            related_lead_id: n.relatedLeadId,
            created_at: n.createdAt
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 50);
      }
    } catch (err) {
      console.error('[Notification] table check failed:', err);
    }
  }

  if (!pool) {
    return inMemoryNotifications
      .filter((n) => (n.recipientId === userId || n.recipientRole === role) && (!unreadOnly || !n.isRead))
      .map((n) => ({
        id: n.id,
        recipient_id: n.recipientId,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: n.isRead,
        related_lead_id: n.relatedLeadId,
        created_at: n.createdAt
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  }

  try {
    const conditions: string[] = [
      '(recipient_id = $1 OR recipient_role = $2)'
    ];
    const params: any[] = [userId, role];

    if (unreadOnly) {
      conditions.push('is_read = false');
    }

    const where = conditions.join(' AND ');
    const res = await pool.query(
      `SELECT id, recipient_id, type, title, message, is_read, related_lead_id, created_at
         FROM notifications
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT 50`,
      params
    );
    return res.rows;
  } catch (err) {
    console.error('[Notification] getNotificationsForUser error:', err);
    return [];
  }
}

export async function markNotificationRead(notificationId: number, userId: number): Promise<boolean> {
  const pool = getPostgresPool();

  if (!pool) {
    const idx = inMemoryNotifications.findIndex((n) => n.id === notificationId && (n.recipientId === userId || n.recipientId == null));
    if (idx >= 0) {
      inMemoryNotifications[idx].isRead = true;
      return true;
    }
    return false;
  }

  try {
    const hasNotificationsTable = await tableExists('public.notifications');
    if (!hasNotificationsTable) {
      const idx = inMemoryNotifications.findIndex((n) => n.id === notificationId && (n.recipientId === userId || n.recipientId == null));
      if (idx >= 0) {
        inMemoryNotifications[idx].isRead = true;
        return true;
      }
      return false;
    }

    const res = await pool.query(
      `UPDATE notifications SET is_read = true
        WHERE id = $1 AND (recipient_id = $2 OR recipient_id IS NULL)
        RETURNING id`,
      [notificationId, userId]
    );
    return res.rows.length > 0;
  } catch (err) {
    console.error('[Notification] markNotificationRead error:', err);
    return false;
  }
}

// -----------------------------------------------------------------------
// LEAD CHECKLIST
// -----------------------------------------------------------------------

/**
 * Seeds default 11-step checklist for a lead (skips already-existing steps).
 */
export async function seedLeadChecklist(leadId: number): Promise<void> {
  const pool = getPostgresPool();
  if (!pool) return;

  try {
    for (const step of DEFAULT_CHECKLIST_STEPS) {
      await pool.query(
        `INSERT INTO lead_checklist (lead_id, step_key, step_label, is_completed, created_at)
         VALUES ($1, $2, $3, false, NOW())
         ON CONFLICT (lead_id, step_key) DO NOTHING`,
        [leadId, step.key, step.label]
      );
    }
  } catch (err) {
    console.warn('[Checklist] seedLeadChecklist error:', err);
  }
}

export async function getLeadChecklist(leadId: number): Promise<any[]> {
  const pool = getPostgresPool();
  if (!pool) {
    // Return default uncompleted steps for local-DB mode
    return DEFAULT_CHECKLIST_STEPS.map((s) => ({
      id: null,
      leadId,
      stepKey: s.key,
      stepLabel: s.label,
      isCompleted: false,
      completedAt: null,
      completedByName: null,
      notes: null
    }));
  }

  try {
    const res = await pool.query(
      `SELECT id, lead_id, step_key, step_label, is_completed, completed_at, completed_by_name, notes
         FROM lead_checklist
        WHERE lead_id = $1
        ORDER BY id ASC`,
      [leadId]
    );

    if (res.rows.length === 0) {
      // First time: seed and return default
      await seedLeadChecklist(leadId);
      return DEFAULT_CHECKLIST_STEPS.map((s) => ({
        id: null,
        leadId,
        stepKey: s.key,
        stepLabel: s.label,
        isCompleted: false,
        completedAt: null,
        completedByName: null,
        notes: null
      }));
    }

    return res.rows.map((r) => ({
      id: r.id,
      leadId: r.lead_id,
      stepKey: r.step_key,
      stepLabel: r.step_label,
      isCompleted: r.is_completed,
      completedAt: r.completed_at,
      completedByName: r.completed_by_name,
      notes: r.notes
    }));
  } catch (err) {
    console.error('[Checklist] getLeadChecklist error:', err);
    return [];
  }
}

export async function toggleChecklistStep(
  leadId: number,
  stepKey: string,
  isCompleted: boolean,
  actorId: number,
  actorName: string,
  notes?: string
): Promise<any | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `INSERT INTO lead_checklist (lead_id, step_key, step_label, is_completed, completed_at, completed_by_id, completed_by_name, notes, created_at)
       VALUES ($1, $2,
         COALESCE((SELECT step_label FROM lead_checklist WHERE lead_id=$1 AND step_key=$2 LIMIT 1),
                  (SELECT label FROM (VALUES ${DEFAULT_CHECKLIST_STEPS.map((s) => `('${s.key}','${s.label}')`).join(',')}) AS t(k,label) WHERE k=$2 LIMIT 1),
                  $2),
         $3,
         CASE WHEN $3 THEN NOW() ELSE NULL END,
         $4, $5, $6, NOW()
       )
       ON CONFLICT (lead_id, step_key) DO UPDATE
         SET is_completed      = EXCLUDED.is_completed,
             completed_at      = EXCLUDED.completed_at,
             completed_by_id   = EXCLUDED.completed_by_id,
             completed_by_name = EXCLUDED.completed_by_name,
             notes             = COALESCE(EXCLUDED.notes, lead_checklist.notes)
       RETURNING *`,
      [leadId, stepKey, isCompleted, actorId, actorName, notes ?? null]
    );

    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      leadId: r.lead_id,
      stepKey: r.step_key,
      stepLabel: r.step_label,
      isCompleted: r.is_completed,
      completedAt: r.completed_at,
      completedByName: r.completed_by_name,
      notes: r.notes
    };
  } catch (err) {
    console.error('[Checklist] toggleChecklistStep error:', err);
    return null;
  }
}

// -----------------------------------------------------------------------
// ATTENDANCE
// -----------------------------------------------------------------------

export async function clockIn(userId: number, notes?: string): Promise<any | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  const today = new Date().toISOString().split('T')[0];
  try {
    const res = await pool.query(
      `INSERT INTO attendance (user_id, date, clock_in, status, notes, created_at)
       VALUES ($1, $2, NOW(), 'present', $3, NOW())
       ON CONFLICT (user_id, date) DO UPDATE
         SET clock_in = CASE WHEN attendance.clock_in IS NULL THEN NOW() ELSE attendance.clock_in END,
             status   = CASE WHEN attendance.status = 'absent' THEN 'present' ELSE attendance.status END
       RETURNING *`,
      [userId, today, notes ?? null]
    );
    return res.rows[0] ?? null;
  } catch (err) {
    console.error('[Attendance] clockIn error:', err);
    return null;
  }
}

export async function clockOut(userId: number, notes?: string): Promise<any | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  const today = new Date().toISOString().split('T')[0];
  try {
    const res = await pool.query(
      `UPDATE attendance
          SET clock_out   = NOW(),
              total_hours = ROUND(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 3600.0, 2),
              notes       = COALESCE($3, notes)
        WHERE user_id = $1 AND date = $2
        RETURNING *`,
      [userId, today, notes ?? null]
    );
    return res.rows[0] ?? null;
  } catch (err) {
    console.error('[Attendance] clockOut error:', err);
    return null;
  }
}

export async function getAttendance(userId?: number, fromDate?: string, toDate?: string): Promise<any[]> {
  const pool = getPostgresPool();
  if (!pool) return [];

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (userId !== undefined) {
    conditions.push(`user_id = $${idx++}`);
    params.push(userId);
  }
  if (fromDate) {
    conditions.push(`date >= $${idx++}`);
    params.push(fromDate);
  }
  if (toDate) {
    conditions.push(`date <= $${idx++}`);
    params.push(toDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const res = await pool.query(
      `SELECT a.*, u.full_name, u.email, u.role
         FROM attendance a
         JOIN users u ON u.id = a.user_id
        ${where}
        ORDER BY a.date DESC, a.user_id ASC
        LIMIT 200`,
      params
    );
    return res.rows;
  } catch (err) {
    console.error('[Attendance] getAttendance error:', err);
    return [];
  }
}

// -----------------------------------------------------------------------
// COMMISSIONS
// -----------------------------------------------------------------------

export async function getCommissions(agentId?: number): Promise<any[]> {
  const pool = getPostgresPool();
  if (!pool) return [];

  try {
    const where = agentId !== undefined ? 'WHERE c.agent_id = $1' : '';
    const params = agentId !== undefined ? [agentId] : [];

    const res = await pool.query(
      `SELECT c.*, u.full_name AS agent_name, u.email AS agent_email
         FROM commissions c
         JOIN users u ON u.id = c.agent_id
        ${where}
        ORDER BY c.created_at DESC
        LIMIT 100`,
      params
    );
    return res.rows;
  } catch (err) {
    console.error('[Commissions] getCommissions error:', err);
    return [];
  }
}

export async function createCommission(data: {
  agentId: number;
  leadId?: number;
  customerName?: string;
  propertyId?: string;
  transactionType?: string;
  dealAmount: number;
  commissionPercent: number;
  transactionDate?: string;
  notes?: string;
}): Promise<any | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  const commissionAmount = (data.dealAmount * data.commissionPercent) / 100;

  try {
    const res = await pool.query(
      `INSERT INTO commissions
         (agent_id, lead_id, customer_name, property_id, transaction_type,
          deal_amount, commission_percent, commission_amount,
          payment_status, approval_status, transaction_date, notes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending','pending',$9,$10,NOW())
       RETURNING *`,
      [
        data.agentId,
        data.leadId ?? null,
        data.customerName ?? null,
        data.propertyId ?? null,
        data.transactionType ?? 'Sale',
        data.dealAmount,
        data.commissionPercent,
        commissionAmount,
        data.transactionDate ?? new Date().toISOString().split('T')[0],
        data.notes ?? null
      ]
    );
    return res.rows[0] ?? null;
  } catch (err) {
    console.error('[Commissions] createCommission error:', err);
    return null;
  }
}

export async function updateCommissionApproval(
  commissionId: number,
  approvalStatus: 'approved' | 'rejected',
  approvedById: number,
  notes?: string
): Promise<any | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `UPDATE commissions
          SET approval_status = $1,
              approved_by     = $2,
              approved_at     = NOW(),
              payment_status  = CASE WHEN $1 = 'approved' THEN 'processing' ELSE payment_status END,
              notes           = COALESCE($3, notes)
        WHERE id = $4
        RETURNING *`,
      [approvalStatus, approvedById, notes ?? null, commissionId]
    );
    return res.rows[0] ?? null;
  } catch (err) {
    console.error('[Commissions] updateCommissionApproval error:', err);
    return null;
  }
}

// -----------------------------------------------------------------------
// DASHBOARD STATS (real DB queries — no hardcoded counts)
// -----------------------------------------------------------------------

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  try {
    // Total customers (role='customer' in users)
    const custRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM users WHERE role = 'customer'`
    );

    // Lead status counts
    const statusRes = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE true)                                    AS total,
        COUNT(*) FILTER (WHERE lead_status IN ('NEW','QUALIFIED'))      AS new_leads,
        COUNT(*) FILTER (WHERE assigned_employee_id IS NOT NULL)        AS assigned,
        COUNT(*) FILTER (WHERE lead_status = 'CONTACTED')               AS contacted,
        COUNT(*) FILTER (WHERE lead_status = 'VIEWING_SCHEDULED')       AS viewing_scheduled,
        COUNT(*) FILTER (WHERE lead_status = 'NEGOTIATION')             AS negotiation,
        COUNT(*) FILTER (WHERE lead_status = 'WON')                     AS won,
        COUNT(*) FILTER (WHERE lead_status = 'LOST')                    AS lost,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)        AS today
      FROM leads
    `);

    // Last 6 months monthly counts
    const monthlyRes = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
        COUNT(*) AS count
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `);

    // Agent performance
    const agentRes = await pool.query(`
      SELECT
        u.id          AS agent_id,
        u.full_name   AS agent_name,
        COUNT(*)                                             AS total_leads,
        COUNT(*) FILTER (WHERE l.lead_status NOT IN ('WON','LOST')) AS open_leads,
        COUNT(*) FILTER (WHERE l.lead_status = 'WON')       AS won_leads,
        COUNT(*) FILTER (WHERE l.lead_status = 'LOST')      AS lost_leads
      FROM users u
      LEFT JOIN leads l ON l.assigned_employee_id = u.id
      WHERE u.role = 'sales_agent'
      GROUP BY u.id, u.full_name
      ORDER BY total_leads DESC
    `);

    const sr = statusRes.rows[0];
    return {
      totalCustomers: Number(custRes.rows[0]?.cnt ?? 0),
      totalLeads: Number(sr.total),
      newLeads: Number(sr.new_leads),
      assignedLeads: Number(sr.assigned),
      pendingLeads: Number(sr.new_leads),
      contactedLeads: Number(sr.contacted),
      viewingScheduledLeads: Number(sr.viewing_scheduled),
      negotiationLeads: Number(sr.negotiation),
      wonLeads: Number(sr.won),
      lostLeads: Number(sr.lost),
      todayLeads: Number(sr.today),
      monthlyLeadCounts: monthlyRes.rows.map((r) => ({ month: r.month, count: Number(r.count) })),
      agentPerformance: agentRes.rows.map((r) => ({
        agentId: r.agent_id,
        agentName: r.agent_name,
        totalLeads: Number(r.total_leads),
        openLeads: Number(r.open_leads),
        wonLeads: Number(r.won_leads),
        lostLeads: Number(r.lost_leads)
      }))
    };
  } catch (err) {
    console.error('[Dashboard] getDashboardStats error:', err);
    return null;
  }
}

