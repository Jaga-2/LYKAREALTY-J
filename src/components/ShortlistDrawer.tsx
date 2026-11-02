import React, { useState } from 'react';
import { Property, Currency, AreaUnit } from '../types';
import { formatPrice, formatArea } from '../data/properties';
import { useLanguage } from '../context/LanguageContext';
import { PropertyImage } from './PropertyImage';
import { X, Trash2, Eye, Compass, FileCheck, Scale, CheckSquare, Square } from 'lucide-react';

interface ShortlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedProperties: Property[];
  currency: Currency;
  areaUnit: AreaUnit;
  onRemove: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenConsultation: () => void;
  onOpenComparison: (selectedIds: string[]) => void;
}

export const ShortlistDrawer: React.FC<ShortlistDrawerProps> = ({
  isOpen,
  onClose,
  savedProperties,
  currency,
  areaUnit,
  onRemove,
  onSelectProperty,
  onOpenConsultation,
  onOpenComparison
}) => {
  const { t, language, isRTL } = useLanguage();
  const [requestedJointDossier, setRequestedJointDossier] = useState(false);
  
  // Selection of up to 3 properties for comparison
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>(() => {
    return savedProperties.slice(0, 3).map(p => p.id);
  });

  if (!isOpen) return null;

  const toggleSelectForComparison = (id: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        // Cap at 3 properties
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const selectTopThree = () => {
    setSelectedForComparison(savedProperties.slice(0, 3).map(p => p.id));
  };

  const handleLaunchComparison = () => {
    if (selectedForComparison.length === 0) {
      // Default to first 3 if none checked
      const toCompare = savedProperties.slice(0, 3).map(p => p.id);
      onOpenComparison(toCompare);
    } else {
      onOpenComparison(selectedForComparison);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pr-10' : 'right-0 pl-10'} max-w-full flex`}>
        <div className={`w-screen max-w-xl bg-[#faf9f7] ${isRTL ? 'border-r' : 'border-l'} border-[#c5a880]/30 shadow-2xl flex flex-col justify-between`}>
          
          {/* Header */}
          <div className="bg-[#1f2428] text-white px-6 py-5 flex items-center justify-between border-b border-[#c5a880]/30 shrink-0">
            <div>
              <span className="label-caps text-[#c5a880] text-[10px] block">{t.shortlist.tag}</span>
              <h3 className="font-editorial text-xl font-medium text-white">
                {t.shortlist.title} ({savedProperties.length})
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#dadad8] hover:text-white rounded-[2px] transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader: Property Comparison Quick-Bar */}
          {savedProperties.length > 0 && !requestedJointDossier && (
            <div className="bg-[#efeeec] px-6 py-3 border-b border-[#c5a880]/20 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-[#5a1645]" />
                <span className="font-semibold text-[#1f2428]">{t.shortlist.compareSideBySide}</span>
                <span className="text-[#75777a] tabular-nums">
                  ({selectedForComparison.length}/3 {language === 'ar' ? 'محدد' : 'selected'})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedForComparison.length < 3 && savedProperties.length > selectedForComparison.length && (
                  <button
                    onClick={selectTopThree}
                    className="text-[11px] text-[#735c00] hover:text-[#1f2428] font-medium cursor-pointer"
                  >
                    {t.shortlist.select3Preset}
                  </button>
                )}
                <button
                  onClick={handleLaunchComparison}
                  disabled={selectedForComparison.length === 0}
                  className="px-3 py-1 bg-[#1f2428] hover:bg-[#121517] disabled:opacity-50 text-[#c5a880] text-[10px] font-semibold tracking-wider uppercase rounded-[2px] transition-colors cursor-pointer"
                >
                  {t.shortlist.launchTable}
                </button>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {savedProperties.length === 0 ? (
              <div className="text-center py-20 text-[#75777a]">
                <Compass className="w-10 h-10 text-[#c5a880] mx-auto mb-3" />
                <h4 className="font-editorial text-xl font-medium text-[#1f2428] mb-1">
                  {t.shortlist.emptyTitle}
                </h4>
                <p className="text-xs text-[#75777a] max-w-xs mx-auto mb-6 font-light">
                  {t.shortlist.emptyDesc}
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#1f2428] text-[#c5a880] text-xs font-semibold tracking-wider uppercase rounded-[2px] cursor-pointer"
                >
                  {t.shortlist.exploreBtn}
                </button>
              </div>
            ) : requestedJointDossier ? (
              <div className="bg-[#1f2428] text-white p-6 rounded-[4px] border border-[#c5a880]/40 text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#5a1645] border border-[#d4af37] text-[#ffd8eb] mx-auto flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h4 className="font-editorial text-xl font-medium text-white">
                  Comparative Analysis Initiated
                </h4>
                <p className="text-xs text-[#dadad8] font-light leading-relaxed">
                  Our private desk is preparing a side-by-side investment pro-forma for all {savedProperties.length} shortlisted estates, including tax residency comparisons and cadastral surveys.
                </p>
                <button
                  onClick={() => setRequestedJointDossier(false)}
                  className="text-xs text-[#c5a880] underline hover:text-white"
                >
                  Back to Shortlist
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#75777a] pb-2 border-b border-[#c5a880]/20">
                  <span>Select up to 3 for comparison</span>
                  <span>{currency} Valuations</span>
                </div>

                {savedProperties.map((property) => {
                  const isChecked = selectedForComparison.includes(property.id);

                  return (
                    <div
                      key={property.id}
                      className={`bg-white p-4 rounded-[4px] border transition-all space-y-3 ${
                        isChecked
                          ? 'border-[#c5a880] ring-1 ring-[#c5a880]/50 shadow-md'
                          : 'border-[#c5a880]/25 shadow-sm'
                      }`}
                    >
                      <div className="flex gap-4 items-center">
                        
                        {/* Checkbox for side-by-side comparison selection */}
                        <button
                          type="button"
                          onClick={() => toggleSelectForComparison(property.id)}
                          className={`w-6 h-6 rounded-[2px] border flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-[#1f2428] border-[#c5a880] text-[#c5a880]'
                              : 'border-[#c5a880]/40 hover:border-[#c5a880] text-transparent'
                          }`}
                          title={isChecked ? 'Deselect from comparison' : 'Select for comparison (max 3)'}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>

                        <div className="w-20 h-16 rounded-[2px] overflow-hidden bg-[#1f2428] shrink-0">
                          <PropertyImage
                            src={property.image}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="label-caps text-[#c5a880] text-[9px] block truncate">
                            {property.location}
                          </span>
                          <h4
                            onClick={() => {
                              onSelectProperty(property);
                              onClose();
                            }}
                            className="font-editorial text-base font-medium text-[#1f2428] hover:text-[#735c00] cursor-pointer truncate"
                          >
                            {property.title}
                          </h4>
                          <div className="font-semibold text-sm text-[#1f2428] tabular-nums">
                            {formatPrice(property.priceAED, currency)}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onRemove(property.id);
                            setSelectedForComparison((prev) => prev.filter((id) => id !== property.id));
                          }}
                          className="p-2 text-[#75777a] hover:text-[#ba1a1a] transition-colors"
                          title="Remove from shortlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Comparative Specs Strip */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#c5a880]/15 text-[11px] text-[#44474a]">
                        <div>
                          <span className="text-[9px] text-[#75777a] block uppercase">Area</span>
                          <span className="font-medium text-[#1f2428]">
                            {formatArea(property.areaSqFt, areaUnit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#75777a] block uppercase">Bedrooms</span>
                          <span className="font-medium text-[#1f2428]">{property.bedrooms} Suites</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#75777a] block uppercase">Yield</span>
                          <span className="font-semibold text-[#5a1645]">{property.projectedYield}</span>
                        </div>
                      </div>

                      <div className="pt-1 flex gap-2">
                        <button
                          onClick={() => {
                            onSelectProperty(property);
                            onClose();
                          }}
                          className="flex-1 py-1.5 bg-[#faf9f7] hover:bg-[#f4f3f1] text-[#1f2428] rounded-[2px] border border-[#c5a880]/30 text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Monograph</span>
                        </button>

                        <button
                          onClick={() => toggleSelectForComparison(property.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] border transition-colors flex items-center gap-1 ${
                            isChecked
                              ? 'bg-[#1f2428] text-[#c5a880] border-[#1f2428]'
                              : 'bg-white text-[#75777a] border-[#c5a880]/30 hover:border-[#c5a880]'
                          }`}
                        >
                          <Scale className="w-3 h-3" />
                          <span>{isChecked ? 'In Compare' : 'Compare'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Action Strip */}
          {savedProperties.length > 0 && !requestedJointDossier && (
            <div className="p-6 bg-white border-t border-[#c5a880]/30 space-y-3 shrink-0">
              {/* Total Shortlist Valuation */}
              <div className="flex items-center justify-between pb-2 border-b border-[#c5a880]/15 text-xs">
                <span className="text-[#75777a] font-medium">{t.shortlist.aggregateValue} ({currency}):</span>
                <span className="font-editorial text-base font-semibold text-[#1f2428] tabular-nums">
                  {formatPrice(savedProperties.reduce((sum, p) => sum + p.priceAED, 0), currency)}
                </span>
              </div>

              <button
                onClick={handleLaunchComparison}
                disabled={selectedForComparison.length === 0}
                className="w-full py-3.5 bg-[#1f2428] hover:bg-[#121517] disabled:opacity-50 text-[#c5a880] text-xs font-semibold tracking-[0.14em] uppercase rounded-[3px] border border-[#c5a880]/40 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scale className="w-4 h-4 text-[#c5a880]" />
                <span>
                  {t.shortlist.compareBtn} ({selectedForComparison.length}/3)
                </span>
              </button>

              <button
                onClick={() => setRequestedJointDossier(true)}
                className="w-full py-2.5 bg-[#faf9f7] hover:bg-[#efeeec] text-[#1f2428] text-xs font-semibold tracking-wider uppercase rounded-[3px] border border-[#c5a880]/30 transition-colors cursor-pointer"
              >
                {t.shortlist.requestJointBtn}
              </button>

              <p className="text-[10px] text-center text-[#75777a]">
                {t.shortlist.complianceNote}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
