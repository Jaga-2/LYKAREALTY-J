import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuthenticatedUser } from './auth.js';
import { getPostgresPool, isPostgresConfigured, getDbStatus } from './postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.resolve(DATA_DIR, 'crm_db.json');

export interface PropertyRecord {
  id: string;
  title: string;
  tagline: string;
  location: string;
  address: string;
  type: string;
  priceAED: number;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  plotSqFt?: number;
  ceilingHeight: string;
  handover: string;
  viewType: string;
  status: string;
  image: string;
  gallery: string[];
  architect: string;
  yearBuilt: number;
  description: string;
  projectedYield: string;
  pricePerSqFtAED: number;
  amenities: string[];
  coordinates: { x: number; y: number };
}

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
  source: 'LYKA Editorial Web' | 'AI Assistant' | 'WhatsApp' | 'Instagram' | 'Facebook' | 'Property Portal' | 'Private Referral' | 'Walk-in' | 'Campaign';
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
  outcome: 'Connected' | 'No Answer' | 'Busy' | 'Callback Requested' | 'Not Interested' | 'Invalid Contact' | string;
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

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string; // SHA-256 for internal verification
  role: 'customer' | 'sales_agent' | 'admin' | 'super_admin';
  name: string;
  phone: string;
  title: string;
  avatar: string;
  assignedAgentId?: string;
}

export interface CRMDatabase {
  users: UserAccount[];
  staff: StaffMember[];
  properties: PropertyRecord[];
  leads: Lead[];
  activities: ActivityRecord[];
  viewings: ViewingAppointment[];
  transactions: DealTransaction[];
  auditLogs: AuditLogEntry[];
  complianceDocs: ComplianceDocument[];
  enquiries: CustomerEnquiry[];
}

