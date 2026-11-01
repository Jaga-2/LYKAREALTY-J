// [MOCK SERVICE LAYER - PREPARED FOR FASTAPI ENDPOINTS]
// This module provides realistic, high-fidelity mock data for LYKA Realty's 4 roles:
// Customer, Sales Agent, Admin, and Super Admin.
// When the FastAPI backend is operational, these in-memory stores will connect to:
// - GET/POST /api/v1/auth/*
// - GET/POST /api/v1/crm/leads/*
// - GET/POST /api/v1/crm/activities/*
// - GET/POST /api/v1/crm/viewings/*
// - GET/POST /api/v1/crm/transactions/*
// - GET/POST /api/v1/admin/staff/*
// - GET/POST /api/v1/compliance/*
// - GET/POST /api/v1/audit-logs/*

export interface Lead {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  roleType: 'buyer' | 'seller' | 'tenant' | 'landlord';
  propertyInterestId?: string;
  propertyTitle?: string;
  requirements: {
    budgetMinAED: number;
    budgetMaxAED: number;
    enclaves: string[];
    propertyTypes: string[];
    bedrooms: string;
    notes: string;
  };
  preferredCallbackTime: string;
  leadTemperature: 'hot' | 'warm' | 'cold';
  status: 'new' | 'contacted' | 'viewing_scheduled' | 'negotiation' | 'under_contract' | 'won' | 'lost';
  assignedAgentId: string;
  assignedAgentName: string;
  source: 'LYKA Editorial Web' | 'Private Referral' | 'Sovereign Concierge' | 'WhatsApp Direct' | 'Private Banking Partner';
  referralDetails?: string;
  createdAt: string;
  lastContactedAt: string;
  nextFollowUpDate: string;
  isOverdue?: boolean;
}

export interface ActivityRecord {
  id: string;
  leadId: string;
  agentId: string;
  agentName: string;
  type: 'call' | 'whatsapp' | 'video_meeting' | 'viewing_note';
  timestamp: string;
  durationMinutes?: number;
  outcome: string;
  notes: string;
  meetingLink?: string;
  nextFollowUpScheduled?: string;
}

export interface ViewingAppointment {
  id: string;
  leadId: string;
  propertyId: string;
  propertyTitle: string;
  agentId: string;
  agentName: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface DealTransaction {
  id: string;
  propertyId: string;
  propertyTitle: string;
  enclave: string;
  clientName: string;
  agentId: string;
  agentName: string;
  type: 'sale' | 'purchase' | 'rental';
  transactionValueAED: number;
  brokerageCommissionAED: number;
  agentCommissionSplitAED: number;
  commissionPaymentStatus: 'paid' | 'processing' | 'pending';
  deedNumber: string;
  escrowStatus: 'cleared' | 'in_escrow' | 'pending_verification';
  closeDate: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'sales_agent' | 'admin' | 'super_admin';
  title: string;
  avatar: string;
  baseSalaryAED: number;
  commissionRatePercent: number;
  activeDealsCount: number;
  dealsClosedYTD: number;
  totalVolumeAED: number;
  status: 'active' | 'on_leave' | 'probation';
  assignedLeadsCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'security';
}

export interface ComplianceDocument {
  id: string;
  clientOrStaffName: string;
  category: 'UHNW Client KYC' | 'Agent Licensing' | 'Escrow & Title Deed';
  documentType: 'Passport / Emirates ID' | 'Proof of Sovereign Funds' | 'Title Deed / Oqood' | 'AML Clearance' | 'RERA Certified Broker Card';
  status: 'verified' | 'pending_review' | 'flagged';
  submittedDate: string;
  referenceNo: string;
  notes: string;
}

export interface CustomerEnquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  customerName: string;
  email: string;
  phone: string;
  preferredCallbackTime: string;
  budgetTier: string;
  advisoryScope: string;
  message: string;
  date: string;
  status: 'Received' | 'Agent Assigned' | 'Viewing Scheduled' | 'Offer in Review' | 'Closed';
}

// -------------------------------------------------------------
// SEED MOCK DATA
// -------------------------------------------------------------

