import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { FilterState, Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeroSectionProps {
  onSearchWithFilters: (filters: Partial<FilterState>) => void;
  onNavigate: (screen: Screen) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearchWithFilters,
  onNavigate
}) => {
  const { t, language } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBudget, setSelectedBudget] = useState('all');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let minPrice = 0;
    let maxPrice = 300000000;

    if (selectedBudget === 'under100m') {
      maxPrice = 100000000;
    } else if (selectedBudget === '100m-200m') {
      minPrice = 100000000;
      maxPrice = 200000000;
    } else if (selectedBudget === 'over200m') {
      minPrice = 200000000;
      maxPrice = 500000000;
    }

    onSearchWithFilters({
      location: selectedLocation === 'All' ? '' : selectedLocation,
      propertyType: selectedType === 'All' ? '' : selectedType,
      minPrice,
      maxPrice
    });
    onNavigate('search');
  };

  return (
    <section className="relative overflow-hidden bg-[#faf9f7] pt-6 pb-16 lg:pb-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        
        {/* Main Hero Visual Card */}
        <div className="relative rounded-[6px] overflow-hidden border border-[#c5a880]/30 shadow-xl bg-[#1f2428]">
          
          {/* Background Image Container with Measured Gradient Scrim */}
          <div className="relative aspect-[16/9] min-h-[480px] lg:min-h-[640px] w-full">
            <img
              src="/assets/images/hero_dubai_residence_1793286170254.jpg"
              alt="LYKA Realty Flagship Waterfront Residence at Dusk"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-[0.92]"
            />
            {/* Scrim overlay meeting 4.5:1 contrast requirements */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121517]/95 via-[#1f2428]/50 to-black/25" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-black/20 to-[#121517]/80" />
          </div>

          {/* Floating Editorial Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 lg:p-16">
            
            <div className="max-w-3xl">
              {/* Unboxed tracked editorial tag */}
              <div className="flex items-center gap-2 mb-4 text-[#c5a880] text-xs font-semibold tracking-[0.2em] uppercase">
                <span>{t.hero.editorialTag}</span>
                <span aria-hidden="true" className="text-[#c5a880]/50">·</span>
                <span>{t.hero.monographTag}</span>
              </div>

              {/* Display Hero Title with balanced wrapping */}
              <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-white font-medium tracking-tight leading-[1.12] mb-5 [text-wrap:balance]">
                {t.hero.titlePart1} <br className="hidden sm:inline" />
                <span className="italic font-normal text-[#e9dac1]">{t.hero.titlePart2}</span>
              </h1>

              {/* Value proposition prose */}
              <p className="text-sm sm:text-base lg:text-lg text-[#efeeec]/90 font-light leading-relaxed max-w-2xl mb-8">
                {t.hero.subtitle}
              </p>
            </div>

            {/* Quick Search Strip Filter Bar */}
            <form
              onSubmit={handleQuickSearch}
              className="w-full max-w-4xl bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-[4px] border border-[#c5a880]/40 shadow-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
            >
              {/* Location Selector */}
              <div className="px-3 py-2 border-b sm:border-b-0 sm:border-r border-[#c5a880]/20 rtl:sm:border-r-0 rtl:sm:border-l">
                <label className="block label-caps text-[10px] text-[#75777a] mb-1">
                  {t.hero.enclaveLabel}
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#1f2428] focus:outline-none cursor-pointer"
                >
                  <option value="All">{t.hero.allEnclaves}</option>
                  <option value="Palm Jumeirah">{language === 'ar' ? 'نخلة جميرا' : 'Palm Jumeirah'}</option>
                  <option value="Jumeirah Bay Island">{language === 'ar' ? 'جزيرة جميرا باي' : 'Jumeirah Bay Island'}</option>
                  <option value="Downtown Dubai">{language === 'ar' ? 'وسط مدينة دبي' : 'Downtown Dubai'}</option>
                  <option value="Emirates Hills">{language === 'ar' ? 'تلال الإمارات' : 'Emirates Hills'}</option>
                  <option value="DIFC">{language === 'ar' ? 'مركز دبي المالي العالمي' : 'DIFC Gate District'}</option>
                </select>
              </div>

              {/* Property Typology */}
              <div className="px-3 py-2 border-b sm:border-b-0 sm:border-r border-[#c5a880]/20 rtl:sm:border-r-0 rtl:sm:border-l">
                <label className="block label-caps text-[10px] text-[#75777a] mb-1">
                  {t.hero.typologyLabel}
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#1f2428] focus:outline-none cursor-pointer"
                >
                  <option value="All">{t.hero.allTypologies}</option>
                  <option value="Waterfront Villa">{language === 'ar' ? 'فيلا شاطئية فاخرة' : 'Waterfront Villa'}</option>
                  <option value="Sky Penthouse">{language === 'ar' ? 'سكاي بنتهاوس بانورامي' : 'Sky Penthouse'}</option>
                  <option value="Private Island Estate">{language === 'ar' ? 'قصر جزيرة خاصة' : 'Private Island Estate'}</option>
                  <option value="Architectural Mansion">{language === 'ar' ? 'قصر معماري أيقوني' : 'Architectural Mansion'}</option>
                </select>
              </div>

              {/* Capital Allocation / Budget */}
              <div className="px-3 py-2">
                <label className="block label-caps text-[10px] text-[#75777a] mb-1">
                  {t.hero.tierLabel}
                </label>
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#1f2428] focus:outline-none cursor-pointer"
                >
                  <option value="all">{t.hero.allTiers}</option>
                  <option value="under100m">{t.hero.tierUnder100m}</option>
                  <option value="100m-200m">{t.hero.tier100to200m}</option>
                  <option value="over200m">{t.hero.tierOver200m}</option>
                </select>
              </div>

              {/* Search Trigger Button */}
              <div>
                <button
                  type="submit"
                  className="w-full h-11 bg-[#1f2428] hover:bg-[#121517] text-[#c5a880] rounded-[3px] border border-[#c5a880]/40 flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase transition-all shadow-sm hover:border-[#c5a880] cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{t.hero.discoverBtn}</span>
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Architectural Metric Pillars Strip (Rule 13: 4-column KPI strip below hero split) */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 pt-8 border-t border-[#c5a880]/20">
          
          <div className="bg-white p-6 rounded-[4px] border border-[#c5a880]/20 shadow-sm">
            <span className="label-caps text-[#75777a] block mb-2">{t.hero.metricValuation}</span>
            <div className="font-editorial text-2xl lg:text-3xl font-semibold text-[#1f2428] tabular-nums">
              {language === 'ar' ? '٢٨٫٤+ مليار درهم' : 'AED 28.4B+'}
            </div>
            <p className="text-xs text-[#75777a] mt-1 font-light">{t.hero.metricValuationSub}</p>
          </div>

          <div className="bg-white p-6 rounded-[4px] border border-[#c5a880]/20 shadow-sm">
            <span className="label-caps text-[#75777a] block mb-2">{t.hero.metricDiscretion}</span>
            <div className="font-editorial text-2xl lg:text-3xl font-semibold text-[#5a1645] tabular-nums">
              {language === 'ar' ? '٩٨٫٢٪' : '98.2%'}
            </div>
            <p className="text-xs text-[#75777a] mt-1 font-light">{t.hero.metricDiscretionSub}</p>
          </div>

          <div className="bg-white p-6 rounded-[4px] border border-[#c5a880]/20 shadow-sm">
            <span className="label-caps text-[#75777a] block mb-2">{t.hero.metricVelocity}</span>
            <div className="font-editorial text-2xl lg:text-3xl font-semibold text-[#1f2428] tabular-nums">
              {language === 'ar' ? '١٤ يوماً' : '14 Days'}
            </div>
            <p className="text-xs text-[#75777a] mt-1 font-light">{t.hero.metricVelocitySub}</p>
          </div>

          <div className="bg-white p-6 rounded-[4px] border border-[#c5a880]/20 shadow-sm">
            <span className="label-caps text-[#75777a] block mb-2">{t.hero.metricFreehold}</span>
            <div className="font-editorial text-2xl lg:text-3xl font-semibold text-[#1f2428] tabular-nums">
              {language === 'ar' ? '١٠٠٪' : '100%'}
            </div>
            <p className="text-xs text-[#75777a] mt-1 font-light">{t.hero.metricFreeholdSub}</p>
          </div>

        </div>

      </div>
    </section>
  );
};