export const INITIAL_PROPERTIES: PropertyRecord[] = [
  {
    id: 'res-palm-01',
    title: 'The Alba Oceanfront Sanctuary',
    tagline: 'Monumental waterfront pavilion with private yacht slipway & Dubai Marina skyline panorama',
    location: 'Palm Jumeirah',
    address: 'Bespoke Billionaires Row, Frond G, Palm Jumeirah, Dubai',
    type: 'Waterfront Villa',
    priceAED: 185000000,
    bedrooms: 6,
    bathrooms: 8,
    areaSqFt: 16800,
    plotSqFt: 21500,
    ceilingHeight: '4.8 meters',
    handover: 'Immediate / Ready',
    viewType: 'Arabian Gulf Open Ocean',
    status: 'Available',
    image: '/src/assets/images/palm_sky_mansion_1793286170250.jpg',
    gallery: [
      '/src/assets/images/palm_sky_mansion_1793286170250.jpg',
      '/src/assets/images/hero_dubai_residence_1793286170254.jpg',
      '/src/assets/images/downtown_penthouse_1793286171305.jpg'
    ],
    architect: 'SAOTA & Studio Liaigre Paris',
    yearBuilt: 2025,
    description: 'A structural triumph conceived by SAOTA, The Alba Oceanfront Sanctuary pairs cantilevered Greek travertine stone with ultra-clear floor-to-ceiling Schuco glazing. Features a private 40m white sand beach, temperature-controlled horizon pool with submerged glass viewing chambers, and private dock capable of mooring yachts up to 130 feet.',
    projectedYield: '7.8% Net Annualized',
    pricePerSqFtAED: 11012,
    amenities: [
      'Private 130ft Superyacht Berth',
      '40-Meter Heated Infinity Horizon Pool',
      'Subterranean 8-Car Climate Showroom',
      'Cryotherapy & Hammam Wellness Pavilion',
      'Private Sommelier Tasting Cellar (1,200 Bottles)',
      'Acoustically Tuned Dolby Atmos Screening Room'
    ],
    coordinates: { x: 38, y: 55 }
  },
  {
    id: 'res-downtown-02',
    title: 'The Burj Crown Sky Triplex',
    tagline: 'Double-height cathedral of glass with uninterrupted axial view of the Burj Khalifa',
    location: 'Downtown Dubai',
    address: 'Floors 68–70, Opera District Promenade, Downtown Dubai',
    type: 'Sky Penthouse',
    priceAED: 142000000,
    bedrooms: 5,
    bathrooms: 7,
    areaSqFt: 13400,
    ceilingHeight: '6.4 meters double-height',
    handover: 'Immediate / Ready',
    viewType: 'Burj Khalifa & Downtown Skyline',
    status: 'Penthouse Collection',
    image: '/src/assets/images/downtown_penthouse_1793286171305.jpg',
    gallery: [
      '/src/assets/images/downtown_penthouse_1793286171305.jpg',
      '/src/assets/images/hero_dubai_residence_1793286170254.jpg',
      '/src/assets/images/palm_sky_mansion_1793286170250.jpg'
    ],
    architect: 'Foster + Partners with Christian Liaigre',
    yearBuilt: 2026,
    description: 'Occupying the summit of the Opera District, this triplex penthouse commands an uninterrupted axial view across the Dubai Fountain and Burj Khalifa. Featuring Italian Calacatta marble staircases, private glass elevator connecting three levels, private rooftop cantilevered glass plunge pool, and dedicated butler quarters.',
    projectedYield: '8.4% Net Annualized',
    pricePerSqFtAED: 10597,
    amenities: [
      'Private High-Speed Direct Residence Elevator',
      'Rooftop Cantilevered Glass Swimming Pool',
      'Double-Height Grand Salon with Sculptural Fireplace',
      'Poliform Varenna Commercial Chef Kitchen',
      'Custom B&O Multi-Room Sound Architecture',
      'Valet Porte-Cochere with 4 Dedicated Garages'
    ],
    coordinates: { x: 62, y: 38 }
  },
  {
    id: 'res-jumeirah-bay-03',
    title: 'Coral Peninsula Waterfront Villa',
    tagline: 'Secluded sculptural Mediterranean pavilion on Dubai’s most exclusive private island enclave',
    location: 'Jumeirah Bay Island',
    address: 'Private Sea Gate, Jumeirah Bay Island (Bulgari Enclave), Dubai',
    type: 'Private Island Estate',
    priceAED: 235000000,
    bedrooms: 7,
    bathrooms: 9,
    areaSqFt: 18900,
    plotSqFt: 24800,
    ceilingHeight: '4.5 meters',
    handover: 'Q4 2026',
    viewType: 'Arabian Gulf Open Ocean',
    status: 'Off-Market Confidential',
    image: '/src/assets/images/jumeirah_bay_villa_1793286171289.jpg',
    gallery: [
      '/src/assets/images/jumeirah_bay_villa_1793286171289.jpg',
      '/src/assets/images/hero_dubai_residence_1793286170254.jpg',
      '/src/assets/images/palm_sky_mansion_1793286170250.jpg'
    ],
    architect: 'Antonio Citterio Patricia Viel',
    yearBuilt: 2026,
    description: 'Situated on the secluded outer ring of Jumeirah Bay Island, this trophy estate embodies discrete Mediterranean architecture rendered in Roman travertine and dark bronze louvers. Surrounded on three sides by the Arabian Gulf with private access to the Bulgari Marina and Yacht Club.',
    projectedYield: '7.2% Net Annualized',
    pricePerSqFtAED: 12433,
    amenities: [
      'Direct Private Beachfront Lagoon Access',
      'Bulgari Marina Berth Allocation Included',
      'Reflective Water Courtyard with 100-Year Olive Trees',
      'Subterranean Wellness Sanctuary & Vitality Pool',
      'Executive Security Suite & Vaulted Panic Sanctum',
      'Staff Quarters for 6 In-House Retinue'
    ],
    coordinates: { x: 50, y: 32 }
  },
  {
    id: 'res-emirates-hills-04',
    title: 'The Montgomerie Fairway Sanctuary',
    tagline: 'Expansive contemporary modernist estate overlooking the 18th championship green',
    location: 'Emirates Hills',
    address: 'Sector E, The Beverly Hills of Dubai, Emirates Hills',
    type: 'Architectural Mansion',
    priceAED: 165000000,
    bedrooms: 6,
    bathrooms: 8,
    areaSqFt: 17500,
    plotSqFt: 32000,
    ceilingHeight: '5.2 meters',
    handover: 'Immediate / Ready',
    viewType: 'Championship Golf Course',
    status: 'Available',
    image: '/src/assets/images/emirates_hills_estate_1793286171394.jpg',
    gallery: [
      '/src/assets/images/emirates_hills_estate_1793286171394.jpg',
      '/src/assets/images/hero_dubai_residence_1793286170254.jpg',
      '/src/assets/images/palm_sky_mansion_1793286170250.jpg'
    ],
    architect: 'Kokaistudios & Vladimir Djurovic Landscape',
    yearBuilt: 2025,
    description: 'Positioned on an expansive 32,000 sq.ft fairway plot, this architectural residence combines brutalist honed basalt and warm slatted teak. Features a 30-meter Olympic training lap pool, zen dry gardens, private putting green, and an entertaining pavilion designed for diplomatic hospitality.',
    projectedYield: '6.9% Net Annualized',
    pricePerSqFtAED: 9428,
    amenities: [
      'Direct Buggy Gate to Montgomerie Championship Course',
      '30-Meter Heated Olympic Lap Pool with LED Track',
      'Underground Collector Gallery (10 Vehicles)',
      'Commercial Teppanyaki Outdoor Kitchen',
      'Biophilic Indoor Tropical Garden with Skylight Atrium',
      'Private Tennis & Padel Sports Pavilion'
    ],
    coordinates: { x: 30, y: 68 }
  },
  {
    id: 'res-palm-frond-05',
    title: 'The Elysian Waterfront Pavilion',
    tagline: 'Pure architectural serenity with sunken conversation fire pit and private crescent beach',
    location: 'Palm Jumeirah',
    address: 'Frond N, The Palm Crescent, Dubai',
    type: 'Waterfront Villa',
    priceAED: 198000000,
    bedrooms: 6,
    bathrooms: 8,
    areaSqFt: 15400,
    plotSqFt: 19800,
    ceilingHeight: '4.6 meters',
    handover: 'Immediate / Ready',
    viewType: 'Arabian Gulf Open Ocean',
    status: 'Off-Market Confidential',
    image: '/src/assets/images/hero_dubai_residence_1793286170254.jpg',
    gallery: [
      '/src/assets/images/hero_dubai_residence_1793286170254.jpg',
      '/src/assets/images/palm_sky_mansion_1793286170250.jpg',
      '/src/assets/images/downtown_penthouse_1793286171305.jpg'
    ],
    architect: 'Marpillero Pollak & Studio Dror',
    yearBuilt: 2025,
    description: 'A monument to modern minimalism, The Elysian Pavilion features floating cantilevered concrete decks, recessed floor-to-ceiling glass systems by PanoramAH!, and an illuminated sunken fire-lounge submerged inside the perimeter reflecting pool.',
    projectedYield: '7.5% Net Annualized',
    pricePerSqFtAED: 12857,
    amenities: [
      'Private Crescent Sand Shoreline with Deep Water Moor',
      'Sunken Outdoor Fireplace Island in Pool',
      'Bespoke Rimadesio Glass Dressing Sanctuaries',
      'Dornbracht Platinum Finish Master Bath Suites',
      'Separate Gatehouse with Resident Security Protocol',
      'Geothermal Temperature Stabilization System'
    ],
    coordinates: { x: 42, y: 52 }
  },
  {
    id: 'res-difc-06',
    title: 'The Gate Executive Penthouse',
    tagline: 'Sovereign financial district residence with private art gallery & rooftop helipad access',
    location: 'DIFC',
    address: 'DIFC Gate Precinct Sky Residence 52, Dubai',
    type: 'Sky Penthouse',
    priceAED: 89000000,
    bedrooms: 4,
    bathrooms: 6,
    areaSqFt: 9800,
    ceilingHeight: '4.2 meters',
    handover: 'Immediate / Ready',
    viewType: 'Burj Khalifa & Downtown Skyline',
    status: 'Penthouse Collection',
    image: '/src/assets/images/downtown_penthouse_1793286171305.jpg',
    gallery: [
      '/src/assets/images/downtown_penthouse_1793286171305.jpg',
      '/src/assets/images/hero_dubai_residence_1793286170254.jpg'
    ],
    architect: 'Gensler & Matteo Nunziati',
    yearBuilt: 2024,
    description: 'Engineered for international family office principals, this full-floor sky residence commands sweeping 360-degree vistas across DIFC and the Dubai Frame. Built-in museum lighting, temperature and humidity stabilization for blue-chip art collections, and direct executive lift access.',
    projectedYield: '8.9% Net Annualized',
    pricePerSqFtAED: 9081,
    amenities: [
      'Museum-Grade Climate & Humidity Art Preservation',
      'Private Boardroom with Secure Encrypted AV Links',
      'Direct Private High-Speed Executive Elevator',
      'Sommelier Wine Wall for 800 Bottles',
      'Dedicated 24/7 Diplomatic Concierge & Chauffeur Staging',
      'Full-Floor Privacy with Biometric Access'
    ],
    coordinates: { x: 67, y: 35 }
  }
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'cust-vance-01',
    email: 'alexandra.vance@vanceholdings.ch',
    passwordHash: 'preset_demo_user',
    role: 'customer',
    name: 'Lady Alexandra Vance',
    phone: '+41 79 555 0192',
    title: 'Sovereign Family Office Principal',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedAgentId: 'agent-01'
  },
  {
    id: 'agent-01',
    email: 'rashid.alfalasi@lykarealty.ae',
    passwordHash: 'preset_demo_user',
    role: 'sales_agent',
    name: 'Rashid Al-Falasi',
    phone: '+971 50 842 9110',
    title: 'Senior Sovereign Advisor — Palm Jumeirah & Waterfront',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'agent-02',
    email: 'sophia.laurent@lykarealty.ae',
    passwordHash: 'preset_demo_user',
    role: 'sales_agent',
    name: 'Sophia Laurent',
    phone: '+971 54 319 8840',
    title: 'Private Office Partner — Jumeirah Bay & Waterfront',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'agent-03',
    email: 'tariq.mansoor@lykarealty.ae',
    passwordHash: 'preset_demo_user',
    role: 'sales_agent',
    name: 'Tariq Mansoor',
    phone: '+971 52 701 4452',
    title: 'Associate Director — Penthouse & Sky Collections',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'admin-01',
    email: 'elena.rostova@lykarealty.ae',
    passwordHash: 'preset_demo_user',
    role: 'admin',
    name: 'Elena Rostova',
    phone: '+971 4 812 9000',
    title: 'Head of Private Client Operations & Lead Allocation',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'superadmin-01',
    email: 'mansour.nahyan@lykarealty.ae',
    passwordHash: 'preset_demo_user',
    role: 'super_admin',
    name: 'Mansour Al-Nahyan',
    phone: '+971 4 800 0001',
    title: 'Managing Director & Principal Executive Partner',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  }
];