export const MOCK_STAFF: StaffMember[] = [
  {
    id: 'agent-01',
    name: 'Rashid Al-Falasi',
    email: 'rashid.alfalasi@lykarealty.ae',
    phone: '+971 50 842 9110',
    role: 'sales_agent',
    title: 'Senior Sovereign Advisor — Palm & Emirates Hills',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    baseSalaryAED: 35000,
    commissionRatePercent: 45,
    activeDealsCount: 6,
    dealsClosedYTD: 14,
    totalVolumeAED: 485000000,
    status: 'active',
    assignedLeadsCount: 8
  },
  {
    id: 'agent-02',
    name: 'Sophia Laurent',
    email: 'sophia.laurent@lykarealty.ae',
    phone: '+971 54 319 8840',
    role: 'sales_agent',
    title: 'Private Office Partner — Jumeirah Bay & Waterfront',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    baseSalaryAED: 38000,
    commissionRatePercent: 50,
    activeDealsCount: 5,
    dealsClosedYTD: 18,
    totalVolumeAED: 620000000,
    status: 'active',
    assignedLeadsCount: 7
  },
  {
    id: 'agent-03',
    name: 'Tariq Mansoor',
    email: 'tariq.mansoor@lykarealty.ae',
    phone: '+971 52 701 4452',
    role: 'sales_agent',
    title: 'Associate Director — Penthouse & Sky Collections',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    baseSalaryAED: 28000,
    commissionRatePercent: 40,
    activeDealsCount: 4,
    dealsClosedYTD: 9,
    totalVolumeAED: 310000000,
    status: 'active',
    assignedLeadsCount: 5
  },
  {
    id: 'admin-01',
    name: 'Elena Rostova',
    email: 'elena.rostova@lykarealty.ae',
    phone: '+971 4 812 9000',
    role: 'admin',
    title: 'Head of Private Client Operations & Lead Governance',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    baseSalaryAED: 48000,
    commissionRatePercent: 0,
    activeDealsCount: 0,
    dealsClosedYTD: 0,
    totalVolumeAED: 0,
    status: 'active',
    assignedLeadsCount: 0
  },
  {
    id: 'superadmin-01',
    name: 'Mansour Al-Nahyan',
    email: 'mansour.nahyan@lykarealty.ae',
    phone: '+971 4 800 0001',
    role: 'super_admin',
    title: 'Managing Director & Principal Executive Partner',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    baseSalaryAED: 95000,
    commissionRatePercent: 0,
    activeDealsCount: 0,
    dealsClosedYTD: 41,
    totalVolumeAED: 1415000000,
    status: 'active',
    assignedLeadsCount: 0
  }
];

