-- =============================================================
-- LYKA REALTY — PRODUCTION POSTGRESQL RELATIONAL SCHEMA
-- =============================================================
-- High-concurrency enterprise schema for Dubai Sovereign Real Estate
-- Compatible with PostgreSQL 14+, Neon, Supabase, AWS RDS, Render PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('customer', 'sales_agent', 'admin', 'super_admin')),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64),
  title VARCHAR(255),
  avatar TEXT,
  assigned_agent_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(64) NOT NULL,
  nationality VARCHAR(128) DEFAULT 'International',
  investor_tier VARCHAR(128) DEFAULT 'Sovereign / Family Office',
  mandate_enclaves TEXT[] DEFAULT ARRAY['Palm Jumeirah', 'Jumeirah Bay Island'],
  kyc_status VARCHAR(64) DEFAULT 'Pending Review',
  preferred_contact VARCHAR(128) DEFAULT 'WhatsApp Encrypted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(64) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('sales_agent', 'admin', 'super_admin')),
  title VARCHAR(255) NOT NULL,
  avatar TEXT,
  base_salary_aed NUMERIC(12, 2) DEFAULT 0,
  commission_rate_percent NUMERIC(5, 2) DEFAULT 0,
  active_deals_count INT DEFAULT 0,
  deals_closed_ytd INT DEFAULT 0,
  total_volume_aed NUMERIC(16, 2) DEFAULT 0,
  status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'probation')),
  assigned_leads_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  tagline TEXT,
  location VARCHAR(128) NOT NULL,
  address TEXT NOT NULL,
  type VARCHAR(128) NOT NULL,
  price_aed NUMERIC(16, 2) NOT NULL,
  bedrooms INT NOT NULL,
  bathrooms INT NOT NULL,
  area_sqft INT NOT NULL,
  plot_sqft INT,
  ceiling_height VARCHAR(64),
  handover VARCHAR(128) NOT NULL,
  view_type VARCHAR(128) NOT NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'Available',
  image TEXT NOT NULL,
  gallery TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  architect VARCHAR(255),
  year_built INT,
  description TEXT,
  projected_yield VARCHAR(64),
  price_per_sqft_aed NUMERIC(10, 2),
  amenities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  coordinates_x NUMERIC(5, 2),
  coordinates_y NUMERIC(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(64) PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  role_type VARCHAR(32) NOT NULL DEFAULT 'buyer' CHECK (role_type IN ('buyer', 'seller', 'tenant', 'landlord')),
  property_interest_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
  property_title VARCHAR(255),
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferred_callback_time VARCHAR(128) DEFAULT 'Afternoon GST',
  lead_temperature VARCHAR(16) NOT NULL DEFAULT 'warm' CHECK (lead_temperature IN ('hot', 'warm', 'cold')),
  status VARCHAR(32) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'viewing_scheduled', 'negotiation', 'under_contract', 'won', 'lost')),
  assigned_agent_id VARCHAR(64) REFERENCES staff(id) ON DELETE SET NULL,
  assigned_agent_name VARCHAR(255),
  source VARCHAR(64) NOT NULL DEFAULT 'LYKA Editorial Web',
  referral_details TEXT,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  last_contacted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  next_follow_up_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_overdue BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(64) PRIMARY KEY,
  lead_id VARCHAR(64) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id VARCHAR(64) NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  agent_name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('call', 'whatsapp', 'video_meeting', 'viewing_note')),
  timestamp VARCHAR(32) NOT NULL,
  duration_minutes INT,
  outcome VARCHAR(128) NOT NULL,
  notes TEXT NOT NULL,
  meeting_link TEXT,
  next_follow_up_scheduled VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS viewings (
  id VARCHAR(64) PRIMARY KEY,
  lead_id VARCHAR(64) REFERENCES leads(id) ON DELETE SET NULL,
  property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
  property_title VARCHAR(255) NOT NULL,
  agent_id VARCHAR(64) REFERENCES staff(id) ON DELETE SET NULL,
  agent_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(64) NOT NULL,
  date VARCHAR(32) NOT NULL,
  time VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
  property_title VARCHAR(255) NOT NULL,
  enclave VARCHAR(128) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  agent_id VARCHAR(64) REFERENCES staff(id) ON DELETE SET NULL,
  agent_name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('sale', 'purchase', 'rental')),
  transaction_value_aed NUMERIC(16, 2) NOT NULL,
  brokerage_commission_aed NUMERIC(14, 2) NOT NULL,
  agent_commission_split_aed NUMERIC(14, 2) NOT NULL,
  commission_payment_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (commission_payment_status IN ('paid', 'processing', 'pending')),
  deed_number VARCHAR(128) NOT NULL,
  escrow_status VARCHAR(64) NOT NULL DEFAULT 'in_escrow' CHECK (escrow_status IN ('cleared', 'in_escrow', 'pending_verification')),
  close_date VARCHAR(32) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp VARCHAR(32) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(64) NOT NULL,
  action VARCHAR(255) NOT NULL,
  target TEXT NOT NULL,
  ip_address VARCHAR(128) NOT NULL,
  severity VARCHAR(32) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'security'))
);

CREATE TABLE IF NOT EXISTS compliance_docs (
  id VARCHAR(64) PRIMARY KEY,
  client_or_staff_name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  document_type VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('verified', 'pending_review', 'flagged')),
  submitted_date VARCHAR(32) NOT NULL,
  reference_no VARCHAR(128) NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS enquiries (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
  property_title VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  preferred_callback_time VARCHAR(128),
  budget_tier VARCHAR(128),
  advisory_scope VARCHAR(255),
  message TEXT,
  date VARCHAR(32) NOT NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'Received'
);

-- =============================================================
-- PERFORMANCE INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_followup ON leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_agent ON activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_viewings_agent ON viewings(agent_id);
CREATE INDEX IF NOT EXISTS idx_viewings_lead ON viewings(lead_id);
CREATE INDEX IF NOT EXISTS idx_transactions_agent ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(email);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_aed);