const INITIAL_DB: CRMDatabase = {
  users: INITIAL_USERS,
  properties: INITIAL_PROPERTIES,
  staff: [
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
  ],
  leads: [
    {
      id: 'lead-101',
      clientName: 'Lady Alexandra Vance',
      email: 'alexandra.vance@vanceholdings.ch',
      phone: '+41 79 555 0192',
      roleType: 'buyer',
      propertyInterestId: 'res-palm-01',
      propertyTitle: 'The Alba Oceanfront Sanctuary — Palm Jumeirah Sky Palace',
      requirements: {
        budgetMinAED: 180000000,
        budgetMaxAED: 350000000,
        enclaves: ['Palm Jumeirah', 'Jumeirah Bay Island'],
        propertyTypes: ['Architectural Mansion', 'Waterfront Villa'],
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
      propertyTitle: 'Coral Peninsula Waterfront Villa — Bulgari Enclave',
      requirements: {
        budgetMinAED: 150000000,
        budgetMaxAED: 250000000,
        enclaves: ['Jumeirah Bay Island'],
        propertyTypes: ['Waterfront Villa', 'Private Island Estate'],
        bedrooms: '5+',
        notes: 'Direct beach access, sunset orientation, ready or immediate handover.'
      },
      preferredCallbackTime: '10:00 – 12:00 GST',
      leadTemperature: 'hot',
      status: 'viewing_scheduled',
      assignedAgentId: 'agent-02',
      assignedAgentName: 'Sophia Laurent',
      source: 'AI Assistant',
      referralDetails: 'Captured through LYKA AI Sovereign Voice advisory session',
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
      propertyTitle: 'The Burj Crown Sky Triplex — Downtown Dubai',
      requirements: {
        budgetMinAED: 85000000,
        budgetMaxAED: 150000000,
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
      propertyTitle: 'The Burj Crown Sky Triplex',
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
      source: 'WhatsApp',
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
      propertyTitle: 'The Montgomerie Fairway Sanctuary — Emirates Hills',
      requirements: {
        budgetMinAED: 140000000,
        budgetMaxAED: 180000000,
        enclaves: ['Emirates Hills'],
        propertyTypes: ['Architectural Mansion'],
        bedrooms: '6',
        notes: 'Championship golf view preferred. 10+ car climate-controlled underground gallery.'
      },
      preferredCallbackTime: '15:00 – 17:00 GST',
      leadTemperature: 'cold',
      status: 'contacted',
      assignedAgentId: 'agent-02',
      assignedAgentName: 'Sophia Laurent',
      source: 'Campaign',
      referralDetails: 'Targeted Autumn Dubai Prime Wealth campaign',
      createdAt: '2026-10-15',
      lastContactedAt: '2026-10-20',
      nextFollowUpDate: '2026-10-25',
      isOverdue: true
    }
  ],
  activities: [
    {
      id: 'act-01',
      leadId: 'lead-101',
      agentId: 'agent-01',
      agentName: 'Rashid Al-Falasi',
      type: 'video_meeting',
      timestamp: '2026-10-29 15:30',
      durationMinutes: 45,
      outcome: 'Connected',
      notes: 'Reviewed revised SPA terms for The Alba Oceanfront Sanctuary. Client family office counsel approved the escrow milestone schedule. Scheduled private site walkthrough with the structural architect on Friday.',
      meetingLink: 'https://meet.google.com/lyka-private-sefirot',
      nextFollowUpScheduled: '2026-10-31 16:00'
    },
    {
      id: 'act-02',
      leadId: 'lead-101',
      agentId: 'agent-01',
      agentName: 'Rashid Al-Falasi',
      type: 'whatsapp',
      timestamp: '2026-10-28 11:15',
      outcome: 'Connected',
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
      outcome: 'Connected',
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
      outcome: 'Connected',
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
      outcome: 'Callback Requested',
      notes: 'Client requested callback once floor ceiling height specifications (6.4m double-height gallery) are verified.'
    }
  ],
  viewings: [
    {
      id: 'view-01',
      leadId: 'lead-101',
      propertyId: 'res-palm-01',
      propertyTitle: 'The Alba Oceanfront Sanctuary — Palm Jumeirah Sky Palace',
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
      propertyTitle: 'Coral Peninsula Waterfront Villa — Bulgari Enclave',
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
      propertyTitle: 'The Burj Crown Sky Triplex — Downtown Dubai',
      agentId: 'agent-01',
      agentName: 'Rashid Al-Falasi',
      clientName: 'Julian Sterling-Brandt',
      clientPhone: '+44 7700 900452',
      date: '2026-11-04',
      time: '14:30 GST',
      status: 'requested',
      notes: 'Client arriving on British Airways private charter; requested afternoon sunlight inspection.'
    }
  ],
  transactions: [
    {
      id: 'tx-2026-88',
      propertyId: 'res-palm-01',
      propertyTitle: 'The Alba Oceanfront Sanctuary',
      enclave: 'Palm Jumeirah',
      clientName: 'Vance Family Trust',
      agentId: 'agent-01',
      agentName: 'Rashid Al-Falasi',
      type: 'sale',
      transactionValueAED: 185000000,
      brokerageCommissionAED: 3700000,
      agentCommissionSplitAED: 1665000,
      commissionPaymentStatus: 'processing',
      deedNumber: 'DLD-DEED-2026-891024',
      escrowStatus: 'cleared',
      closeDate: '2026-10-15'
    },
    {
      id: 'tx-2026-79',
      propertyId: 'res-jumeirah-bay-03',
      propertyTitle: 'Coral Peninsula Waterfront Villa',
      enclave: 'Jumeirah Bay Island',
      clientName: 'Nordic Sovereign Holding Corp',
      agentId: 'agent-02',
      agentName: 'Sophia Laurent',
      type: 'sale',
      transactionValueAED: 235000000,
      brokerageCommissionAED: 4700000,
      agentCommissionSplitAED: 2350000,
      commissionPaymentStatus: 'paid',
      deedNumber: 'DLD-DEED-2026-774011',
      escrowStatus: 'cleared',
      closeDate: '2026-09-28'
    },
    {
      id: 'tx-2026-64',
      propertyId: 'res-emirates-hills-04',
      propertyTitle: 'The Montgomerie Fairway Sanctuary',
      enclave: 'Emirates Hills',
      clientName: 'Khurram Investment Group Ltd',
      agentId: 'agent-01',
      agentName: 'Rashid Al-Falasi',
      type: 'sale',
      transactionValueAED: 165000000,
      brokerageCommissionAED: 3300000,
      agentCommissionSplitAED: 1485000,
      commissionPaymentStatus: 'paid',
      deedNumber: 'DLD-DEED-2026-651289',
      escrowStatus: 'cleared',
      closeDate: '2026-08-14'
    },
    {
      id: 'tx-2026-51',
      propertyId: 'res-downtown-02',
      propertyTitle: 'The Burj Crown Sky Triplex',
      enclave: 'Downtown Dubai',
      clientName: 'Aurelia Tech Ventures LP',
      agentId: 'agent-03',
      agentName: 'Tariq Mansoor',
      type: 'rental',
      transactionValueAED: 3800000,
      brokerageCommissionAED: 190000,
      agentCommissionSplitAED: 76000,
      commissionPaymentStatus: 'pending',
      deedNumber: 'EJARI-2026-904123',
      escrowStatus: 'in_escrow',
      closeDate: '2026-10-02'
    }
  ],
  auditLogs: [
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
      target: 'AED 1,665,000 for Rashid Al-Falasi (Tx #tx-2026-88)',
      ipAddress: '86.98.11.233 (Dubai)',
      severity: 'info'
    },
    {
      id: 'audit-899',
      timestamp: '2026-10-29 14:10',
      actorName: 'Security Core',
      actorRole: 'System',
      action: 'Access Control Policy Validated',
      target: '4-Tier RBAC Authentication Gates Active',
      ipAddress: 'Internal Gateway',
      severity: 'security'
    }
  ],
  complianceDocs: [
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
      clientOrStaffName: 'The Alba Oceanfront Escrow',
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
  ],
  enquiries: [
    {
      id: 'enq-01',
      propertyId: 'res-palm-01',
      propertyTitle: 'The Alba Oceanfront Sanctuary — Palm Jumeirah Sky Palace',
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
      propertyTitle: 'Coral Peninsula Waterfront Villa — Bulgari Enclave',
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
  ]
};

// Ensure directory exists and load DB
function ensureDb(): CRMDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    // Merge any missing tables
    if (!parsed.properties) parsed.properties = INITIAL_PROPERTIES;
    if (!parsed.users) parsed.users = INITIAL_USERS;
    return parsed;
  } catch (err) {
    console.error('[DB] Failed reading CRM database, using fallback:', err);
    return INITIAL_DB;
  }
}

