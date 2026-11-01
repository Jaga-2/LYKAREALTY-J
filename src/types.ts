export type Screen = 'home' | 'search' | 'customer-portal' | 'agent-portal' | 'admin-portal' | 'superadmin-portal' | 'staff-login';

export type UserRole = 'customer' | 'sales_agent' | 'admin' | 'super_admin';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  title?: string;
  assignedAgentId?: string;
}

export type Language = 'en' | 'ar' | 'ta' | 'tanglish';
export type Currency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'CHF';
export type AreaUnit = 'sqft' | 'sqm';

export interface Property {
  id: string;
  title: string;
  tagline: string;
  location: string;
  city?: string;
  address: string;
  type: string;
  purpose?: string;
  furnishing?: string;
  priceAED: number; // in AED
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  plotSqFt?: number;
  ceilingHeight: string;
  handover: string; // e.g., 'Immediate / Ready', 'Q4 2026', 'Q2 2027'
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
  coordinates: {
    x: number; // percentage on map (0-100)
    y: number; // percentage on map (0-100)
  };
}

export interface FilterState {
  searchQuery: string;
  location: string;
  propertyType: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  status: string;
  viewType: string;
  sortBy: 'price-desc' | 'price-asc' | 'area-desc' | 'handover';
}