export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-101',
    clientName: 'Lady Alexandra Vance',
    email: 'alexandra.vance@vanceholdings.ch',
    phone: '+41 79 555 0192',
    roleType: 'buyer',
    propertyInterestId: 'res-palm-01',
    propertyTitle: 'The Sefirot Crown — Palm Jumeirah Sky Palace',
    requirements: {
      budgetMinAED: 200000000,
      budgetMaxAED: 350000000,
      enclaves: ['Palm Jumeirah', 'Jumeirah Bay Island'],
      propertyTypes: ['Architectural Mansion', 'Private Island Estate'],
      bedrooms: '6+',
      notes: 'Requires superyacht mooring (min 45m), private helicopter helipad proximity, private security detail wing.'
    },
    preferredCallbackTime: '14:00 – 16:00 GST (Geneva Morning)',
    leadTemperature: 'hot',
    status: 'negotiation',
    assignedAgentId: 'agent-01',
    assignedAgentName: 'Rashid Al-Falasi',
    source: 'Private Referral',
    referralDetails: 'Referred by Mirabaud Family Office, Zurich',
    createdAt: '2026-10-18',
    lastContactedAt: '2026-10-29',
    nextFollowUpDate: '2026-10-31',
    isOverdue: false
  },
  {
    id: 'lead-102',
    clientName: 'Sheikh Tariq Al-Maktoum Family Office',
    email: 'investments@almaktoumoffice.ae',
    phone: '+971 50 112 3499',
    roleType: 'buyer',
    propertyInterestId: 'res-jumeirah-bay-03',
    propertyTitle: 'Amalthea Sea Villa — Bulgari Enclave',
    requirements: {
      budgetMinAED: 150000000,
      budgetMaxAED: 220000000,
      enclaves: ['Jumeirah Bay Island'],
      propertyTypes: ['Waterfront Villa'],
      bedrooms: '5+',
      notes: 'Direct beach access, sunset orientation, ready or immediate handover.'
    },
    preferredCallbackTime: '10:00 – 12:00 GST',
    leadTemperature: 'hot',
    status: 'viewing_scheduled',
    assignedAgentId: 'agent-02',
    assignedAgentName: 'Sophia Laurent',
    source: 'Sovereign Concierge',
    referralDetails: 'DIFC Private Client Desk',
    createdAt: '2026-10-22',
    lastContactedAt: '2026-10-28',
    nextFollowUpDate: '2026-10-29',
    isOverdue: true
  },
  {
    id: 'lead-103',
    clientName: 'Julian Sterling-Brandt',
    email: 'j.sterling@sterlingcap.co.uk',
    phone: '+44 7700 900452',
    roleType: 'buyer',
    propertyInterestId: 'res-downtown-02',
    propertyTitle: 'The Horizon Apex Triplex — Downtown Dubai',
    requirements: {
      budgetMinAED: 85000000,
      budgetMaxAED: 130000000,
      enclaves: ['Downtown Dubai', 'DIFC'],
      propertyTypes: ['Sky Penthouse'],
      bedrooms: '4–5',
      notes: 'Burj Khalifa full facade views, triple-height gallery space for modern art collection.'
    },
    preferredCallbackTime: '16:00 – 18:00 GST (London Noon)',
    leadTemperature: 'warm',
    status: 'contacted',
    assignedAgentId: 'agent-01',
    assignedAgentName: 'Rashid Al-Falasi',
    source: 'LYKA Editorial Web',
    referralDetails: 'Submitted Private Monograph Enquiry on Downtown Penthouse',
    createdAt: '2026-10-24',
    lastContactedAt: '2026-10-26',
    nextFollowUpDate: '2026-10-30',
    isOverdue: false
  },
  {
    id: 'lead-104',
    clientName: 'Baroness Vivienne De Montfort',
    email: 'secretariat@demontfort.mc',
    phone: '+377 93 10 20 30',
    roleType: 'seller',
    propertyTitle: 'Emirates Hills Sector E Sovereign Estate',
    requirements: {
      budgetMinAED: 160000000,
      budgetMaxAED: 190000000,
      enclaves: ['Emirates Hills'],
      propertyTypes: ['Architectural Mansion'],
      bedrooms: '7',
      notes: 'Confidential off-market disposal. Requires NDA signed before any dossier disclosure.'
    },
    preferredCallbackTime: '11:00 – 13:00 GST',
    leadTemperature: 'hot',
    status: 'under_contract',
    assignedAgentId: 'agent-01',
    assignedAgentName: 'Rashid Al-Falasi',
    source: 'Private Referral',
    referralDetails: 'Monaco Private Wealth Forum',
    createdAt: '2026-09-14',
    lastContactedAt: '2026-10-29',
    nextFollowUpDate: '2026-11-02',
    isOverdue: false
  },
  {
    id: 'lead-105',
    clientName: 'Marcus Wei-Chen',
    email: 'marcus.chen@apex-singapore.sg',
    phone: '+65 9123 4567',
    roleType: 'tenant',
    propertyInterestId: 'res-downtown-02',
    propertyTitle: 'The Horizon Apex Triplex',
    requirements: {
      budgetMinAED: 2500000,
      budgetMaxAED: 4000000,
      enclaves: ['Downtown Dubai', 'Palm Jumeirah'],
      propertyTypes: ['Sky Penthouse', 'Waterfront Villa'],
      bedrooms: '4+',
      notes: 'Annual lease with option to purchase. Diplomatic grade security.'
    },
    preferredCallbackTime: '08:00 – 10:00 GST (Singapore Afternoon)',
    leadTemperature: 'warm',
    status: 'new',
    assignedAgentId: 'agent-03',
    assignedAgentName: 'Tariq Mansoor',
    source: 'WhatsApp Direct',
    referralDetails: 'Direct inquiry via LYKA Private Concierge WhatsApp',
    createdAt: '2026-10-29',
    lastContactedAt: '2026-10-29',
    nextFollowUpDate: '2026-10-30',
    isOverdue: false
  },
  {
    id: 'lead-106',
    clientName: 'Dmitri & Anna Kozlov',
    email: 'dmitri@nordiccapital.fi',
    phone: '+358 40 1234567',
    roleType: 'buyer',
    propertyInterestId: 'res-emirates-hills-04',
    propertyTitle: 'Palazzo Del Sole — Emirates Hills Estate',
    requirements: {
      budgetMinAED: 140000000,
      budgetMaxAED: 180000000,
      enclaves: ['Emirates Hills', 'Dubai Hills Estate'],
      propertyTypes: ['Architectural Mansion'],
      bedrooms: '6',
      notes: 'Championship golf view preferred. 10+ car climate-controlled underground gallery.'
    },
    preferredCallbackTime: '15:00 – 17:00 GST',
    leadTemperature: 'cold',
    status: 'contacted',
    assignedAgentId: 'agent-02',
    assignedAgentName: 'Sophia Laurent',
    source: 'LYKA Editorial Web',
    referralDetails: 'Inquiry via Web Monograph',
    createdAt: '2026-10-15',
    lastContactedAt: '2026-10-20',
    nextFollowUpDate: '2026-10-25',
    isOverdue: true
  }
];