let dbInstance: CRMDatabase = ensureDb();

export function getDb(): CRMDatabase {
  return dbInstance;
}

export function saveDb(updated: CRMDatabase) {
  dbInstance = updated;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(dbInstance, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Error saving to disk:', err);
  }
}

// -------------------------------------------------------------
// USER ACCOUNTS & AUTH
// -------------------------------------------------------------

export function findUserByEmail(email: string): UserAccount | undefined {
  const db = getDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): UserAccount | undefined {
  const db = getDb();
  return db.users.find((u) => u.id === id);
}

export function registerCustomerUser(data: { name: string; email: string; phone: string }): UserAccount {
  const db = getDb();
  const existing = findUserByEmail(data.email);
  if (existing) {
    return existing;
  }

  const newCustUser: UserAccount = {
    id: `cust-${Date.now()}`,
    email: data.email,
    passwordHash: 'preset_demo_user',
    role: 'customer',
    name: data.name || 'Valued Sovereign Client',
    phone: data.phone || '+971 50 000 0000',
    title: 'Private Investor Member',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedAgentId: 'agent-01'
  };

  db.users.push(newCustUser);
  saveDb(db);
  return newCustUser;
}

// -------------------------------------------------------------
// PROPERTIES & CATALOGUE
// -------------------------------------------------------------

