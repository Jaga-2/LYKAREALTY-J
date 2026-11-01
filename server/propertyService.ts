// LYKA REALTY — SAFE PROPERTY DATABASE ADAPTER & SEARCH SERVICE
// Connects to PostgreSQL (73,727 records) with strictly parameterized queries.
// Zero DDL / Zero data mutations. Read-only access for search & AI grounding.

import { Pool } from 'pg';
import { getPostgresPool, isPostgresConfigured } from './postgres.js';

export interface PropertyRecord {
  id: string;
  title: string;
  tagline: string;
  location: string;
  city: string;
  address: string;
  type: string;
  purpose: 'For Rent' | 'For Sale' | string;
  rentPrice?: number;
  salePrice?: number;
  priceAED: number;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  rentPerSqFt?: number;
  furnishing?: string;
  handover: string;
  viewType: string;
  status: string;
  image: string;
  gallery: string[];
  architect?: string;
  yearBuilt?: number;
  description: string;
  projectedYield: string;
  pricePerSqFtAED: number;
  amenities: string[];
  coordinates: { x: number; y: number };
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface PropertySearchFilters {
  query?: string;
  city?: string;
  location?: string;
  propertyType?: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  minPrice?: number;
  maxPrice?: number;
  purpose?: string; // 'For Rent' | 'For Sale' | 'buy' | 'rent' | 'all'
  furnishing?: string;
  isActive?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'area-desc' | 'newest';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  properties: PropertyRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Curated luxury architectural photograph fallbacks matching property types
const ARCHITECTURAL_IMAGE_FALLBACKS: Record<string, string[]> = {
  villa: [
    '/src/assets/images/palm_sky_mansion_1793286170250.jpg',
    '/src/assets/images/jumeirah_bay_villa_1793286171289.jpg',
    '/src/assets/images/emirates_hills_estate_1793286171394.jpg'
  ],
  apartment: [
    '/src/assets/images/downtown_penthouse_1793286171305.jpg',
    '/src/assets/images/hero_dubai_residence_1793286170254.jpg',
    '/src/assets/images/virtual_tour_3d_render_1793287878016.jpg'
  ],
  penthouse: [
    '/src/assets/images/downtown_penthouse_1793286171305.jpg',
    '/src/assets/images/palm_sky_mansion_1793286170250.jpg'
  ],
  townhouse: [
    '/src/assets/images/emirates_hills_estate_1793286171394.jpg',
    '/src/assets/images/hero_dubai_residence_1793286170254.jpg'
  ],
  default: [
    '/src/assets/images/hero_dubai_residence_1793286170254.jpg',
    '/src/assets/images/palm_sky_mansion_1793286170250.jpg',
    '/src/assets/images/downtown_penthouse_1793286171305.jpg'
  ]
};

function getCuratedFallbackImages(propertyType: string, id: number | string): { primary: string; gallery: string[] } {
  const normType = (propertyType || '').toLowerCase();
  let pool = ARCHITECTURAL_IMAGE_FALLBACKS.default;
  if (normType.includes('villa')) pool = ARCHITECTURAL_IMAGE_FALLBACKS.villa;
  else if (normType.includes('penthouse')) pool = ARCHITECTURAL_IMAGE_FALLBACKS.penthouse;
  else if (normType.includes('apartment')) pool = ARCHITECTURAL_IMAGE_FALLBACKS.apartment;
  else if (normType.includes('townhouse')) pool = ARCHITECTURAL_IMAGE_FALLBACKS.townhouse;

  const numId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10) || 0;
  const idx = Math.abs(numId) % pool.length;
  return {
    primary: pool[idx],
    gallery: pool
  };
}

// Convert coordinates to percentage for interactive UI map view
function convertCoordsToPercentage(lat?: number, lng?: number): { x: number; y: number } {
  if (!lat || !lng) {
    return { x: 50, y: 50 };
  }
  // Dubai bounding box approx: lat 24.8 to 25.35, lng 54.9 to 55.5
  const x = Math.max(5, Math.min(95, ((lng - 54.95) / (55.45 - 54.95)) * 100));
  const y = Math.max(5, Math.min(95, ((25.35 - lat) / (25.35 - 24.85)) * 100));
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10
  };
}