export const MOCK_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'act-01',
    leadId: 'lead-101',
    agentId: 'agent-01',
    agentName: 'Rashid Al-Falasi',
    type: 'video_meeting',
    timestamp: '2026-10-29 15:30',
    durationMinutes: 45,
    outcome: 'Offer Terms Clarification',
    notes: 'Reviewed revised SPA terms for The Sefirot Crown. Client family office counsel approved the escrow milestone schedule. Scheduled private site walkthrough with the structural architect on Friday.',
    meetingLink: 'https://meet.google.com/lyka-private-sefirot'
  },
  {
    id: 'act-02',
    leadId: 'lead-101',
    agentId: 'agent-01',
    agentName: 'Rashid Al-Falasi',
    type: 'whatsapp',
    timestamp: '2026-10-28 11:15',
    outcome: 'Dossier Dispatched',
    notes: 'Sent encrypted PDF dossier of yacht mooring bathymetry chart and private jetty specifications via WhatsApp.'
  },
  {
    id: 'act-03',
    leadId: 'lead-101',
    agentId: 'agent-01',
    agentName: 'Rashid Al-Falasi',
    type: 'call',
    timestamp: '2026-10-26 14:00',
    durationMinutes: 22,
    outcome: 'Initial Discovery Completed',
    notes: 'Discussed Golden Visa sovereign protocol and offshore entity registration with client representative.'
  },
  {
    id: 'act-04',
    leadId: 'lead-102',
    agentId: 'agent-02',
    agentName: 'Sophia Laurent',
    type: 'call',
    timestamp: '2026-10-28 10:45',
    durationMinutes: 18,
    outcome: 'Viewing Date Confirmed',
    notes: 'Confirmed private twilight viewing on Jumeirah Bay Island with principal advisor.'
  },
  {
    id: 'act-05',
    leadId: 'lead-103',
    agentId: 'agent-01',
    agentName: 'Rashid Al-Falasi',
    type: 'call',
    timestamp: '2026-10-26 16:30',
    durationMinutes: 30,
    outcome: 'Art Collection Dimension Review',
    notes: 'Sent floor ceiling height specifications (6.8m double-height gallery) to London curator.'
  }
];

export const MOCK_VIEWINGS: ViewingAppointment[] = [
  {
    id: 'view-01',
    leadId: 'lead-101',
    propertyId: 'res-palm-01',
    propertyTitle: 'The Sefirot Crown — Palm Jumeirah Sky Palace',
    agentId: 'agent-01',
    agentName: 'Rashid Al-Falasi',
    clientName: 'Lady Alexandra Vance',
    clientPhone: '+41 79 555 0192',
    date: '2026-10-31',
    time: '16:00 GST',
    status: 'confirmed',
    notes: 'Rolls-Royce chauffeur transfer arranged from Mandarin Oriental Jumeirah. Architect on site.'
  },
  {
    id: 'view-02',
    leadId: 'lead-102',
    propertyId: 'res-jumeirah-bay-03',
    propertyTitle: 'Amalthea Sea Villa — Bulgari Enclave',
    agentId: 'agent-02',
    agentName: 'Sophia Laurent',
    clientName: 'Sheikh Tariq Al-Maktoum Family Office',
    clientPhone: '+971 50 112 3499',
    date: '2026-11-01',
    time: '18:00 GST',
    status: 'confirmed',
    notes: 'Sunset viewing with private security protocol and waterside access inspection.'
  },
  {
    id: 'view-03',
    leadId: 'lead-103',
    propertyId: 'res-downtown-02',
    propertyTitle: 'The Horizon Apex Triplex — Downtown Dubai',
    agentId: 'agent-01',
    agentName: 'Rashid Al-Falasi',
    clientName: 'Julian Sterling-Brandt',
    clientPhone: '+44 7700 900452',
    date: '2026-11-04',
    time: '14:30 GST',
    status: 'requested',
    notes: 'Client arriving on British Airways private charter; requested afternoon sunlight inspection.'
  }
];