export function getAllProperties(): PropertyRecord[] {
  return getDb().properties;
}

export function getPropertyById(id: string): PropertyRecord | undefined {
  return getDb().properties.find((p) => p.id === id);
}

export function searchProperties(filters: {
  query?: string;
  location?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  status?: string;
  viewType?: string;
}): PropertyRecord[] {
  const all = getAllProperties();
  return all.filter((p) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matchText = `${p.title} ${p.location} ${p.type} ${p.description} ${p.address}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    if (filters.location && filters.location !== 'all') {
      if (p.location.toLowerCase() !== filters.location.toLowerCase()) return false;
    }
    if (filters.propertyType && filters.propertyType !== 'all') {
      if (p.type.toLowerCase() !== filters.propertyType.toLowerCase()) return false;
    }
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      if (p.priceAED < filters.minPrice) return false;
    }
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      if (p.priceAED > filters.maxPrice) return false;
    }
    if (filters.bedrooms && filters.bedrooms !== 'all') {
      const beds = parseInt(filters.bedrooms, 10);
      if (!isNaN(beds) && p.bedrooms < beds) return false;
    }
    if (filters.status && filters.status !== 'all') {
      if (p.status !== filters.status) return false;
    }
    if (filters.viewType && filters.viewType !== 'all') {
      if (p.viewType !== filters.viewType) return false;
    }
    return true;
  });
}

// AI Assistant Property Matcher with Reasons
export function findPropertiesForAssistant(userQuery: string): {
  property: PropertyRecord;
  matchScore: number;
  matchReason: string;
}[] {
  const q = userQuery.toLowerCase();
  const all = getAllProperties();
  const results: { property: PropertyRecord; matchScore: number; matchReason: string }[] = [];

  for (const p of all) {
    let score = 0;
    const reasons: string[] = [];

    // Location matching
    if (q.includes(p.location.toLowerCase())) {
      score += 40;
      reasons.push(`Direct match in prime enclave ${p.location}`);
    } else if (q.includes('palm') && p.location.includes('Palm')) {
      score += 35;
      reasons.push(`Palm Jumeirah waterfront location`);
    } else if (q.includes('downtown') && p.location.includes('Downtown')) {
      score += 35;
      reasons.push(`Downtown Dubai Burj Khalifa corridor`);
    } else if (q.includes('jumeirah bay') && p.location.includes('Jumeirah Bay')) {
      score += 35;
      reasons.push(`Jumeirah Bay Island ultra-exclusive enclave`);
    } else if (q.includes('emirates hills') && p.location.includes('Emirates Hills')) {
      score += 35;
      reasons.push(`Emirates Hills championship golf course fairway`);
    } else if (q.includes('difc') && p.location.includes('DIFC')) {
      score += 35;
      reasons.push(`DIFC financial district executive trophy residence`);
    }

    // Type matching
    if (q.includes('penthouse') && p.type.toLowerCase().includes('penthouse')) {
      score += 30;
      reasons.push(`Sky Penthouse with double-height panoramic vistas`);
    } else if (q.includes('villa') && p.type.toLowerCase().includes('villa')) {
      score += 30;
      reasons.push(`Waterfront architectural villa estate`);
    } else if (q.includes('mansion') && p.type.toLowerCase().includes('mansion')) {
      score += 30;
      reasons.push(`Private architectural mansion`);
    } else if (q.includes('island') && p.type.toLowerCase().includes('island')) {
      score += 30;
      reasons.push(`Private island waterfront residence`);
    }

    // Feature / amenity matching
    if ((q.includes('yacht') || q.includes('berth') || q.includes('mooring')) && p.amenities.some(a => a.toLowerCase().includes('berth') || a.toLowerCase().includes('moor'))) {
      score += 25;
      reasons.push(`Private superyacht mooring capability`);
    }
    if ((q.includes('pool') || q.includes('swim')) && p.amenities.some(a => a.toLowerCase().includes('pool'))) {
      score += 15;
      reasons.push(`Private infinity / Olympic-grade swimming pool`);
    }
    if (q.includes('golf') && p.viewType.toLowerCase().includes('golf')) {
      score += 25;
      reasons.push(`Uninterrupted championship golf course view`);
    }
    if (q.includes('burj') && p.viewType.toLowerCase().includes('burj')) {
      score += 25;
      reasons.push(`Direct Burj Khalifa and skyline views`);
    }
    if (q.includes('beach') && (p.amenities.some(a => a.toLowerCase().includes('beach')) || p.description.toLowerCase().includes('beach'))) {
      score += 20;
      reasons.push(`Private beachfront white sand access`);
    }

    // Price / Yield inquiries
    if (q.includes('yield') || q.includes('roi')) {
      score += 10;
      reasons.push(`Projected net annualized yield: ${p.projectedYield}`);
    }

    if (score > 0) {
      results.push({
        property: p,
        matchScore: score,
        matchReason: reasons.join(' · ')
      });
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, 3);
}

// -------------------------------------------------------------
// CRM LEADS (WITH AUTOMATIC DE-DUPLICATION)
// -------------------------------------------------------------

export function getLeads(agentId?: string): Lead[] {
  const db = getDb();
  if (agentId) {
    return db.leads.filter((l) => l.assignedAgentId === agentId);
  }
  return db.leads;
}

export function getLeadsForUser(user: AuthenticatedUser): Lead[] {
  if (user.role === 'admin' || user.role === 'super_admin') {
    return getLeads();
  }
  if (user.role === 'sales_agent') {
    return getLeads(user.id);
  }
  return []; // Customers do not have access to CRM leads
}

export function createLead(leadData: Omit<Lead, 'id' | 'createdAt'>): { lead: Lead; isDuplicate: boolean } {
  const db = getDb();
  const cleanEmail = (leadData.email || '').trim().toLowerCase();
  const cleanPhone = (leadData.phone || '').trim().replace(/\s+/g, '');

  // Intelligent De-Duplication Check
  const existingIndex = db.leads.findIndex((l) => {
    const lEmail = (l.email || '').trim().toLowerCase();
    const lPhone = (l.phone || '').trim().replace(/\s+/g, '');
    return (cleanEmail && lEmail === cleanEmail) || (cleanPhone && lPhone === cleanPhone);
  });

  const todayStr = new Date().toISOString().split('T')[0];

  if (existingIndex !== -1) {
    const existing = db.leads[existingIndex];
    // Update existing lead with latest touchpoint and interest
    const updatedNotes = `${existing.requirements.notes}\n[Update on ${todayStr} via ${leadData.source}]: ${leadData.requirements.notes || 'Repeat inquiry'}`;
    
    existing.lastContactedAt = todayStr;
    existing.requirements.notes = updatedNotes;
    if (leadData.propertyInterestId) {
      existing.propertyInterestId = leadData.propertyInterestId;
      existing.propertyTitle = leadData.propertyTitle || existing.propertyTitle;
    }
    // Re-escalate temperature if repeat interest shown
    existing.leadTemperature = 'hot';
    if (existing.status === 'lost') {
      existing.status = 'contacted';
    }

    // Record activity record for sales agent
    logActivity({
      leadId: existing.id,
      agentId: existing.assignedAgentId,
      agentName: existing.assignedAgentName,
      type: 'whatsapp',
      outcome: 'Connected',
      notes: `Repeat touchpoint from ${leadData.clientName} regarding ${leadData.propertyTitle || 'portfolio'} via ${leadData.source}.`,
      nextFollowUpScheduled: `${todayStr} 16:00`
    });

    saveDb(db);
    return { lead: existing, isDuplicate: true };
  }

  // Create brand new lead
  const newLead: Lead = {
    ...leadData,
    id: `lead-${Date.now()}`,
    createdAt: todayStr,
    lastContactedAt: todayStr
  };

  db.leads.unshift(newLead);

  // Create audit log
  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    actorName: leadData.source === 'AI Assistant' ? 'Sovereign AI Concierge' : 'System Intake',
    actorRole: 'Intake Automation',
    action: 'New Lead Inscription',
    target: `${newLead.clientName} (${newLead.roleType}) — Source: ${newLead.source}`,
    ipAddress: 'VPC Gateway',
    severity: 'info'
  });

  saveDb(db);
  return { lead: newLead, isDuplicate: false };
}

export function updateLead(id: string, updates: Partial<Lead>, actorName = 'Advisor'): Lead | null {
  const db = getDb();
  const index = db.leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  const prev = db.leads[index];
  const updated: Lead = { ...prev, ...updates };
  db.leads[index] = updated;

  // Add audit log if assigned agent changed or status changed
  if (updates.assignedAgentId && updates.assignedAgentId !== prev.assignedAgentId) {
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actorName,
      actorRole: 'Admin',
      action: 'Lead Reassigned',
      target: `Lead #${id} (${updated.clientName}) assigned to ${updated.assignedAgentName || updates.assignedAgentId}`,
      ipAddress: 'Internal Operations',
      severity: 'info'
    });
  }

  saveDb(db);
  return updated;
}

