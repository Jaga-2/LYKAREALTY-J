import React from 'react';
import { Property, Currency, AreaUnit, Screen } from '../types';
import { formatPrice, formatArea } from '../data/properties';
import { ArrowRight, Bookmark, Eye, ShieldCheck, Compass } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PropertyImage } from './PropertyImage';

interface CuratedCollectionProps {
  properties: Property[];
  currency: Currency;
  areaUnit: AreaUnit;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onNavigate: (screen: Screen) => void;
}

export const CuratedCollection: React.FC<CuratedCollectionProps> = ({
  properties,
  currency,
  areaUnit,
  savedIds,
  onToggleSave,
  onSelectProperty,
  onNavigate
}) => {
  const { t, language } = useLanguage();
  // Show top 4 flagship properties
  const featured = properties.slice(0, 4);

  return (
    <section className="py-20 bg-[#faf9f7] border-t border-[#c5a880]/20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#735c00] mb-3">
              <span>{t.modal.monographTag}</span>
              <span aria-hidden="true" className="text-[#c5a880]">/</span>
              <span>{t.collection.tag}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1f2428] tracking-tight [text-wrap:balance]">
              {t.collection.title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#1f2428] hover:text-[#735c00] transition-colors py-2 group cursor-pointer"
            >
              <span>{t.collection.viewAll}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 text-[#c5a880]" />
            </button>
          </div>
        </div>

        {/* 2-Column Asymmetric Architectural Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {featured.map((property) => {
            const isSaved = savedIds.includes(property.id);

            return (
              <div
                key={property.id}
                className="group bg-white rounded-[4px] border border-[#c5a880]/25 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#c5a880]/60 flex flex-col"
              >
                {/* 4:3 Strict Ratio Image Frame */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1f2428]">
                  <PropertyImage
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Gradient Scrim for readable badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Status Indicator Chip */}
                  <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-10">
                    {property.status === 'Off-Market Confidential' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase bg-[#5a1645] text-[#ffe088] rounded-[2px] border border-[#d4af37]/40 shadow-sm backdrop-blur-sm">
                        <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
                        <span>{t.collection.offMarket}</span>
                      </span>
                    ) : property.status === 'Penthouse Collection' ? (
                      <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase bg-[#1f2428] text-[#c5a880] rounded-[2px] border border-[#c5a880]/40 shadow-sm">
                        {t.collection.penthouse}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase bg-white/90 text-[#1f2428] rounded-[2px] border border-[#c5a880]/30 shadow-sm">
                        {t.collection.available}
                      </span>
                    )}
                  </div>

                  {/* Save to Shortlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(property.id);
                    }}
                    aria-label={isSaved ? t.modal.saved : t.modal.save}
                    className={`absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10 w-9 h-9 rounded-[3px] border flex items-center justify-center transition-all cursor-pointer ${
                      isSaved
                        ? 'bg-[#5a1645] border-[#d4af37] text-[#ffd8eb]'
                        : 'bg-white/80 hover:bg-white border-[#c5a880]/40 text-[#1f2428]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>

                  {/* Bottom Image Overlay Strip: Price & Typology */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                    <div>
                      <span className="label-caps text-[#e9dac1] block text-[10px]">
                        {t.collection.askingValuation}
                      </span>
                      <div className="font-editorial text-2xl lg:text-3xl font-semibold tracking-tight text-white tabular-nums drop-shadow-sm">
                        {formatPrice(property.priceAED, currency)}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectProperty(property)}
                      className="px-3 py-1.5 bg-[#1f2428]/85 hover:bg-[#121517] text-[#c5a880] text-xs font-semibold tracking-[0.1em] uppercase rounded-[2px] border border-[#c5a880]/40 flex items-center gap-1.5 transition-colors backdrop-blur-sm cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.collection.dossierBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Card Content & Architectural Specifications */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Clean unboxed metadata (anti-pill discipline) */}
                    <div className="flex items-center gap-2 text-xs text-[#75777a] mb-2 font-medium">
                      <span>{property.location}</span>
                      <span aria-hidden="true" className="text-[#c5a880]">·</span>
                      <span>{formatArea(property.areaSqFt, areaUnit)}</span>
                      <span aria-hidden="true" className="text-[#c5a880]">·</span>
                      <span>{property.bedrooms} {t.collection.suites}</span>
                      <span aria-hidden="true" className="text-[#c5a880]">·</span>
                      <span>{property.type}</span>
                    </div>

                    <h3
                      onClick={() => onSelectProperty(property)}
                      className="font-editorial text-2xl font-medium text-[#1f2428] hover:text-[#735c00] transition-colors cursor-pointer mb-2 [text-wrap:balance]"
                    >
                      {property.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#44474a] font-light leading-relaxed line-clamp-2 mb-4">
                      {property.tagline}
                    </p>
                  </div>

                  {/* Footer specs with architectural pillars */}
                  <div className="pt-4 border-t border-[#c5a880]/15 flex items-center justify-between text-xs">
                    <div>
                      <span className="label-caps text-[9px] text-[#75777a] block">{t.collection.architect}</span>
                      <span className="font-medium text-[#1f2428] truncate block max-w-[180px]">{property.architect}</span>
                    </div>

                    <div>
                      <span className="label-caps text-[9px] text-[#75777a] block">{t.collection.estYield}</span>
                      <span className="font-semibold text-[#5a1645] tabular-nums">{property.projectedYield}</span>
                    </div>

                    <div>
                      <span className="label-caps text-[9px] text-[#75777a] block">{t.collection.handover}</span>
                      <span className="font-medium text-[#1f2428]">{property.handover}</span>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Action Row */}
        <div className="mt-12 text-center">
          <button
            onClick={() => onNavigate('search')}
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#1f2428] hover:bg-[#121517] text-[#c5a880] text-xs font-semibold tracking-[0.14em] uppercase rounded-[3px] border border-[#c5a880]/50 transition-all shadow-md group hover:border-[#c5a880] cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#c5a880]" />
            <span>{t.collection.launchSearchBtn}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </button>
        </div>

      </div>
    </section>
  );
};
