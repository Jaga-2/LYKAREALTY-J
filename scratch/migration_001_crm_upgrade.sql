-- =============================================================================
-- LYKA REALTY – CRM UPGRADE MIGRATION 001
-- Additive-only: all statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- Safe to run against production PostgreSQL multiple times without data loss
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. LEAD CHECKLIST (persistent per-lead sales workflow steps)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_checklist (
  id                 SERIAL PRIMARY KEY,
  lead_id            INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  step_key           VARCHAR(64)  NOT NULL,
  step_label         VARCHAR(255) NOT NULL,
  is_completed       BOOLEAN DEFAULT FALSE,
  completed_at       TIMESTAMP WITH TIME ZONE,
  completed_by_id    INTEGER REFERENCES users(id),
  completed_by_name  VARCHAR(255),
  notes              TEXT,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (lead_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_lead_checklist_lead_id ON lead_checklist(lead_id);

-- -----------------------------------------------------------------------
-- 2. ATTENDANCE (daily clock-in/out per staff member)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  clock_in     TIMESTAMP WITH TIME ZONE,
  clock_out    TIMESTAMP WITH TIME ZONE,
  total_hours  NUMERIC(5,2),
  status       VARCHAR(32) DEFAULT 'present'
                 CHECK (status IN ('present','absent','late','half_day','leave')),
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date    ON attendance(date);

-- -----------------------------------------------------------------------
-- 3. COMMISSIONS (deal-level commissions per agent)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commissions (
  id                   SERIAL PRIMARY KEY,
  agent_id             INTEGER NOT NULL REFERENCES users(id),
  lead_id              INTEGER REFERENCES leads(id),
  transaction_id       VARCHAR(64),
  customer_name        VARCHAR(255),
  property_id          VARCHAR(64),
  transaction_type     VARCHAR(32),
  deal_amount          NUMERIC(16,2),
  commission_percent   NUMERIC(5,2),
  commission_amount    NUMERIC(14,2),
  payment_status       VARCHAR(32) DEFAULT 'pending'
                         CHECK (payment_status IN ('pending','processing','paid')),
  approval_status      VARCHAR(32) DEFAULT 'pending'
                         CHECK (approval_status IN ('pending','approved','rejected')),
  transaction_date     DATE,
  approved_by          INTEGER REFERENCES users(id),
  approved_at          TIMESTAMP WITH TIME ZONE,
  notes                TEXT,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_agent_id ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_lead_id  ON commissions(lead_id);

-- -----------------------------------------------------------------------
-- 4. NOTIFICATIONS (in-app notification persistence)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id               SERIAL PRIMARY KEY,
  recipient_id     INTEGER REFERENCES users(id),
  recipient_role   VARCHAR(32),
  type             VARCHAR(64)  NOT NULL,
  title            VARCHAR(255) NOT NULL,
  message          TEXT,
  is_read          BOOLEAN DEFAULT FALSE,
  related_lead_id  INTEGER REFERENCES leads(id),
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read      ON notifications(is_read);

-- -----------------------------------------------------------------------
-- 5. EXTRA COLUMNS ON leads (additive, IF NOT EXISTS)
-- -----------------------------------------------------------------------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS previous_agent_id  INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assignment_notes   TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_at        TIMESTAMP WITH TIME ZONE;

-- -----------------------------------------------------------------------
-- 6. INDEXES on leads for dashboard queries
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_assigned_employee_id ON leads(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_status          ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at           ON leads(created_at);