// -------------------------------------------------------------
// ACTIVITIES & CALLS
// -------------------------------------------------------------

export function getActivities(leadId?: string, agentId?: string): ActivityRecord[] {
  const db = getDb();
  let list = db.activities;
  if (leadId) list = list.filter((a) => a.leadId === leadId);
  if (agentId) list = list.filter((a) => a.agentId === agentId);
  return list;
}

export function logActivity(activity: Omit<ActivityRecord, 'id' | 'timestamp'>): ActivityRecord {
  const db = getDb();
  const newAct: ActivityRecord = {
    ...activity,
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };

  db.activities.unshift(newAct);

  // Update lead's last contacted at and next follow up date if provided
  const lead = db.leads.find((l) => l.id === activity.leadId);
  if (lead) {
    lead.lastContactedAt = new Date().toISOString().split('T')[0];
    if (activity.nextFollowUpScheduled) {
      lead.nextFollowUpDate = activity.nextFollowUpScheduled.split(' ')[0];
      lead.isOverdue = false;
    }
  }

  saveDb(db);
  return newAct;
}

// -------------------------------------------------------------
// VIEWING APPOINTMENTS
// -------------------------------------------------------------

export function getViewings(agentId?: string): ViewingAppointment[] {
  const db = getDb();
  if (agentId) return db.viewings.filter((v) => v.agentId === agentId);
  return db.viewings;
}