export const MOCK_TRANSACTIONS: DealTransaction[] = [
  {
    id: 'tx-2026-88',
    propertyId: 'res-palm-01',
    propertyTitle: 'The Sefirot Crown — Palm Jumeirah Sky Palace',
    enclave: 'Palm Jumeirah',
    clientName: 'Vance Family Trust',
    agentId: 'agent-01',
    agentName: 'Rashid Al-Falasi',
    type: 'sale',
    transactionValueAED: 245000000,
    brokerageCommissionAED: 4900000, // 2%
    agentCommissionSplitAED: 2205000, // 45% of commission
    commissionPaymentStatus: 'processing',
    deedNumber: 'DLD-DEED-2026-891024',
    escrowStatus: 'cleared',
    closeDate: '2026-10-15'
  },
  {
    id: 'tx-2026-79',
    propertyId: 'res-jumeirah-bay-03',
    propertyTitle: 'Amalthea Sea Villa — Bulgari Enclave',
    enclave: 'Jumeirah Bay Island',
    clientName: 'Nordic Sovereign Holding Corp',
    agentId: 'agent-02',
    agentName: 'Sophia Laurent',
    type: 'sale',
    transactionValueAED: 185000000,
    brokerageCommissionAED: 3700000,
    agentCommissionSplitAED: 1850000, // 50%
    commissionPaymentStatus: 'paid',
    deedNumber: 'DLD-DEED-2026-774011',
    escrowStatus: 'cleared',
    closeDate: '2026-09-28'
  },
  {
    id: 'tx-2026-64',
    propertyId: 'res-emirates-hills-04',
    propertyTitle: 'Palazzo Del Sole — Emirates Hills Estate',
    enclave: 'Emirates Hills',
    clientName: 'Khurram Investment Group Ltd',
    agentId: 'agent-01',
    agentName: 'Rashid Al-Falasi',
    type: 'sale',
    transactionValueAED: 160000000,
    brokerageCommissionAED: 3200000,
    agentCommissionSplitAED: 1440000,
    commissionPaymentStatus: 'paid',
    deedNumber: 'DLD-DEED-2026-651289',
    escrowStatus: 'cleared',
    closeDate: '2026-08-14'
  },
  {
    id: 'tx-2026-51',
    propertyId: 'res-downtown-02',
    propertyTitle: 'The Horizon Apex Triplex — Penthouse',
    enclave: 'Downtown Dubai',
    clientName: 'Aurelia Tech Ventures LP',
    agentId: 'agent-03',
    agentName: 'Tariq Mansoor',
    type: 'rental',
    transactionValueAED: 3800000,
    brokerageCommissionAED: 190000, // 5%
    agentCommissionSplitAED: 76000,
    commissionPaymentStatus: 'pending',
    deedNumber: 'EJARI-2026-904123',
    escrowStatus: 'in_escrow',
    closeDate: '2026-10-02'
  }
];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-901',
    timestamp: '2026-10-30 06:45',
    actorName: 'Elena Rostova',
    actorRole: 'Admin',
    action: 'Lead Reassigned',
    target: 'Lead #lead-105 assigned to Tariq Mansoor',
    ipAddress: '194.170.82.14 (Dubai DIFC)',
    severity: 'info'
  },
  {
    id: 'audit-900',
    timestamp: '2026-10-29 18:20',
    actorName: 'Mansour Al-Nahyan',
    actorRole: 'Super Admin',
    action: 'Commission Split Approved',
    target: 'AED 2,205,000 for Rashid Al-Falasi (Tx #tx-2026-88)',
    ipAddress: '86.98.11.233 (Dubai)',
    severity: 'info'
  },
  {
    id: 'audit-899',
    timestamp: '2026-10-29 14:10',
    actorName: 'System Security Watch',
    actorRole: 'System',
    action: 'Two-Factor Authentication Enforced',
    target: 'All Admin & Super Admin sessions validated',
    ipAddress: 'Internal VPC',
    severity: 'security'
  },
  {
    id: 'audit-898',
    timestamp: '2026-10-28 09:30',
    actorName: 'Elena Rostova',
    actorRole: 'Admin',
    action: 'KYC Document Verified',
    target: 'Passport & AML Clearance for Lady Alexandra Vance',
    ipAddress: '194.170.82.14 (Dubai DIFC)',
    severity: 'info'
  },
  {
    id: 'audit-897',
    timestamp: '2026-10-27 22:15',
    actorName: 'Security Perimeter',
    actorRole: 'System',
    action: 'Unrecognized IP Geolocation Access Attempt',
    target: 'Blocked 3 failed attempts from unrecognized ASN (Bucharest)',
    ipAddress: '185.220.101.4',
    severity: 'warning'
  }
];