// Map PostgreSQL row to LYKA PropertyRecord
export function mapDatabaseRowToProperty(row: any): PropertyRecord {
  let parsedImages: string[] = [];
  try {
    if (typeof row.images === 'string') {
      const trimmed = row.images.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        parsedImages = JSON.parse(trimmed);
      } else if (trimmed) {
        parsedImages = [trimmed];
      }
    } else if (Array.isArray(row.images)) {
      parsedImages = row.images;
    }
  } catch {
    parsedImages = [];
  }

  let parsedAmenities: string[] = [];
  try {
    if (typeof row.amenities === 'string') {
      const trimmed = row.amenities.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        parsedAmenities = JSON.parse(trimmed);
      } else if (trimmed) {
        parsedAmenities = trimmed.split(',').map((s: string) => s.trim());
      }
    } else if (Array.isArray(row.amenities)) {
      parsedAmenities = row.amenities;
    }
  } catch {
    parsedAmenities = [];
  }

  const fallbacks = getCuratedFallbackImages(row.property_type, row.id);
  const primaryImage = parsedImages.length > 0 ? parsedImages[0] : fallbacks.primary;
  const gallery = parsedImages.length > 0 ? parsedImages : fallbacks.gallery;

  const rentPrice = row.rent_price !== null && row.rent_price !== undefined ? Number(row.rent_price) : undefined;
  const salePrice = row.sale_price !== null && row.sale_price !== undefined ? Number(row.sale_price) : undefined;
  const priceAED = rentPrice !== undefined ? rentPrice : (salePrice !== undefined ? salePrice : 0);
  const purpose = row.purpose || (rentPrice ? 'For Rent' : 'For Sale');

  const beds = row.beds !== null && row.beds !== undefined ? Number(row.beds) : 0;
  const baths = row.baths !== null && row.baths !== undefined ? Number(row.baths) : 0;
  const areaSqFt = row.area_sqft !== null && row.area_sqft !== undefined ? Number(row.area_sqft) : 0;
  const pricePerSqFt = areaSqFt > 0 && priceAED > 0 ? Math.round(priceAED / areaSqFt) : 0;

  const location = row.location || 'Dubai';
  const city = row.city || 'Dubai';
  const propType = row.property_type || 'Residence';
  const title = row.title || `${beds > 0 ? beds + ' BHK ' : ''}${propType} in ${location}`;
  const address = row.address || `${location}, ${city}`;

  return {
    id: String(row.id),
    title,
    tagline: `${propType} · ${location} · ${purpose}`,
    location,
    city,
    address,
    type: propType,
    purpose,
    rentPrice,
    salePrice,
    priceAED,
    bedrooms: beds,
    bathrooms: baths,
    areaSqFt,
    rentPerSqFt: row.rent_per_sqft ? Number(row.rent_per_sqft) : undefined,
    furnishing: row.furnishing || 'Unfurnished',
    handover: row.age_days ? 'Immediate / Ready' : 'Handover on Request',
    viewType: location.toLowerCase().includes('marina')
      ? 'Dubai Marina & Yacht Harbor'
      : location.toLowerCase().includes('palm')
      ? 'Arabian Gulf Open Ocean'
      : location.toLowerCase().includes('downtown')
      ? 'Burj Khalifa & Downtown Skyline'
      : 'Panoramic City View',
    status: row.is_active ? 'Available' : 'Reserved',
    image: primaryImage,
    gallery,
    architect: 'Dubai Master Architectural Portfolio',
    yearBuilt: 2024,
    description: `${title}. Situated in ${location}, ${address}. Features ${beds} bedrooms, ${baths} bathrooms, spanning ${areaSqFt.toLocaleString()} sq.ft. Available ${purpose}.`,
    projectedYield: row.investment_yield ? `${row.investment_yield}% Net` : '7.8% Net Annualized',
    pricePerSqFtAED: pricePerSqFt,
    amenities: parsedAmenities.length > 0 ? parsedAmenities : ['Central Air Conditioning', 'Covered Parking', '24/7 Concierge Security', 'Built-in Wardrobes'],
    coordinates: convertCoordsToPercentage(row.latitude, row.longitude),
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    isActive: Boolean(row.is_active)
  };
}

// -------------------------------------------------------------
// POSTGRESQL PARAMETERIZED SEARCH QUERY ENGINE
// -------------------------------------------------------------