export function getViewingsForUser(user: AuthenticatedUser): ViewingAppointment[] {
  const db = getDb();
  if (user.role === 'customer') {
    return db.viewings.filter((v) => v.clientName.toLowerCase() === user.name.toLowerCase() || (user.phone && v.clientPhone === user.phone));
  }
  if (user.role === 'sales_agent') {
    return db.viewings.filter((v) => v.agentId === user.id);
  }
  return db.viewings;
}

export function createViewing(viewing: Omit<ViewingAppointment, 'id'>): ViewingAppointment {
  const db = getDb();
  const newViewing: ViewingAppointment = {
    ...viewing,
    id: `view-${Date.now()}`
  };
  db.viewings.unshift(newViewing);
  saveDb(db);
  return newViewing;
}

export function updateViewing(id: string, updates: Partial<ViewingAppointment>): ViewingAppointment | null {
  const db = getDb();
  const index = db.viewings.findIndex((v) => v.id === id);
  if (index === -1) return null;
  db.viewings[index] = { ...db.viewings[index], ...updates };
  saveDb(db);
  return db.viewings[index];
}

// -------------------------------------------------------------
// TRANSACTIONS & COMMISSIONS (EXECUTIVE ACCESS)
// -------------------------------------------------------------

export function getTransactions(): DealTransaction[] {
  return getDb().transactions;
}

