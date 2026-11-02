import React, { useState } from 'react';
import { Property, Currency, AreaUnit } from '../types';
import { formatPrice, formatFullPrice, formatArea } from '../data/properties';
import { useLanguage } from '../context/LanguageContext';
import { PropertyImage } from './PropertyImage';
import {
  X,
  Plus,
  Trash2,
  Eye,
  Check,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Download,
  Building2
} from 'lucide-react';

interface PropertyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProperties: Property[];
  allShortlistProperties: Property[];
  onToggleSelectProperty: (property: Property) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  areaUnit: AreaUnit;
  onAreaUnitChange: (u: AreaUnit) => void;
  onSelectProperty: (property: Property) => void;
  onOpenConsultation: (propertyTitle?: string) => void;
}

export const PropertyComparisonModal: React.FC<PropertyComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedProperties,
  allShortlistProperties,
  onToggleSelectProperty,
  currency,
  onCurrencyChange,
  areaUnit,
  onAreaUnitChange,
  onSelectProperty,
  onOpenConsultation
}) => {
  const { t, language } = useLanguage();
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Available shortlist properties that are not yet selected for comparison
  const availableToAdd = allShortlistProperties.filter(
    (p) => !selectedProperties.some((sel) => sel.id === p.id)
  );

  const handleDownloadDossier = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-6xl bg-[#faf9f7] rounded-[4px] border border-[#c5a880]/50 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-[#1f2428] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c5a880]/30 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#c5a880]" />
              <span className="label-caps text-[#c5a880] text-[10px]">{t.comparison.matrixTag}</span>
            </div>
            <h2 className="font-editorial text-2xl font-medium text-white tracking-tight mt-0.5">
              {t.comparison.title} ({selectedProperties.length}/3 {language === 'ar' ? 'محدد' : 'Selected'})
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Units & Currency Toggles */}
            <div className="flex items-center gap-2">
              <div className="border border-[#c5a880]/30 rounded-[2px] bg-[#121517] p-0.5 text-xs flex">
                <button
                  onClick={() => onAreaUnitChange('sqft')}
                  className={`px-2 py-0.5 rounded-[1px] transition-colors ${
                    areaUnit === 'sqft' ? 'bg-[#c5a880] text-[#121517] font-semibold' : 'text-[#dadad8]'
                  }`}
                >
                  sq.ft
                </button>
                <button
                  onClick={() => onAreaUnitChange('sqm')}
                  className={`px-2 py-0.5 rounded-[1px] transition-colors ${
                    areaUnit === 'sqm' ? 'bg-[#c5a880] text-[#121517] font-semibold' : 'text-[#dadad8]'
                  }`}
                >
                  sq.m
                </button>
              </div>

              <div className="border border-[#c5a880]/30 rounded-[2px] bg-[#121517] px-2 py-1 text-xs text-white">
                <select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value as Currency)}
                  className="bg-transparent text-xs font-semibold text-[#e9dac1] focus:outline-none cursor-pointer"
                  aria-label="Currency"
                >
                  <option value="AED" className="bg-[#1f2428]">AED</option>
                  <option value="USD" className="bg-[#1f2428]">USD</option>
                  <option value="EUR" className="bg-[#1f2428]">EUR</option>
                  <option value="GBP" className="bg-[#1f2428]">GBP</option>
                  <option value="CHF" className="bg-[#1f2428]">CHF</option>
                </select>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#dadad8] hover:text-white hover:bg-white/10 rounded-[2px] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Bar: Difference Highlight & Quick Add Selector */}
        <div className="bg-[#efeeec] px-6 py-2.5 border-b border-[#c5a880]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-[#44474a] font-medium">
              <input
                type="checkbox"
                checked={highlightDifferences}
                onChange={(e) => setHighlightDifferences(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#5a1645] rounded-[2px]"
              />
              <span>Accentuate Metric Differentials</span>
            </label>

            {selectedProperties.length < 3 && availableToAdd.length > 0 && (
              <span className="text-[#75777a] hidden md:inline">
                · You can add {3 - selectedProperties.length} more residence{3 - selectedProperties.length > 1 ? 's' : ''} from your shortlist
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Add from shortlist dropdown if under 3 */}
            {selectedProperties.length < 3 && availableToAdd.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="label-caps text-[#75777a] text-[9px]">Add:</span>
                <select
                  onChange={(e) => {
                    const found = availableToAdd.find((p) => p.id === e.target.value);
                    if (found) onToggleSelectProperty(found);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="bg-white border border-[#c5a880]/40 rounded-[2px] px-2 py-1 text-xs text-[#1f2428] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>Select from Shortlist...</option>
                  {availableToAdd.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.location})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleDownloadDossier}
              className="inline-flex items-center gap-1.5 text-xs text-[#1f2428] hover:text-[#735c00] font-semibold py-1 px-2 border border-[#c5a880]/30 rounded-[2px] bg-white transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>{downloadSuccess ? 'Dossier Exported!' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Comparison Table Body */}
        <div className="flex-1 overflow-auto p-6">
          {selectedProperties.length === 0 ? (
            <div className="text-center py-20 text-[#75777a]">
              <Scale className="w-12 h-12 text-[#c5a880] mx-auto mb-3 opacity-60" />
              <h3 className="font-editorial text-2xl font-medium text-[#1f2428] mb-2">
                No Residences Selected for Comparison
              </h3>
              <p className="text-sm text-[#75777a] max-w-md mx-auto mb-6">
                Select between 2 and 3 properties from your saved shortlist to evaluate their architectural specifications, investment metrics, and floor areas side-by-side.
              </p>
              {allShortlistProperties.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                  {allShortlistProperties.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onToggleSelectProperty(p)}
                      className="px-3 py-1.5 bg-white border border-[#c5a880]/40 rounded-[2px] text-xs font-semibold text-[#1f2428] hover:border-[#c5a880] transition-colors"
                    >
                      + Add {p.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-[#c5a880]/25 rounded-[3px] bg-white shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed">
                
                {/* Table Header: Property Showcase Cards */}
                <thead>
                  <tr className="bg-[#faf9f7] border-b border-[#c5a880]/20">
                    <th className="w-48 p-4 label-caps text-[#75777a] text-[10px] align-top">
                      Metric / Residence
                    </th>

                    {selectedProperties.map((property) => (
                      <th key={property.id} className="p-4 align-top border-l border-[#c5a880]/20">
                        <div className="relative group space-y-2">
                          
                          {/* Remove button */}
                          <button
                            onClick={() => onToggleSelectProperty(property)}
                            className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-white/90 border border-[#c5a880]/40 text-[#75777a] hover:text-[#ba1a1a] hover:border-[#ba1a1a] flex items-center justify-center transition-colors shadow-sm"
                            title="Remove from comparison"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* 16:9 Image Preview */}
                          <div className="relative aspect-[16/9] w-full rounded-[2px] overflow-hidden bg-[#1f2428] border border-[#c5a880]/20">
                            <PropertyImage
                              src={property.image}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 text-[8px] font-semibold tracking-wider uppercase bg-[#1f2428]/85 text-[#c5a880] rounded-[1px]">
                              {property.type}
                            </div>
                          </div>

                          <div>
                            <span className="label-caps text-[#c5a880] text-[9px] block">
                              {property.location}
                            </span>
                            <h3 className="font-editorial text-base sm:text-lg font-medium text-[#1f2428] leading-snug line-clamp-2">
                              {property.title}
                            </h3>
                          </div>

                          <div className="pt-1 flex gap-2">
                            <button
                              onClick={() => {
                                onSelectProperty(property);
                                onClose();
                              }}
                              className="w-full py-1.5 bg-[#1f2428] hover:bg-[#121517] text-[#c5a880] text-[10px] font-semibold tracking-wider uppercase rounded-[2px] border border-[#c5a880]/40 flex items-center justify-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Monograph</span>
                            </button>
                          </div>

                        </div>
                      </th>
                    ))}

                    {/* Placeholder Slot for 2nd or 3rd Property */}
                    {selectedProperties.length < 3 && (
                      <th className="p-4 align-middle border-l border-[#c5a880]/20 bg-[#f4f3f1]/50 text-center">
                        <div className="py-12 px-4 space-y-3">
                          <div className="w-10 h-10 rounded-full border border-dashed border-[#c5a880] text-[#c5a880] mx-auto flex items-center justify-center">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div className="label-caps text-[#75777a] text-[10px]">
                            Slot Available ({3 - selectedProperties.length} Remaining)
                          </div>
                          {availableToAdd.length > 0 ? (
                            <select
                              onChange={(e) => {
                                const found = availableToAdd.find((p) => p.id === e.target.value);
                                if (found) onToggleSelectProperty(found);
                                e.target.value = '';
                              }}
                              defaultValue=""
                              className="bg-white border border-[#c5a880]/40 rounded-[2px] px-2.5 py-1.5 text-xs text-[#1f2428] font-semibold cursor-pointer max-w-full"
                            >
                              <option value="" disabled>+ Add Residence...</option>
                              {availableToAdd.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.title}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-[11px] text-[#75777a] font-light">
                              Add more properties to your shortlist to compare.
                            </p>
                          )}
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>

                {/* Table Rows for Metric Comparison */}
                <tbody className="divide-y divide-[#c5a880]/15 text-xs text-[#1a1c1b]">
                  
                  {/* Row: Asking Valuation (Key Metric 1) */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Asking Valuation
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15">
                        <div className="font-editorial text-xl font-semibold text-[#1f2428] tabular-nums">
                          {formatPrice(p.priceAED, currency)}
                        </div>
                        <div className="text-[11px] text-[#75777a] font-mono tabular-nums">
                          {formatFullPrice(p.priceAED, currency)}
                        </div>
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Square Footage / Internal Area (Key Metric 2) */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Living Area ({areaUnit})
                    </td>
                    {selectedProperties.map((p) => {
                      const isMaxArea = Math.max(...selectedProperties.map(s => s.areaSqFt)) === p.areaSqFt;
                      return (
                        <td
                          key={p.id}
                          className={`p-4 border-l border-[#c5a880]/15 ${
                            highlightDifferences && isMaxArea ? 'bg-[#fed65b]/10' : ''
                          }`}
                        >
                          <div className="font-editorial text-lg font-medium text-[#1f2428] tabular-nums">
                            {formatArea(p.areaSqFt, areaUnit)}
                          </div>
                          {highlightDifferences && isMaxArea && selectedProperties.length > 1 && (
                            <span className="label-caps text-[#735c00] text-[9px] block mt-0.5">
                              Largest Interior
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Private Plot Area */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Plot Area
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15 tabular-nums text-[#44474a]">
                        {p.plotSqFt ? formatArea(p.plotSqFt, areaUnit) : 'Sky Residence (N/A)'}
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Location & Address (Key Metric 3) */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Enclave & Location
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15">
                        <div className="font-semibold text-[#1f2428]">{p.location}</div>
                        <div className="text-[11px] text-[#75777a] font-light mt-0.5 line-clamp-2">
                          {p.address}
                        </div>
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Suites & Baths */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Bedrooms & Baths
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15 text-[#44474a]">
                        <span className="font-semibold text-[#1f2428]">{p.bedrooms} Suites</span> · {p.bathrooms} Bathrooms
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Price Per Sq.Ft */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Valuation Rate
                    </td>
                    {selectedProperties.map((p) => {
                      const rate = p.pricePerSqFtAED;
                      return (
                        <td key={p.id} className="p-4 border-l border-[#c5a880]/15 font-mono tabular-nums text-[#44474a]">
                          AED {rate.toLocaleString()} / sq.ft
                        </td>
                      );
                    })}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Net Annualized Yield */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Projected Net Yield
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15 font-semibold text-[#5a1645] tabular-nums">
                        {p.projectedYield}
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Primary Panorama View */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Primary Panorama
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15 text-[#44474a]">
                        {p.viewType}
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Master Architect */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Master Architect
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15 font-medium text-[#1f2428]">
                        {p.architect}
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Handover Timeline */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Handover Readiness
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15 text-[#1f2428]">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#f4f3f1] border border-[#c5a880]/20 text-[11px] font-medium">
                          {p.handover}
                        </span>
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Discretion Tier */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Acquisition Status
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15">
                        {p.status === 'Off-Market Confidential' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase bg-[#5a1645] text-[#ffe088] rounded-[2px]">
                            <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
                            <span>Off-Market Vault</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase bg-[#1f2428] text-[#c5a880] rounded-[2px]">
                            {p.status}
                          </span>
                        )}
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Row: Key Amenities */}
                  <tr className="hover:bg-[#faf9f7] transition-colors">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40 align-top">
                      Signature Amenities
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15 align-top">
                        <ul className="space-y-1.5 text-[11px] text-[#44474a]">
                          {p.amenities.slice(0, 4).map((amenity, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#c5a880] mt-0.5">•</span>
                              <span>{amenity}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                  {/* Action Row */}
                  <tr className="bg-[#faf9f7]">
                    <td className="p-4 font-semibold text-[#1f2428] bg-[#f4f3f1]/40">
                      Private Mandate
                    </td>
                    {selectedProperties.map((p) => (
                      <td key={p.id} className="p-4 border-l border-[#c5a880]/15">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenConsultation(p.title);
                          }}
                          className="w-full py-2 bg-[#c5a880] hover:bg-[#e9dac1] text-[#121517] text-xs font-semibold tracking-wider uppercase rounded-[2px] transition-colors shadow-sm"
                        >
                          Request Briefing
                        </button>
                      </td>
                    ))}
                    {selectedProperties.length < 3 && <td className="p-4 border-l border-[#c5a880]/15 bg-[#faf9f7]/40" />}
                  </tr>

                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#1f2428] text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#c5a880]/30 shrink-0 text-xs">
          <div className="text-[#dadad8] font-light">
            All metric figures extracted from official DLD cadastral registers and architectural plans.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/20 hover:border-white text-white rounded-[2px] transition-colors cursor-pointer"
            >
              {t.comparison.closeBtn}
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenConsultation(`Multi-Asset Comparative Mandate (${selectedProperties.map(p => p.title).join(', ')})`);
              }}
              className="px-5 py-2 bg-[#c5a880] hover:bg-[#e9dac1] text-[#121517] font-semibold tracking-wider uppercase rounded-[2px] transition-colors cursor-pointer"
            >
              {t.comparison.requestJointBtn}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
