import React, { useEffect, useState } from 'react';
import { Property, Currency, AreaUnit } from '../types';
import { formatPrice, formatFullPrice, formatArea } from '../data/properties';
import { useLanguage } from '../context/LanguageContext';
import {
  normalizePropertyImageUrl,
  PROPERTY_IMAGE_FALLBACK
} from '../lib/propertyImage';
import { PropertyImage } from './PropertyImage';
import {
  X,
  Bookmark,
  Share2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Building,
  Maximize2,
  Compass,
  FileCheck,
  RotateCw,
  Move,
  Layers,
  Sparkles,
  Eye,
  Camera
} from 'lucide-react';

interface MonographModalProps {
  property: Property;
  currency: Currency;
  areaUnit: AreaUnit;
  isSaved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}

export const MonographModal: React.FC<MonographModalProps> = ({
  property,
  currency,
  areaUnit,
  isSaved,
  onToggleSave,
  onClose
}) => {
  const { t, language } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVirtualTourActive, setIsVirtualTourActive] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [virtualTourPan, setVirtualTourPan] = useState(0);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [patronType, setPatronType] = useState('Private Principal / HNWI');
  const [requireNda, setRequireNda] = useState(true);

  const virtualTourRenderPath = '/assets/images/virtual_tour_3d_render_1793287878016.jpg';

  const hotspots = [
    {
      id: 'hearth',
      title: 'Sunken Conversation Lounge & Fireplace',
      detail: 'Curved Italian cashmere seating set into a fluted travertine sunken pit with integrated bioethanol linear flame.',
      x: 50,
      y: 72
    },
    {
      id: 'glazing',
      title: 'Double-Height Panorama Glazing',
      detail: '8.4m structural Schuco triple-laminated acoustic curtain wall framing Dubai Marina and Arabian Gulf.',
      x: 74,
      y: 40
    },
    {
      id: 'mezzanine',
      title: 'Upper Master Mezzanine & Art Gallery',
      detail: 'Cantilevered private suite floor with frameless structural balustrade and integrated museum track lighting.',
      x: 34,
      y: 30
    },
    {
      id: 'staircase',
      title: 'Cantilevered Calacatta Marble Staircase',
      detail: 'Individually tension-anchored marble tread volumes with hidden perimeter LED warm grazing illumination.',
      x: 12,
      y: 56
    }
  ];

  const images = (property.gallery && property.gallery.length > 0 ? property.gallery : [property.image])
    .map(normalizePropertyImageUrl);
  const hasVerifiedVisualAssets =
    property.id.startsWith('res-') &&
    images.some((image) => image !== PROPERTY_IMAGE_FALLBACK);

  useEffect(() => {
    setIsVirtualTourActive(false);
    setActiveImageIndex(0);
    setActiveHotspot(null);
  }, [property.id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { crmService } = await import('../services/crmService');
      await crmService.createEnquiry({
        propertyId: property.id,
        propertyTitle: property.title,
        customerName: fullName,
        email,
        phone,
        preferredCallbackTime: 'Morning GST',
        budgetTier: `${property.priceAED.toLocaleString()} AED`,
        advisoryScope: patronType,
        message: `Dossier & Private Viewing requested for ${property.title}. Patron Type: ${patronType}. Bilateral NDA: ${requireNda ? 'Executed' : 'Declined'}.`,
        status: 'Received'
      });
      setFormSubmitted(true);
    } catch (err) {
      console.error('Failed submitting monograph booking enquiry:', err);
      setFormSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-5xl bg-[#faf9f7] rounded-[4px] border border-[#c5a880]/50 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="bg-[#1f2428] text-white px-6 py-4 flex items-center justify-between border-b border-[#c5a880]/30">
          <div className="flex items-center gap-3">
            <span className="label-caps text-[#c5a880] text-[10px]">{t.modal.monographTag}</span>
            <span className="text-[#dadad8]/40">·</span>
            <span className="text-xs text-[#dadad8]">{property.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSave}
              className={`p-2 rounded-[2px] border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSaved ? 'bg-[#5a1645] text-white border-[#d4af37]' : 'border-white/20 text-[#dadad8] hover:text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? t.modal.saved : t.modal.save}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#dadad8] hover:text-white hover:bg-white/10 rounded-[2px] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="max-h-[82vh] overflow-y-auto p-6 sm:p-10 space-y-10">
          
          {/* Main Visual Showcase with Virtual Tour 3D Viewport & Gallery Thumbnails */}
          <div>
            <div className="relative aspect-[16/9] w-full rounded-[3px] overflow-hidden bg-[#121517] border border-[#c5a880]/30 mb-3 group select-none shadow-xl">
              
              {isVirtualTourActive && hasVerifiedVisualAssets ? (
                /* 3D Architectural Virtual Tour Viewport */
                <div className="relative w-full h-full overflow-hidden">
                  
                  {/* High-Fidelity 3D Architectural Render */}
                  <img
                    src={virtualTourRenderPath}
                    alt="3D Architectural Virtual Tour Walkthrough Render"
                    referrerPolicy="no-referrer"
                    style={{
                      transform: `scale(1.08) translateX(${virtualTourPan}%)`,
                      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className="w-full h-full object-cover filter brightness-[0.96]"
                  />

                  {/* Scrim Vignette for Depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Tour HUD Bar */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-auto">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5a1645]/90 text-[#ffe088] text-[10px] font-semibold tracking-widest uppercase rounded-[2px] border border-[#d4af37]/50 shadow-md backdrop-blur-md">
                        <RotateCw className="w-3 h-3 text-[#d4af37] animate-spin" style={{ animationDuration: '8s' }} />
                        <span>3D Virtual Tour Walkthrough</span>
                      </span>
                      <span className="hidden sm:inline-block px-2 py-1 bg-[#121517]/80 text-[#c5a880] text-[10px] font-mono tracking-wider rounded-[2px] border border-[#c5a880]/30 backdrop-blur-md">
                        Unreal Engine 5 Real-Time Architectural Render
                      </span>
                    </div>

                    <button
                      onClick={() => setIsVirtualTourActive(false)}
                      className="px-3 py-1 bg-white/90 hover:bg-white text-[#1f2428] text-xs font-semibold tracking-wider uppercase rounded-[2px] border border-[#c5a880]/50 shadow-md flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#5a1645]" />
                      <span>Return to Photos</span>
                    </button>
                  </div>

                  {/* Interactive Spatial Hotspots */}
                  {hotspots.map((spot) => {
                    const isActive = activeHotspot === spot.id;

                    return (
                      <div
                        key={spot.id}
                        style={{
                          left: `${spot.x}%`,
                          top: `${spot.y}%`
                        }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-30"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveHotspot(isActive ? null : spot.id)}
                          className="relative group/pin flex items-center justify-center cursor-pointer"
                          aria-label={spot.title}
                        >
                          <span className="absolute -inset-2 rounded-full bg-[#c5a880]/40 animate-ping" />
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border shadow-xl transition-all ${
                            isActive
                              ? 'bg-[#5a1645] border-[#d4af37] text-white scale-110'
                              : 'bg-[#1f2428]/90 border-[#c5a880] text-[#c5a880] hover:scale-110'
                          }`}>
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </button>

                        {/* Hotspot Floating Detail Callout */}
                        {isActive && (
                          <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-64 bg-[#1f2428]/95 backdrop-blur-xl border border-[#c5a880]/60 p-3 rounded-[3px] text-white shadow-2xl text-left animate-fadeIn z-40">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="label-caps text-[#c5a880] text-[9px]">Hotspot Architectural Insight</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveHotspot(null);
                                }}
                                className="text-white/60 hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <h5 className="font-editorial text-sm font-medium text-white mb-1">
                              {spot.title}
                            </h5>
                            <p className="text-[11px] text-[#dadad8] font-light leading-relaxed">
                              {spot.detail}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Bottom Tour Controls Bar */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
                    {/* Pan Navigation Buttons */}
                    <div className="flex items-center gap-1.5 bg-[#121517]/85 backdrop-blur-md p-1 rounded-[3px] border border-[#c5a880]/30 text-white text-xs">
                      <button
                        onClick={() => setVirtualTourPan((prev) => Math.min(prev + 5, 12))}
                        className="px-2.5 py-1 hover:bg-white/10 rounded-[2px] text-[11px] font-semibold text-[#c5a880] flex items-center gap-1 cursor-pointer"
                        title={t.modal.panLeft}
                      >
                        <span>{t.modal.panLeft}</span>
                      </button>
                      <button
                        onClick={() => setVirtualTourPan(0)}
                        className="px-2 py-1 hover:bg-white/10 rounded-[2px] text-[10px] text-[#dadad8] cursor-pointer"
                        title={t.modal.resetPan}
                      >
                        {t.modal.resetPan}
                      </button>
                      <button
                        onClick={() => setVirtualTourPan((prev) => Math.max(prev - 5, -12))}
                        className="px-2.5 py-1 hover:bg-white/10 rounded-[2px] text-[11px] font-semibold text-[#c5a880] flex items-center gap-1 cursor-pointer"
                        title={t.modal.panRight}
                      >
                        <span>{t.modal.panRight}</span>
                      </button>
                    </div>

                    {/* Spatial Status Label */}
                    <div className="hidden sm:flex items-center gap-2 bg-[#121517]/85 backdrop-blur-md px-3 py-1.5 rounded-[3px] border border-[#c5a880]/30 text-[10px] text-[#dadad8] font-mono tabular-nums">
                      <Compass className="w-3 h-3 text-[#c5a880]" />
                      <span>{t.modal.unrealEngineTag}</span>
                    </div>
                  </div>

                </div>
              ) : (
                /* Still Photo View with Virtual Tour Entry Button */
                <>
                  <PropertyImage
                    src={images[activeImageIndex]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                  />

                  {property.isIllustrativeImages && (
                    <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-[#121517]/90 text-white text-[9px] font-bold tracking-[0.16em] uppercase rounded-[2px] border border-[#c5a880]/40">
                      Illustrative Demo Images
                    </div>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex((activeImageIndex - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 px-3 py-2 bg-[#121517]/80 text-[#c5a880] border border-[#c5a880]/40 rounded-[2px] text-xs"
                        aria-label="Previous image"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex((activeImageIndex + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 px-3 py-2 bg-[#121517]/80 text-[#c5a880] border border-[#c5a880]/40 rounded-[2px] text-xs"
                        aria-label="Next image"
                      >
                        Next
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsImageFullscreen(true)}
                    className="absolute bottom-4 right-4 z-20 p-2.5 bg-[#121517]/90 text-[#c5a880] border border-[#c5a880]/50 rounded-[2px] hover:bg-[#1f2428]"
                    aria-label="View full-size image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Left Typology Chip */}
                  <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                    <span className="px-3 py-1 bg-[#1f2428]/90 text-[#c5a880] text-[10px] font-semibold tracking-widest uppercase rounded-[2px] border border-[#c5a880]/40 backdrop-blur-sm">
                      {property.type}
                    </span>
                  </div>

                  {/* Virtual tours are only available for matched local editorial properties. */}
                  {hasVerifiedVisualAssets && (
                    <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
                      <button
                        type="button"
                        onClick={() => setIsVirtualTourActive(true)}
                        className="px-4 py-2 bg-[#1f2428]/95 hover:bg-[#121517] text-[#c5a880] hover:text-[#ffe088] rounded-[3px] border border-[#c5a880]/60 hover:border-[#c5a880] backdrop-blur-md shadow-xl flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase transition-all group/btn cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#c5a880] group-hover/btn:rotate-180 transition-transform duration-500" />
                        <span>{t.modal.virtualTourBtn}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Gallery Thumbnail Strip with Virtual Tour 3D Launcher Card */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              
              {/* Virtual Tour 3D Dedicated Thumbnail */}
              {hasVerifiedVisualAssets && (
                <button
                  type="button"
                  onClick={() => setIsVirtualTourActive(true)}
                  className={`relative w-28 h-16 rounded-[2px] overflow-hidden shrink-0 border transition-all flex flex-col justify-end p-1.5 ${
                    isVirtualTourActive
                      ? 'border-[#c5a880] ring-2 ring-[#c5a880] shadow-md'
                      : 'border-[#c5a880]/40 opacity-80 hover:opacity-100 hover:border-[#c5a880]'
                  }`}
                >
                  <img
                    src={virtualTourRenderPath}
                    alt="3D Virtual Tour Thumbnail"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75]"
                  />
                  <div className="relative z-10 flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase text-[#ffe088]">
                    <RotateCw className="w-2.5 h-2.5" />
                    <span>3D Tour</span>
                  </div>
                </button>
              )}

              {/* Still Photo Thumbnails */}
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsVirtualTourActive(false);
                    setActiveImageIndex(idx);
                  }}
                  className={`relative w-24 h-16 rounded-[2px] overflow-hidden shrink-0 border transition-all ${
                    !isVirtualTourActive && activeImageIndex === idx
                      ? 'border-[#c5a880] ring-1 ring-[#c5a880]'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <PropertyImage src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}

            </div>
          </div>

          {/* Title & Valuation Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-[#c5a880]/20">
            <div className="max-w-2xl">
              <div className="text-xs text-[#75777a] font-medium mb-1">
                {property.address}
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#1f2428] mb-3 [text-wrap:balance]">
                {property.title}
              </h2>
              <p className="text-sm sm:text-base text-[#44474a] font-light leading-relaxed">
                {property.tagline}
              </p>
            </div>

            <div className="bg-white p-5 rounded-[4px] border border-[#c5a880]/30 shadow-sm shrink-0 min-w-[240px]">
              <span className="label-caps text-[#75777a] text-[10px] block mb-1">
                Confidential Valuation
              </span>
              <div className="font-editorial text-3xl font-semibold text-[#1f2428] tabular-nums">
                {formatPrice(property.priceAED, currency)}
              </div>
              <div className="text-xs text-[#75777a] mt-1 font-mono tabular-nums">
                {formatFullPrice(property.priceAED, currency)}
              </div>
              <div className="mt-3 pt-3 border-t border-[#c5a880]/15 text-[11px] text-[#5a1645] font-semibold">
                Est. Net Yield: {property.projectedYield}
              </div>
            </div>
          </div>

          {/* Technical Specifications Matrix */}
          <div>
            <h3 className="label-caps text-[#735c00] text-xs mb-4">
              Architectural Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-[3px] border border-[#c5a880]/20">
                <span className="text-[10px] label-caps text-[#75777a] block mb-1">Internal Living Area</span>
                <span className="font-editorial text-xl font-medium text-[#1f2428] tabular-nums">
                  {formatArea(property.areaSqFt, areaUnit)}
                </span>
              </div>

              {property.plotSqFt && (
                <div className="p-4 bg-white rounded-[3px] border border-[#c5a880]/20">
                  <span className="text-[10px] label-caps text-[#75777a] block mb-1">Private Plot Area</span>
                  <span className="font-editorial text-xl font-medium text-[#1f2428] tabular-nums">
                    {formatArea(property.plotSqFt, areaUnit)}
                  </span>
                </div>
              )}

              <div className="p-4 bg-white rounded-[3px] border border-[#c5a880]/20">
                <span className="text-[10px] label-caps text-[#75777a] block mb-1">Bedrooms & Suites</span>
                <span className="font-editorial text-xl font-medium text-[#1f2428] tabular-nums">
                  {property.bedrooms} Suites ({property.bathrooms} Baths)
                </span>
              </div>

              <div className="p-4 bg-white rounded-[3px] border border-[#c5a880]/20">
                <span className="text-[10px] label-caps text-[#75777a] block mb-1">Ceiling Volumes</span>
                <span className="font-editorial text-xl font-medium text-[#1f2428]">
                  {property.ceilingHeight}
                </span>
              </div>

              <div className="p-4 bg-white rounded-[3px] border border-[#c5a880]/20">
                <span className="text-[10px] label-caps text-[#75777a] block mb-1">Master Architect</span>
                <span className="font-editorial text-base font-medium text-[#1f2428] truncate block">
                  {property.architect}
                </span>
              </div>

              <div className="p-4 bg-white rounded-[3px] border border-[#c5a880]/20">
                <span className="text-[10px] label-caps text-[#75777a] block mb-1">Handover Readiness</span>
                <span className="font-editorial text-base font-medium text-[#1f2428]">
                  {property.handover}
                </span>
              </div>

              <div className="p-4 bg-white rounded-[3px] border border-[#c5a880]/20">
                <span className="text-[10px] label-caps text-[#75777a] block mb-1">Primary Horizon</span>
                <span className="font-editorial text-base font-medium text-[#1f2428] truncate block">
                  {property.viewType}
                </span>
              </div>

              <div className="p-4 bg-white rounded-[3px] border border-[#c5a880]/20">
                <span className="text-[10px] label-caps text-[#75777a] block mb-1">Year Commissioned</span>
                <span className="font-editorial text-xl font-medium text-[#1f2428] tabular-nums">
                  {property.yearBuilt}
                </span>
              </div>
            </div>
          </div>

          {/* Architectural Narrative */}
          <div className="prose max-w-none text-[#44474a] font-light leading-relaxed">
            <h3 className="font-editorial text-2xl font-medium text-[#1f2428] mb-3">
              Curator’s Architectural Narrative
            </h3>
            <p className="text-sm sm:text-base leading-relaxed mb-4">
              {property.description}
            </p>
            <p className="text-sm sm:text-base leading-relaxed">
              Every fixture and bespoke joinery detail has been engineered with discreet acoustic dampening, custom Lutron Homeworks QS architectural lighting scenes, and biometric access controls meeting sovereign diplomatic protocols.
            </p>
          </div>

          {/* Bespoke Amenities Checklist */}
          <div>
            <h3 className="label-caps text-[#735c00] text-xs mb-4">
              Signature Estate Amenities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {property.amenities.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-white rounded-[3px] border border-[#c5a880]/20 text-xs text-[#1f2428]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#c5a880] shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Request Private Viewing & Confidential Dossier Form */}
          <div className="bg-[#1f2428] text-white p-6 sm:p-8 rounded-[4px] border border-[#c5a880]/40">
            {formSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#5a1645] border border-[#d4af37] text-[#ffd8eb] mx-auto flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h4 className="font-editorial text-2xl font-medium text-white">
                  Dossier Access Token Dispatched
                </h4>
                <p className="text-sm text-[#dadad8] max-w-lg mx-auto font-light leading-relaxed">
                  Thank you, <span className="text-[#ffe088] font-medium">{fullName}</span>. Your private broker briefing request for <span className="text-white italic">{property.title}</span> has been routed to our DIFC Sovereign Counter. An encrypted dossier link will arrive at {email} within 2 business hours.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="px-6 py-2 border border-[#c5a880]/40 text-[#c5a880] text-xs font-semibold tracking-wider uppercase rounded-[2px] hover:bg-white/10"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#c5a880] mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>Private Counter Inscription</span>
                  </div>
                  <h4 className="font-editorial text-2xl font-medium text-white">
                    Request Confidential Dossier & Private Viewing
                  </h4>
                  <p className="text-xs text-[#dadad8] font-light mt-1">
                    Full floorplans, financial pro-formas, and title deeds are reserved for verified patrons.
                  </p>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block label-caps text-[10px] text-[#c5a880] mb-1">
                        Principal Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lord Alistair Sterling"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#121517] rounded-[2px] border border-[#c5a880]/30 text-white placeholder-white/30 focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>

                    <div>
                      <label className="block label-caps text-[10px] text-[#c5a880] mb-1">
                        Direct Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="principal@familyoffice.ch"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#121517] rounded-[2px] border border-[#c5a880]/30 text-white placeholder-white/30 focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block label-caps text-[10px] text-[#c5a880] mb-1">
                        Secure Phone / Signal *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+971 50 ... / +44 79 ..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#121517] rounded-[2px] border border-[#c5a880]/30 text-white placeholder-white/30 focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>

                    <div>
                      <label className="block label-caps text-[10px] text-[#c5a880] mb-1">
                        Patron Representation
                      </label>
                      <select
                        value={patronType}
                        onChange={(e) => setPatronType(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#121517] rounded-[2px] border border-[#c5a880]/30 text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Private Principal / HNWI">Private Principal / HNWI</option>
                        <option value="Single Family Office (SFO)">Single Family Office (SFO)</option>
                        <option value="Institutional Wealth Desk">Institutional Wealth Desk</option>
                        <option value="Diplomatic Retinue">Diplomatic Retinue</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="requireNda"
                      checked={requireNda}
                      onChange={(e) => setRequireNda(e.target.checked)}
                      className="w-4 h-4 accent-[#c5a880] rounded-[2px]"
                    />
                    <label htmlFor="requireNda" className="text-[11px] text-[#dadad8] cursor-pointer">
                      Execute bilateral standard DIFC NDA prior to sharing property floor plans and cadastral coordinates.
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#c5a880] hover:bg-[#e9dac1] text-[#121517] text-xs font-semibold tracking-[0.14em] uppercase rounded-[2px] transition-colors shadow-lg font-sans"
                    >
                      Transmit Briefing Request
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>

      </div>
      {isImageFullscreen && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setIsImageFullscreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full-size property image"
        >
          <button
            type="button"
            onClick={() => setIsImageFullscreen(false)}
            className="absolute top-4 right-4 p-2 text-white border border-white/30 rounded-[2px] bg-black/40"
            aria-label="Close full-size image"
          >
            <X className="w-5 h-5" />
          </button>
          <PropertyImage
            src={images[activeImageIndex]}
            alt={property.title}
            eager
            className="max-w-full max-h-[calc(100vh-4rem)] w-full h-full object-contain"
          />
          {property.isIllustrativeImages && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 text-white text-[10px] font-bold tracking-[0.16em] uppercase rounded-[2px] border border-[#c5a880]/40">
              Illustrative Demo Images
            </div>
          )}
        </div>
      )}
    </div>
  );
};