export async function searchPropertiesFromDb(filters: PropertySearchFilters): Promise<SearchResult> {
  const pool = getPostgresPool();
  if (!pool) {
    throw new Error('Database pool is not available.');
  }

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  // Active status
  if (filters.isActive !== undefined) {
    conditions.push(`is_active = $${paramIdx++}`);
    params.push(filters.isActive);
  } else {
    conditions.push(`is_active = true`);
  }

  // Free text search
  if (filters.query && filters.query.trim()) {
    const q = `%${filters.query.trim()}%`;
    conditions.push(`(title ILIKE $${paramIdx} OR location ILIKE $${paramIdx} OR address ILIKE $${paramIdx} OR property_type ILIKE $${paramIdx} OR city ILIKE $${paramIdx})`);
    params.push(q);
    paramIdx++;
  }

  // City
  if (filters.city && filters.city !== 'all') {
    conditions.push(`city ILIKE $${paramIdx++}`);
    params.push(`%${filters.city.trim()}%`);
  }

  // Community / Location
  if (filters.location && filters.location !== 'all') {
    conditions.push(`location ILIKE $${paramIdx++}`);
    params.push(`%${filters.location.trim()}%`);
  }

  // Property Type
  if (filters.propertyType && filters.propertyType !== 'all') {
    conditions.push(`property_type ILIKE $${paramIdx++}`);
    params.push(`%${filters.propertyType.trim()}%`);
  }

  // Purpose (Buy vs Rent)
  if (filters.purpose && filters.purpose !== 'all') {
    const norm = filters.purpose.toLowerCase();
    if (norm === 'buy' || norm === 'sale' || norm === 'for sale') {
      conditions.push(`purpose ILIKE $${paramIdx++}`);
      params.push('%Sale%');
    } else if (norm === 'rent' || norm === 'lease' || norm === 'for rent') {
      conditions.push(`purpose ILIKE $${paramIdx++}`);
      params.push('%Rent%');
    } else {
      conditions.push(`purpose ILIKE $${paramIdx++}`);
      params.push(`%${filters.purpose.trim()}%`);
    }
  }

  // Bedrooms / BHK
  if (filters.bedrooms !== undefined && filters.bedrooms !== 'all' && filters.bedrooms !== '') {
    const b = parseInt(String(filters.bedrooms), 10);
    if (!isNaN(b)) {
      if (String(filters.bedrooms).includes('+') || b >= 5) {
        conditions.push(`beds >= $${paramIdx++}`);
        params.push(b);
      } else {
        conditions.push(`beds = $${paramIdx++}`);
        params.push(b);
      }
    }
  }

  // Bathrooms
  if (filters.bathrooms !== undefined && filters.bathrooms !== 'all' && filters.bathrooms !== '') {
    const baths = parseInt(String(filters.bathrooms), 10);
    if (!isNaN(baths)) {
      conditions.push(`baths >= $${paramIdx++}`);
      params.push(baths);
    }
  }

  // Price Range
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    conditions.push(`COALESCE(rent_price, sale_price, 0) >= $${paramIdx++}`);
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    conditions.push(`COALESCE(rent_price, sale_price, 0) <= $${paramIdx++}`);
    params.push(filters.maxPrice);
  }

  // Furnishing
  if (filters.furnishing && filters.furnishing !== 'all') {
    conditions.push(`furnishing ILIKE $${paramIdx++}`);
    params.push(`%${filters.furnishing.trim()}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sorting
  let orderByClause = 'ORDER BY id DESC';
  if (filters.sortBy === 'price-asc') {
    orderByClause = 'ORDER BY COALESCE(rent_price, sale_price, 0) ASC';
  } else if (filters.sortBy === 'price-desc') {
    orderByClause = 'ORDER BY COALESCE(rent_price, sale_price, 0) DESC';
  } else if (filters.sortBy === 'area-desc') {
    orderByClause = 'ORDER BY area_sqft DESC NULLS LAST';
  } else if (filters.sortBy === 'newest') {
    orderByClause = 'ORDER BY id DESC';
  }

  // Pagination
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 24));
  const offset = (page - 1) * limit;

  // 1. Total count query
  const countSql = `SELECT count(*)::bigint AS total FROM properties ${whereClause};`;
  const countRes = await pool.query(countSql, params);
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  // 2. Data query
  const dataSql = `
    SELECT 
      id, title, address, location, city, rent_price, sale_price, currency,
      beds, baths, property_type, area_sqft, rent_per_sqft, rent_category,
      frequency, furnishing, purpose, latitude, longitude, amenities,
      images, posted_date, age_days, investment_yield, is_active
    FROM properties
    ${whereClause}
    ${orderByClause}
    LIMIT $${paramIdx++} OFFSET $${paramIdx++};
  `;
  const dataParams = [...params, limit, offset];
  const dataRes = await pool.query(dataSql, dataParams);

  const properties = dataRes.rows.map(mapDatabaseRowToProperty);

  return {
    properties,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getPropertyByIdFromDb(id: string | number): Promise<PropertyRecord | null> {
  const pool = getPostgresPool();
  if (!pool) return null;

  const numId = parseInt(String(id), 10);
  if (isNaN(numId)) return null;

  const sql = `
    SELECT 
      id, title, address, location, city, rent_price, sale_price, currency,
      beds, baths, property_type, area_sqft, rent_per_sqft, rent_category,
      frequency, furnishing, purpose, latitude, longitude, amenities,
      images, posted_date, age_days, investment_yield, is_active
    FROM properties
    WHERE id = $1
    LIMIT 1;
  `;
  const res = await pool.query(sql, [numId]);
  if (res.rows.length === 0) return null;

  return mapDatabaseRowToProperty(res.rows[0]);
}

// -------------------------------------------------------------
// AI ASSISTANT NATURAL LANGUAGE PARAMETER EXTRACTOR & MATCHER
// -------------------------------------------------------------

export interface AssistantExtractedIntent {
  location?: string;
  bedrooms?: number;
  propertyType?: string;
  maxBudget?: number;
  minBudget?: number;
  purpose?: string;
}

export function extractPreferencesFromText(text: string): AssistantExtractedIntent {
  const lower = text.toLowerCase();
  const intent: AssistantExtractedIntent = {};

  // Location detection
  const popularLocations = [
    'dubai marina', 'palm jumeirah', 'downtown dubai', 'jumeirah bay',
    'emirates hills', 'business bay', 'jbr', 'jumeirah beach residence',
    'jumeirah lake towers', 'jlt', 'al barsha', 'deira', 'bur dubai',
    'al ain', 'abu dhabi', 'sharjah', 'ajman', 'mirdif', 'al quoz'
  ];
  for (const loc of popularLocations) {
    if (lower.includes(loc)) {
      intent.location = loc;
      break;
    }
  }

  // Bedroom detection
  const bedMatches = [
    { pattern: /(?:^|\D)(1|one)\s*(?:bed|bedroom|bhk)/i, beds: 1 },
    { pattern: /(?:^|\D)(2|two)\s*(?:bed|bedroom|bhk)/i, beds: 2 },
    { pattern: /(?:^|\D)(3|three)\s*(?:bed|bedroom|bhk)/i, beds: 3 },
    { pattern: /(?:^|\D)(4|four)\s*(?:bed|bedroom|bhk)/i, beds: 4 },
    { pattern: /(?:^|\D)(5|five)\s*(?:bed|bedroom|bhk)/i, beds: 5 },
    { pattern: /studio/i, beds: 0 }
  ];
  for (const bm of bedMatches) {
    if (bm.pattern.test(lower)) {
      intent.bedrooms = bm.beds;
      break;
    }
  }

  // Property type detection
  if (lower.includes('penthouse')) intent.propertyType = 'Penthouse';
  else if (lower.includes('villa')) intent.propertyType = 'Villa';
  else if (lower.includes('townhouse')) intent.propertyType = 'Townhouse';
  else if (lower.includes('apartment') || lower.includes('flat')) intent.propertyType = 'Apartment';

  // Purpose detection
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('for sale')) {
    intent.purpose = 'For Sale';
  } else if (lower.includes('rent') || lower.includes('lease') || lower.includes('annual')) {
    intent.purpose = 'For Rent';
  }

  // Budget detection (e.g. 100k, 100,000, 100000, 2M, 2 million)
  const budgetKMatch = lower.match(/(?:under|below|max|budget of|around)?\s*(?:aed|\$)?\s*(\d{2,4})\s*k/);
  if (budgetKMatch) {
    intent.maxBudget = parseInt(budgetKMatch[1], 10) * 1000;
  } else {
    const rawNumberMatch = lower.match(/(?:under|below|max|budget of|up to)\s*(?:aed|\$)?\s*([\d,]{4,10})/);
    if (rawNumberMatch) {
      intent.maxBudget = parseInt(rawNumberMatch[1].replace(/,/g, ''), 10);
    }
  }

  return intent;
}

export async function findPropertiesForAssistantDb(
  userQuery: string,
  limit: number = 4
): Promise<{ property: PropertyRecord; matchReason: string; matchScore: number }[]> {
  const intent = extractPreferencesFromText(userQuery);

  const searchResult = await searchPropertiesFromDb({
    location: intent.location,
    bedrooms: intent.bedrooms,
    propertyType: intent.propertyType,
    maxPrice: intent.maxBudget,
    purpose: intent.purpose || 'For Rent',
    isActive: true,
    limit
  });

  return searchResult.properties.map((p) => {
    const reasons: string[] = [];
    if (intent.location && p.location.toLowerCase().includes(intent.location.toLowerCase())) {
      reasons.push(`Prime enclave matching in ${p.location}`);
    }
    if (intent.bedrooms !== undefined && p.bedrooms === intent.bedrooms) {
      reasons.push(`${p.bedrooms} BHK configuration exactly matching requested spec`);
    }
    if (p.priceAED > 0) {
      reasons.push(`Budget aligned at AED ${p.priceAED.toLocaleString()} ${p.purpose.toLowerCase()}`);
    }
    if (reasons.length === 0) {
      reasons.push(`Featured residence in ${p.location} with high rental yield`);
    }

    return {
      property: p,
      matchReason: reasons.join(' · '),
      matchScore: 95
    };
  });
}

