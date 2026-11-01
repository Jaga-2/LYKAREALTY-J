import React, { useState, useMemo, useEffect } from 'react';
import { Property, FilterState, Currency, AreaUnit, Screen } from '../types';
import { formatPrice, formatArea } from '../data/properties';
import { PropertyMap } from './PropertyMap';
import { CurrencySwitcherWidget } from './CurrencySwitcherWidget';
import { useLanguage } from '../context/LanguageContext';
import {
  Search,
  SlidersHorizontal,
  ArrowLeft,
  Bookmark,
  Eye,
  Map,
  LayoutGrid,
  RotateCcw,
  ShieldCheck,
  Check,
  Sliders,
  DollarSign
} from 'lucide-react';

interface PropertySearchScreenProps {
  properties: Property[];
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  areaUnit: AreaUnit;
  onAreaUnitChange: (u: AreaUnit) => void;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onNavigate: (screen: Screen) => void;
  onOpenConsultation: (propertyTitle?: string) => void;
  initialFilters?: Partial<FilterState>;
}

export const PropertySearchScreen: React.FC<PropertySearchScreenProps> = ({
  properties,
  currency,
  onCurrencyChange,
  areaUnit,
  onAreaUnitChange,
  savedIds,
  onToggleSave,
  onSelectProperty,
  onNavigate,
  onOpenConsultation,
  initialFilters = {}
}) => {
  const { t, language } = useLanguage();
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: initialFilters.searchQuery || '',
    location: initialFilters.location || '',
    propertyType: initialFilters.propertyType || '',
    minPrice: initialFilters.minPrice || 0,
    maxPrice: initialFilters.maxPrice || 300000000,
    bedrooms: initialFilters.bedrooms || '',
    status: initialFilters.status || '',
    viewType: initialFilters.viewType || '',
    sortBy: initialFilters.sortBy || 'price-desc'
  });

  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [furnishingFilter, setFurnishingFilter] = useState<string>('all');

  // Live Database Search State (Connected to Render PostgreSQL 73,727 records)
  const [liveProperties, setLiveProperties] = useState<Property[] | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch live properties from PostgreSQL backend
  useEffect(() => {
    let isMounted = true;
    const fetchLiveProperties = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.searchQuery) params.append('query', filters.searchQuery);
        if (filters.location && filters.location !== 'all') params.append('location', filters.location);
        if (filters.propertyType && filters.propertyType !== 'all') params.append('propertyType', filters.propertyType);
        if (filters.bedrooms && filters.bedrooms !== 'all') params.append('bedrooms', filters.bedrooms);
        if (filters.minPrice > 0) params.append('minPrice', String(filters.minPrice));
        if (filters.maxPrice < 300000000) params.append('maxPrice', String(filters.maxPrice));
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (purposeFilter && purposeFilter !== 'all') params.append('purpose', purposeFilter);
        if (furnishingFilter && furnishingFilter !== 'all') params.append('furnishing', furnishingFilter);
        params.append('page', String(page));
        params.append('limit', '24');

        const res = await fetch(`/api/properties?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.properties) {
            setLiveProperties(data.properties);
            setTotalCount(data.total || 0);
            setTotalPages(data.totalPages || 1);
          }
        }
      } catch (err) {
        console.warn('[PropertySearchScreen] Live query fallback:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchLiveProperties, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [filters, page, purposeFilter, furnishingFilter]);

  // Filter logic
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesTagline = p.tagline.toLowerCase().includes(q);
        const matchesLocation = p.location.toLowerCase().includes(q);
        const matchesArchitect = p.architect.toLowerCase().includes(q);
        const matchesAmenities = p.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTagline && !matchesLocation && !matchesArchitect && !matchesAmenities) {
          return false;
        }
      }

      // Location
      if (filters.location && p.location !== filters.location) {
        return false;
      }

      // Typology
      if (filters.propertyType && p.type !== filters.propertyType) {
        return false;
      }

      // Price range
      if (p.priceAED < filters.minPrice || p.priceAED > filters.maxPrice) {
        return false;
      }

      // Bedrooms
      if (filters.bedrooms) {
        const minBeds = parseInt(filters.bedrooms, 10);
        if (p.bedrooms < minBeds) {
          return false;
        }
      }

      // Status
      if (filters.status && p.status !== filters.status) {
        return false;
      }

      // View Type
      if (filters.viewType && p.viewType !== filters.viewType) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-desc') return b.priceAED - a.priceAED;
      if (filters.sortBy === 'price-asc') return a.priceAED - b.priceAED;
      if (filters.sortBy === 'area-desc') return b.areaSqFt - a.areaSqFt;
      if (filters.sortBy === 'handover') return a.handover.localeCompare(b.handover);
      return 0;
    });
  }, [properties, filters]);

  // Active properties (uses live PostgreSQL 73,727 database when connected, falls back gracefully)
  const displayProperties = liveProperties !== null ? liveProperties : filteredProperties;
  const totalVerifiedCount = liveProperties !== null ? totalCount : properties.length;

  // Reset filters
  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      location: '',
      propertyType: '',
      minPrice: 0,
      maxPrice: 300000000,
      bedrooms: '',
      status: '',
      viewType: '',
      sortBy: 'price-desc'
    });
  };

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.location ||
    filters.propertyType ||
    filters.minPrice > 0 ||
    filters.maxPrice < 300000000 ||
    filters.bedrooms ||
    filters.status ||
    filters.viewType
  );

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-24">
      
      {/* Top Banner & Breadcrumb Header */}
      <div className="bg-[#1f2428] text-white pt-10 pb-12 border-b border-[#c5a880]/30">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          
          {/* Breadcrumb back to Home */}
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#c5a880] hover:text-[#e9dac1] transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1 rtl:rotate-180" />
            <span>{t.search.returnHome}</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#c5a880] mb-2">
                <span>{t.search.portfolioTag}</span>
                <span aria-hidden="true" className="text-[#c5a880]/50">/</span>
                <span>{language === 'ar' ? 'البحث النشط' : 'Active Search'}</span>
              </div>
              <h1 className="font-editorial text-3xl sm:text-5xl font-medium tracking-tight text-white [text-wrap:balance]">
                {t.search.title}
              </h1>
            </div>

            {/* Quick unit & FX toggles */}
            <div className="flex items-center gap-3">
              {/* Real-Time Live Currency Converter Widget */}
              <CurrencySwitcherWidget />

              {/* Sq.ft / Sq.m switch */}
              <div className="flex items-center border border-[#c5a880]/30 rounded-[3px] bg-[#121517] p-0.5 text-xs">
                <button
                  onClick={() => onAreaUnitChange('sqft')}
                  className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                    areaUnit === 'sqft' ? 'bg-[#c5a880] text-[#121517] font-semibold' : 'text-[#dadad8] hover:text-white'
                  }`}
                >
                  {language === 'ar' ? 'قدم²' : 'sq.ft'}
                </button>
                <button
                  onClick={() => onAreaUnitChange('sqm')}
                  className={`px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                    areaUnit === 'sqm' ? 'bg-[#c5a880] text-[#121517] font-semibold' : 'text-[#dadad8] hover:text-white'
                  }`}
                >
                  {language === 'ar' ? 'م²' : 'sq.m'}
                </button>
              </div>

              {/* View Mode Toggle: Grid vs Map */}
              <div className="flex items-center border border-[#c5a880]/30 rounded-[3px] bg-[#121517] p-0.5 text-xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#c5a880] text-[#121517] font-semibold' : 'text-[#dadad8] hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{t.search.gridView}</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] transition-colors cursor-pointer ${
                    viewMode === 'map' ? 'bg-[#c5a880] text-[#121517] font-semibold' : 'text-[#dadad8] hover:text-white'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>{t.search.mapView}</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Main Filter & Controls Bar */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-[#c5a880]/20 shadow-sm py-4">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Live Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#75777a]" />
              <input
                type="text"
                placeholder={t.search.searchPlaceholder}
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 bg-[#faf9f7] rounded-[3px] border border-[#c5a880]/30 text-xs sm:text-sm text-[#1f2428] placeholder-[#75777a] focus:outline-none focus:border-[#c5a880]"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters({ ...filters, searchQuery: '' })}
                  className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-xs text-[#75777a] hover:text-[#1f2428] cursor-pointer"
                >
                  {t.search.clearAll}
                </button>
              )}
            </div>

            {/* Quick Enclave Dropdown */}
            <div className="md:col-span-3">
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full py-2.5 px-3 bg-[#faf9f7] rounded-[3px] border border-[#c5a880]/30 text-xs sm:text-sm text-[#1f2428] font-medium focus:outline-none focus:border-[#c5a880] cursor-pointer"
              >
                <option value="">{t.search.allEnclaves}</option>
                <option value="Dubai Marina">Dubai Marina</option>
                <option value="Downtown Dubai">{language === 'ar' ? 'وسط مدينة دبي' : 'Downtown Dubai'}</option>
                <option value="Palm Jumeirah">{language === 'ar' ? 'نخلة جميرا' : 'Palm Jumeirah'}</option>
                <option value="Business Bay">Business Bay</option>
                <option value="Jumeirah Beach Residence">JBR (Jumeirah Beach Residence)</option>
                <option value="Jumeirah Lake Towers">JLT (Jumeirah Lake Towers)</option>
                <option value="Jumeirah Bay Island">{language === 'ar' ? 'جزيرة جميرا باي' : 'Jumeirah Bay Island'}</option>
                <option value="Emirates Hills">{language === 'ar' ? 'تلال الإمارات' : 'Emirates Hills'}</option>
                <option value="DIFC">{language === 'ar' ? 'مركز دبي المالي العالمي' : 'DIFC Gate District'}</option>
                <option value="Al Barsha">Al Barsha</option>
                <option value="Deira">Deira</option>
                <option value="Bur Dubai">Bur Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Sharjah">Sharjah</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="md:col-span-2">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="w-full py-2.5 px-3 bg-[#faf9f7] rounded-[3px] border border-[#c5a880]/30 text-xs sm:text-sm text-[#1f2428] font-medium focus:outline-none focus:border-[#c5a880] cursor-pointer"
              >
                <option value="price-desc">{t.search.sortValuationHigh}</option>
                <option value="price-asc">{t.search.sortValuationLow}</option>
                <option value="area-desc">{t.search.sortAreaLargest}</option>
                <option value="handover">{t.search.sortHandover}</option>
              </select>
            </div>

            {/* Advanced Filters Toggle Button */}
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`w-full py-2.5 px-3 rounded-[3px] border text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  showAdvancedFilters || hasActiveFilters
                    ? 'bg-[#1f2428] text-[#c5a880] border-[#1f2428]'
                    : 'bg-[#faf9f7] text-[#1f2428] border-[#c5a880]/30 hover:border-[#c5a880]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{t.search.filterBtn} {hasActiveFilters && '•'}</span>
              </button>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  title="Reset all filters"
                  className="p-2.5 bg-[#faf9f7] hover:bg-[#efeeec] rounded-[3px] border border-[#c5a880]/30 text-[#75777a] hover:text-[#ba1a1a]"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Advanced Filter Drawer / Multi-Select Panel */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-[#c5a880]/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs animate-fadeIn">
              
              {/* Typology */}
              <div>
                <label className="block label-caps text-[10px] text-[#75777a] mb-1.5">
                  Architectural Typology
                </label>
                <select
                  value={filters.propertyType}
                  onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                  className="w-full p-2 bg-[#faf9f7] rounded-[2px] border border-[#c5a880]/30 text-xs focus:outline-none"
                >
                  <option value="">All Typologies</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Hotel Apartment">Hotel Apartment</option>
                  <option value="Waterfront Villa">Waterfront Villa</option>
                  <option value="Sky Penthouse">Sky Penthouse</option>
                </select>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block label-caps text-[10px] text-[#75777a] mb-1.5">
                  Bedrooms / Configuration
                </label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                  className="w-full p-2 bg-[#faf9f7] rounded-[2px] border border-[#c5a880]/30 text-xs focus:outline-none"
                >
                  <option value="">Any Bedrooms</option>
                  <option value="0">Studio / 0 BHK</option>
                  <option value="1">1 Bedroom / 1 BHK</option>
                  <option value="2">2 Bedrooms / 2 BHK</option>
                  <option value="3">3 Bedrooms / 3 BHK</option>
                  <option value="4">4 Bedrooms / 4 BHK</option>
                  <option value="5">5+ Bedrooms</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block label-caps text-[10px] text-[#75777a] mb-1.5">
                  Discretion & Status Tier
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full p-2 bg-[#faf9f7] rounded-[2px] border border-[#c5a880]/30 text-xs focus:outline-none"
                >
                  <option value="">All Tiers</option>
                  <option value="Available">Available Acquisition</option>
                  <option value="Off-Market Confidential">Off-Market Confidential</option>
                  <option value="Penthouse Collection">Penthouse Collection</option>
                </select>
              </div>

              {/* View Horizon */}
              <div>
                <label className="block label-caps text-[10px] text-[#75777a] mb-1.5">
                  Primary Panorama View
                </label>
                <select
                  value={filters.viewType}
                  onChange={(e) => setFilters({ ...filters, viewType: e.target.value })}
                  className="w-full p-2 bg-[#faf9f7] rounded-[2px] border border-[#c5a880]/30 text-xs focus:outline-none"
                >
                  <option value="">All Views</option>
                  <option value="Arabian Gulf Open Ocean">Arabian Gulf Open Ocean</option>
                  <option value="Burj Khalifa & Downtown Skyline">Burj Khalifa & Skyline</option>
                  <option value="Championship Golf Course">Championship Golf Course</option>
                </select>
              </div>

              {/* Purpose (Rent vs Buy) */}
              <div>
                <label className="block label-caps text-[10px] text-[#75777a] mb-1.5">
                  Transaction Purpose
                </label>
                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value)}
                  className="w-full p-2 bg-[#faf9f7] rounded-[2px] border border-[#c5a880]/30 text-xs focus:outline-none"
                >
                  <option value="all">All (Rent & Buy)</option>
                  <option value="For Rent">For Rent (Annual Lease)</option>
                  <option value="For Sale">For Sale (Freehold)</option>
                </select>
              </div>

              {/* Furnishing */}
              <div>
                <label className="block label-caps text-[10px] text-[#75777a] mb-1.5">
                  Furnishing Standard
                </label>
                <select
                  value={furnishingFilter}
                  onChange={(e) => setFurnishingFilter(e.target.value)}
                  className="w-full p-2 bg-[#faf9f7] rounded-[2px] border border-[#c5a880]/30 text-xs focus:outline-none"
                >
                  <option value="all">Any Furnishing</option>
                  <option value="Furnished">Furnished (Turnkey Luxury)</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>

            </div>
          )}

          {/* Active Filter Chips Row */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="text-[#75777a] font-medium">Active Filters:</span>
              
              {filters.searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#1f2428] text-white text-[11px]">
                  Keyword: "{filters.searchQuery}"
                  <button onClick={() => setFilters({ ...filters, searchQuery: '' })}>×</button>
                </span>
              )}

              {filters.location && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#1f2428] text-white text-[11px]">
                  {filters.location}
                  <button onClick={() => setFilters({ ...filters, location: '' })}>×</button>
                </span>
              )}

              {filters.propertyType && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#1f2428] text-white text-[11px]">
                  {filters.propertyType}
                  <button onClick={() => setFilters({ ...filters, propertyType: '' })}>×</button>
                </span>
              )}

              {filters.bedrooms && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#1f2428] text-white text-[11px]">
                  {filters.bedrooms}+ Suites
                  <button onClick={() => setFilters({ ...filters, bedrooms: '' })}>×</button>
                </span>
              )}

              {filters.status && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#1f2428] text-white text-[11px]">
                  {filters.status}
                  <button onClick={() => setFilters({ ...filters, status: '' })}>×</button>
                </span>
              )}

              <button
                onClick={resetFilters}
                className="text-xs text-[#5a1645] font-semibold underline hover:text-[#1f2428]"
              >
                Clear All
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Main Content Area: Grid or Map */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8">
        
        {/* Results Count & Layout Toggle Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#c5a880]/20">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#75777a]">
            <span>
              {t.search.showingResults} <span className="font-semibold text-[#1f2428] tabular-nums">{displayProperties.length}</span> {language === 'ar' ? 'من أصل' : 'of'} <span className="font-semibold text-[#1f2428] tabular-nums">{totalVerifiedCount.toLocaleString()}</span> {t.search.ofVerified}
            </span>
            <span aria-hidden="true" className="text-[#c5a880]/50 hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              {language === 'ar' ? 'الأسعار بـ' : 'Prices in'} <span className="font-semibold text-[#1f2428]">{currency}</span> · {language === 'ar' ? 'المساحة بـ' : 'Area in'} <span className="font-semibold text-[#1f2428]">{areaUnit === 'sqft' ? (language === 'ar' ? 'قدم²' : 'sq.ft') : (language === 'ar' ? 'م²' : 'sq.m')}</span>
            </span>
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#5a1645] font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#5a1645] animate-ping" />
                Querying 73,727 database...
              </span>
            )}
            {viewMode === 'map' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#1f2428] text-[#c5a880] text-[10px] font-semibold tracking-wider uppercase">
                <Map className="w-3 h-3" />
                <span>{t.search.mapModeActive}</span>
              </span>
            )}
          </div>

          {/* Prominent Layout Segmented Control Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="label-caps text-[#75777a] text-[10px]">{t.search.layoutLabel}</span>
            <div className="inline-flex rounded-[3px] border border-[#c5a880]/40 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[2px] transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#1f2428] text-[#c5a880] shadow-sm'
                    : 'text-[#44474a] hover:text-[#1f2428] hover:bg-[#faf9f7]'
                }`}
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t.search.gridView}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[2px] transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-[#1f2428] text-[#c5a880] shadow-sm'
                    : 'text-[#44474a] hover:text-[#1f2428] hover:bg-[#faf9f7]'
                }`}
                aria-pressed={viewMode === 'map'}
              >
                <Map className="w-3.5 h-3.5" />
                <span>{t.search.mapView}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Conditional View: Map vs Grid */}
        {viewMode === 'map' ? (
          <div className="space-y-8">
            <PropertyMap
              properties={displayProperties}
              currency={currency}
              onSelectProperty={onSelectProperty}
            />

            {/* Below-map property list */}
            <div className="pt-8 border-t border-[#c5a880]/20">
              <h3 className="font-editorial text-2xl font-medium text-[#1f2428] mb-6">
                {language === 'ar' ? `المقتنيات المحددة على الخريطة (${displayProperties.length})` : `Charted Enclave Holdings (${displayProperties.length})`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProperties.map((property) => (
                  <PropertyCompactCard
                    key={property.id}
                    property={property}
                    currency={currency}
                    areaUnit={areaUnit}
                    isSaved={savedIds.includes(property.id)}
                    onToggleSave={() => onToggleSave(property.id)}
                    onSelect={() => onSelectProperty(property)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div>
            {displayProperties.length === 0 ? (
              /* Empty State */
              <div className="text-center py-24 bg-white rounded-[4px] border border-[#c5a880]/20 p-8">
                <Search className="w-10 h-10 text-[#c5a880] mx-auto mb-4" />
                <h3 className="font-editorial text-2xl font-medium text-[#1f2428] mb-2">
                  {t.search.noResultsTitle}
                </h3>
                <p className="text-sm text-[#75777a] max-w-md mx-auto mb-6 font-light">
                  {t.search.noResultsDesc}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={resetFilters}
                    className="px-5 py-2.5 bg-[#1f2428] text-[#c5a880] text-xs font-semibold tracking-wider uppercase rounded-[3px] cursor-pointer"
                  >
                    {t.search.resetFilters}
                  </button>
                  <button
                    onClick={() => onOpenConsultation()}
                    className="px-5 py-2.5 border border-[#c5a880] text-[#1f2428] text-xs font-semibold tracking-wider uppercase rounded-[3px] hover:bg-[#c5a880]/10 cursor-pointer"
                  >
                    {t.search.inquireCounter}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayProperties.map((property) => {
                    const isSaved = savedIds.includes(property.id);

                    return (
                      <div
                        key={property.id}
                        className="group bg-white rounded-[4px] border border-[#c5a880]/25 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#c5a880]/60 flex flex-col justify-between"
                      >
                        {/* 4:3 Strict Image Ratio */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1f2428]">
                          <img
                            src={property.image}
                            alt={property.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                          {/* Status Chip */}
                          <div className="absolute top-3 left-3 z-10">
                            {property.status === 'Off-Market Confidential' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-semibold tracking-[0.14em] uppercase bg-[#5a1645] text-[#ffe088] rounded-[2px] border border-[#d4af37]/40 shadow-sm backdrop-blur-sm">
                                <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
                                <span>Off-Market</span>
                              </span>
                            ) : property.status === 'Penthouse Collection' ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] uppercase bg-[#1f2428] text-[#c5a880] rounded-[2px] border border-[#c5a880]/40 shadow-sm">
                                Penthouse
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold tracking-[0.14em] uppercase bg-white/90 text-[#1f2428] rounded-[2px] border border-[#c5a880]/30 shadow-sm">
                                Available
                              </span>
                            )}
                          </div>

                          {/* Save button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSave(property.id);
                            }}
                            className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-[3px] border flex items-center justify-center transition-all ${
                              isSaved
                                ? 'bg-[#5a1645] border-[#d4af37] text-[#ffd8eb]'
                                : 'bg-white/80 hover:bg-white border-[#c5a880]/40 text-[#1f2428]'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                          </button>

                          {/* Price Tag in Image */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                            <div>
                              <span className="label-caps text-[#e9dac1] block text-[9px]">
                                {property.purpose === 'For Rent' ? 'Annual Rent' : 'Asking Price'}
                              </span>
                              <div className="font-editorial text-2xl font-semibold tracking-tight text-white tabular-nums drop-shadow-sm">
                                {formatPrice(property.priceAED, currency)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            {/* Unboxed Metadata */}
                            <div className="flex items-center gap-1.5 text-xs text-[#75777a] mb-2 font-medium">
                              <span>{property.location}</span>
                              <span aria-hidden="true" className="text-[#c5a880]">·</span>
                              <span>{formatArea(property.areaSqFt, areaUnit)}</span>
                              <span aria-hidden="true" className="text-[#c5a880]">·</span>
                              <span>{property.bedrooms} Beds</span>
                            </div>

                            <h3
                              onClick={() => onSelectProperty(property)}
                              className="font-editorial text-xl font-medium text-[#1f2428] hover:text-[#735c00] transition-colors cursor-pointer mb-2 [text-wrap:balance]"
                            >
                              {property.title}
                            </h3>

                            <p className="text-xs text-[#44474a] font-light leading-relaxed line-clamp-2 mb-4">
                              {property.tagline}
                            </p>
                          </div>

                          {/* Specifications & Actions */}
                          <div className="pt-4 border-t border-[#c5a880]/15 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <span className="label-caps text-[9px] text-[#75777a] block">Status</span>
                                <span className="font-medium text-[#1f2428] truncate block max-w-[140px]">{property.purpose || 'For Rent'}</span>
                              </div>
                              <div className="text-right">
                                <span className="label-caps text-[9px] text-[#75777a] block">Yield</span>
                                <span className="font-semibold text-[#5a1645] tabular-nums">{property.projectedYield}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <button
                                onClick={() => onSelectProperty(property)}
                                className="w-full py-2 bg-[#1f2428] hover:bg-[#121517] text-[#c5a880] text-[11px] font-semibold tracking-[0.1em] uppercase rounded-[2px] border border-[#c5a880]/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Details</span>
                              </button>

                              <button
                                onClick={() => onOpenConsultation(property.title)}
                                className="w-full py-2 bg-[#faf9f7] hover:bg-[#f4f3f1] text-[#1f2428] text-[11px] font-semibold tracking-[0.1em] uppercase rounded-[2px] border border-[#c5a880]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>Inquire</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      disabled={page <= 1 || isLoading}
                      className="px-4 py-2 bg-white hover:bg-[#faf9f7] disabled:opacity-40 rounded-[2px] border border-[#c5a880]/40 text-xs font-semibold uppercase tracking-wider text-[#1f2428] transition-colors cursor-pointer shadow-xs"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-[#1f2428] px-3">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      disabled={page >= totalPages || isLoading}
                      className="px-4 py-2 bg-[#1f2428] hover:bg-[#121517] disabled:opacity-40 rounded-[2px] border border-[#c5a880] text-xs font-semibold uppercase tracking-wider text-[#c5a880] transition-colors cursor-pointer shadow-xs"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};

// Compact Card for below-map listings
const PropertyCompactCard: React.FC<{
  property: Property;
  currency: Currency;
  areaUnit: AreaUnit;
  isSaved: boolean;
  onToggleSave: () => void;
  onSelect: () => void;
}> = ({ property, currency, areaUnit, isSaved, onToggleSave, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-[4px] border border-[#c5a880]/30 p-4 hover:shadow-md cursor-pointer transition-all flex gap-4 items-center"
    >
      <div className="w-24 h-20 rounded-[2px] overflow-hidden bg-[#1f2428] shrink-0">
        <img
          src={property.image}
          alt={property.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] label-caps text-[#c5a880] truncate">{property.location}</div>
        <h4 className="font-editorial text-sm font-medium text-[#1f2428] truncate mb-1">
          {property.title}
        </h4>
        <div className="text-xs font-semibold text-[#1f2428] tabular-nums">
          {formatPrice(property.priceAED, currency)}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave();
        }}
        className={`p-2 rounded-[2px] border ${
          isSaved ? 'bg-[#5a1645] text-white border-[#d4af37]' : 'text-[#75777a] hover:text-[#1f2428] border-transparent'
        }`}
      >
        <Bookmark className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