export const MOCK_COMPLIANCE_DOCS: ComplianceDocument[] = [
  {
    id: 'doc-01',
    clientOrStaffName: 'Lady Alexandra Vance',
    category: 'UHNW Client KYC',
    documentType: 'Passport / Emirates ID',
    status: 'verified',
    submittedDate: '2026-10-19',
    referenceNo: 'CH-P-88492019',
    notes: 'Swiss diplomatic passport verified by DIFC compliance desk.'
  },
  {
    id: 'doc-02',
    clientOrStaffName: 'Lady Alexandra Vance',
    category: 'UHNW Client KYC',
    documentType: 'Proof of Sovereign Funds',
    status: 'verified',
    submittedDate: '2026-10-20',
    referenceNo: 'MIR-POF-2026-091',
    notes: 'Mirabaud Zurich certified liquidity confirmation exceeding CHF 100M.'
  },
  {
    id: 'doc-03',
    clientOrStaffName: 'Julian Sterling-Brandt',
    category: 'UHNW Client KYC',
    documentType: 'AML Clearance',
    status: 'pending_review',
    submittedDate: '2026-10-25',
    referenceNo: 'AML-UK-2026-449',
    notes: 'Awaiting updated UK Companies House ultimate beneficial ownership extract.'
  },
  {
    id: 'doc-04',
    clientOrStaffName: 'The Sefirot Crown Escrow',
    category: 'Escrow & Title Deed',
    documentType: 'Title Deed / Oqood',
    status: 'verified',
    submittedDate: '2026-10-12',
    referenceNo: 'DLD-OQ-991283',
    notes: 'Dubai Land Department pre-registration certificate active and clean of liens.'
  },
  {
    id: 'doc-05',
    clientOrStaffName: 'Rashid Al-Falasi',
    category: 'Agent Licensing',
    documentType: 'RERA Certified Broker Card',
    status: 'verified',
    submittedDate: '2026-01-10',
    referenceNo: 'RERA-BRN-39104',
    notes: 'Valid through Dec 31, 2026. Prime luxury specialization accredited.'
  }
];

export const MOCK_CUSTOMER_ENQUIRIES: CustomerEnquiry[] = [
  {
    id: 'enq-01',
    propertyId: 'res-palm-01',
    propertyTitle: 'The Sefirot Crown — Palm Jumeirah Sky Palace',
    customerName: 'Lady Alexandra Vance',
    email: 'alexandra.vance@vanceholdings.ch',
    phone: '+41 79 555 0192',
    preferredCallbackTime: '14:00 – 16:00 GST',
    budgetTier: 'AED 200M – 350M',
    advisoryScope: 'Private Off-Market Acquisition Mandate',
    message: 'Requesting private architectural tour and confidential title dossier.',
    date: '2026-10-18',
    status: 'Offer in Review'
  },
  {
    id: 'enq-02',
    propertyId: 'res-jumeirah-bay-03',
    propertyTitle: 'Amalthea Sea Villa — Bulgari Enclave',
    customerName: 'Lady Alexandra Vance',
    email: 'alexandra.vance@vanceholdings.ch',
    phone: '+41 79 555 0192',
    preferredCallbackTime: '14:00 – 16:00 GST',
    budgetTier: 'AED 150M – 200M',
    advisoryScope: 'Waterfront Portfolio Diversification',
    message: 'Comparison inquiry regarding private beach mooring depth and yacht access.',
    date: '2026-10-23',
    status: 'Agent Assigned'
  }
];