export function getTransactionsForUser(user: AuthenticatedUser): DealTransaction[] {
  if (user.role === 'super_admin') {
    return getDb().transactions;
  }
  if (user.role === 'sales_agent') {
    // Sales agents can only see their own transactions
    return getDb().transactions.filter((t) => t.agentId === user.id);
  }
  return []; // Hidden from admin and customer
}

// -------------------------------------------------------------
// STAFF DIRECTORY (WITH SENSITIVE FIELD REDACTION)
// -------------------------------------------------------------

export function getStaff(): StaffMember[] {
  return getDb().staff;
}

export function getStaffForUser(user: AuthenticatedUser): StaffMember[] {
  const allStaff = getDb().staff;
  if (user.role === 'super_admin') {
    return allStaff;
  }
  // Redact baseSalaryAED and commissionRatePercent for non-super_admin users
  return allStaff.map((s) => ({
    ...s,
    baseSalaryAED: 0,
    commissionRatePercent: user.role === 'sales_agent' && user.id === s.id ? s.commissionRatePercent : 0
  }));
}

export function updateStaff(id: string, updates: Partial<StaffMember>): StaffMember | null {
  const db = getDb();
  const index = db.staff.findIndex((s) => s.id === id);
  if (index === -1) return null;
  db.staff[index] = { ...db.staff[index], ...updates };
  saveDb(db);
  return db.staff[index];
}

// -------------------------------------------------------------
// AUDIT LOGS & COMPLIANCE
// -------------------------------------------------------------

export function getAuditLogs(): AuditLogEntry[] {
  return getDb().auditLogs;
}

export function getComplianceDocs(): ComplianceDocument[] {
  return getDb().complianceDocs;
}

// -------------------------------------------------------------
// CUSTOMER ENQUIRIES
// -------------------------------------------------------------

export function getEnquiries(email?: string): CustomerEnquiry[] {
  const db = getDb();
  if (email) return db.enquiries.filter((e) => e.email.toLowerCase() === email.toLowerCase());
  return db.enquiries;
}

export function getEnquiriesForUser(user: AuthenticatedUser): CustomerEnquiry[] {
  if (user.role === 'customer') {
    return getEnquiries(user.email);
  }
  return getDb().enquiries;
}

export function createEnquiry(enquiry: Omit<CustomerEnquiry, 'id' | 'date'>): CustomerEnquiry {
  const db = getDb();
  const newEnquiry: CustomerEnquiry = {
    ...enquiry,
    id: `enq-${Date.now()}`,
    date: new Date().toISOString().split('T')[0]
  };
  db.enquiries.unshift(newEnquiry);

  // Automatically create or update CRM lead from this enquiry
  createLead({
    clientName: enquiry.customerName,
    email: enquiry.email,
    phone: enquiry.phone,
    roleType: 'buyer',
    propertyInterestId: enquiry.propertyId,
    propertyTitle: enquiry.propertyTitle,
    requirements: {
      budgetMinAED: 100000000,
      budgetMaxAED: 250000000,
      enclaves: [enquiry.propertyTitle ? enquiry.propertyTitle.split('—')[0].trim() : 'Dubai Prime'],
      propertyTypes: ['Trophy Residence'],
      bedrooms: '5+',
      notes: `${enquiry.advisoryScope}: ${enquiry.message}`
    },
    preferredCallbackTime: enquiry.preferredCallbackTime || 'Afternoon GST',
    leadTemperature: 'hot',
    status: 'new',
    assignedAgentId: 'agent-01',
    assignedAgentName: 'Rashid Al-Falasi',
    source: 'LYKA Editorial Web',
    referralDetails: `Direct customer inquiry for ${enquiry.propertyTitle}`,
    lastContactedAt: new Date().toISOString().split('T')[0],
    nextFollowUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    isOverdue: false
  });

  saveDb(db);
  return newEnquiry;
}
