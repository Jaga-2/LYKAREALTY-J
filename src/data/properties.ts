import { Property } from '../types';
import {
  CurrencyMetadata,
  CURRENCY_CONFIG,
  BASELINE_RATES,
  formatCompactPrice,
  formatFullCurrencyPrice
} from '../utils/currency';

export const PROPERTIES: Property[] = [
  {
    id: 'res-palm-01',
    title: 'The Alba Oceanfront Sanctuary',
    tagline: 'Monumental waterfront pavilion with private yacht slipway & Dubai Marina skyline panorama',
    location: 'Palm Jumeirah',
    address: 'Bespoke Billionaires Row, Frond G, Palm Jumeirah, Dubai',
    type: 'Waterfront Villa',
    priceAED: 185000000, // ~50.3M USD
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
    priceAED: 142000000, // ~38.6M USD
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
    priceAED: 235000000, // ~63.9M USD
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
    priceAED: 165000000, // ~44.9M USD
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
    priceAED: 198000000, // ~53.9M USD
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
    priceAED: 89000000, // ~24.2M USD
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

export const CURRENCY_RATES: Record<string, { symbol: string; rate: number; label: string }> = {
  AED: { symbol: 'AED', rate: BASELINE_RATES.AED, label: 'United Arab Emirates Dirham' },
  USD: { symbol: '$', rate: BASELINE_RATES.USD, label: 'US Dollar' },
  EUR: { symbol: '€', rate: BASELINE_RATES.EUR, label: 'Euro' },
  GBP: { symbol: '£', rate: BASELINE_RATES.GBP, label: 'British Pound' },
  CHF: { symbol: 'CHF', rate: BASELINE_RATES.CHF, label: 'Swiss Franc' }
};

export function formatPrice(
  priceAED: number,
  currency: string = 'AED',
  rates?: Record<string, number>
): string {
  return formatCompactPrice(priceAED, currency as any, rates as any);
}

export function formatFullPrice(
  priceAED: number,
  currency: string = 'AED',
  rates?: Record<string, number>
): string {
  return formatFullCurrencyPrice(priceAED, currency as any, rates as any);
}

export function formatArea(areaSqFt: number, unit: 'sqft' | 'sqm' = 'sqft'): string {
  if (unit === 'sqm') {
    const sqm = Math.round(areaSqFt * 0.092903);
    return `${sqm.toLocaleString()} sq.m`;
  }
  return `${areaSqFt.toLocaleString()} sq.ft`;
}
