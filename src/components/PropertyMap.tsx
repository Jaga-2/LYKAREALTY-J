import React, { useState } from 'react';
import { Property, Currency } from '../types';
import { formatPrice } from '../data/properties';
import { Eye, MapPin, Compass, X, Sparkles, Building2 } from 'lucide-react';
import { PropertyImage } from './PropertyImage';

interface PropertyMapProps {
  properties: Property[];
  currency: Currency;
  onSelectProperty: (property: Property) => void;
  selectedPropertyId?: string;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  currency,
  onSelectProperty,
  selectedPropertyId
}) => {
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedEnclave, setSelectedEnclave] = useState<string>('All');

  // Enclave filtering on the map
  const enclaves = ['All', 'Palm Jumeirah', 'Downtown Dubai', 'Jumeirah Bay Island', 'Emirates Hills', 'DIFC'];

  const displayedProperties = selectedEnclave === 'All'
    ? properties
    : properties.filter(p => p.location === selectedEnclave);

  // The property to show in the floating card: explicitly clicked one, or hovered one
  const previewProperty = activeProperty || (hoveredPropertyId ? properties.find(p => p.id === hoveredPropertyId) : null);

  return (
    <div className="relative w-full h-[640px] bg-[#0d1013] rounded-[4px] border border-[#c5a880]/35 overflow-hidden shadow-2xl select-none flex flex-col justify-between">
      
      {/* Luxury Cartographic Background SVG */}
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        viewBox="0 0 1000 650"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="waterGrad" cx="35%" cy="35%" r="85%">
            <stop offset="0%" stopColor="#11161b" />
            <stop offset="60%" stopColor="#0b0e11" />
            <stop offset="100%" stopColor="#07090b" />
          </radialGradient>
          <pattern id="gridPattern" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(212,175,55,0.06)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a2026" />
            <stop offset="100%" stopColor="#14181c" />
          </linearGradient>
        </defs>

        {/* Deep Ocean Water Canvas */}
        <rect width="1000" height="650" fill="url(#waterGrad)" />
        <rect width="1000" height="650" fill="url(#gridPattern)" />

        {/* Dubai Coastline Landmass */}
        <path
          d="M 0,260 Q 180,275 340,320 T 680,410 T 1000,520 L 1000,650 L 0,650 Z"
          fill="url(#landGrad)"
          stroke="rgba(212,175,55,0.35)"
          strokeWidth="1.75"
        />

        {/* Coastal Depth Contours (Bathymetry) */}
        <path
          d="M 0,220 Q 180,235 340,280 T 680,370 T 1000,480"
          fill="none"
          stroke="rgba(212,175,55,0.15)"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <path
          d="M 0,180 Q 180,195 340,240 T 680,330 T 1000,440"
          fill="none"
          stroke="rgba(212,175,55,0.09)"
          strokeDasharray="6 6"
          strokeWidth="1"
        />

        {/* Palm Jumeirah Archipelago Vector Silhouette */}
        <g transform="translate(360, 230) scale(0.68)" opacity="0.9">
          {/* Outer Protective Crescent */}
          <ellipse
            cx="60"
            cy="50"
            rx="92"
            ry="76"
            fill="none"
            stroke="#c5a880"
            strokeWidth="2.5"
            strokeDasharray="180 80"
            transform="rotate(-20 60 50)"
          />
          {/* Main Trunk */}
          <path d="M 50,115 L 50,30 L 70,30 L 70,115 Z" fill="#252b31" stroke="#c5a880" strokeWidth="1.2" />
          {/* 16 Arching Fronds */}
          <path d="M 20,40 Q 60,60 100,40" fill="none" stroke="#c5a880" strokeWidth="1.4" />
          <path d="M 15,55 Q 60,75 105,55" fill="none" stroke="#c5a880" strokeWidth="1.4" />
          <path d="M 10,70 Q 60,90 110,70" fill="none" stroke="#c5a880" strokeWidth="1.4" />
          <path d="M 10,85 Q 60,105 110,85" fill="none" stroke="#c5a880" strokeWidth="1.4" />
        </g>

        {/* Jumeirah Bay Island (Seahorse Island Silhouette) */}
        <g transform="translate(500, 185) scale(0.48)" opacity="0.9">
          <path
            d="M 40,20 C 60,10 80,30 75,55 C 70,75 50,85 55,105 C 60,120 40,130 35,115 C 30,100 45,90 40,70 C 35,50 20,30 40,20 Z"
            fill="#262d34"
            stroke="#d4af37"
            strokeWidth="2"
          />
          <circle cx="55" cy="50" r="3" fill="#ffe088" />
        </g>

        {/* Downtown Dubai & Burj Khalifa District Axis */}
        <g transform="translate(640, 360)">
          <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(212,175,55,0.22)" strokeDasharray="3 3" />
          <line x1="-15" y1="0" x2="15" y2="0" stroke="rgba(212,175,55,0.45)" />
          <line x1="0" y1="-15" x2="0" y2="15" stroke="rgba(212,175,55,0.45)" />
          <text x="18" y="4" fill="#c5a880" fontSize="9" letterSpacing="0.14em" className="label-caps font-sans">
            DOWNTOWN / BURJ KHALIFA
          </text>
        </g>

        {/* Emirates Hills Championship Golf Zone */}
        <g transform="translate(290, 475)">
          <circle cx="0" cy="0" r="38" fill="none" stroke="rgba(212,175,55,0.2)" strokeDasharray="3 3" />
          <text x="14" y="4" fill="#c5a880" fontSize="9" letterSpacing="0.14em" className="label-caps font-sans">
            EMIRATES HILLS GOLF
          </text>
        </g>

        {/* DIFC Gate Financial Precinct */}
        <g transform="translate(680, 330)">
          <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(212,175,55,0.2)" strokeDasharray="2 2" />
          <text x="12" y="4" fill="#c5a880" fontSize="9" letterSpacing="0.14em" className="label-caps font-sans">
            DIFC GATE
          </text>
        </g>

        {/* Enclave Region Watermarks */}
        <text x="350" y="380" fill="#c5a880" fontSize="10" letterSpacing="0.16em" className="label-caps font-sans opacity-80">
          PALM JUMEIRAH
        </text>

        <text x="500" y="270" fill="#c5a880" fontSize="10" letterSpacing="0.16em" className="label-caps font-sans opacity-80">
          JUMEIRAH BAY ISLAND
        </text>

        {/* Compass Rose */}
        <g transform="translate(920, 75) scale(0.85)">
          <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(212,175,55,0.3)" />
          <path d="M 0,-24 L 5,-6 L 0,0 L -5,-6 Z" fill="#d4af37" />
          <path d="M 0,24 L 5,6 L 0,0 L -5,6 Z" fill="rgba(212,175,55,0.4)" />
          <path d="M -24,0 L -6,-5 L 0,0 L -6,5 Z" fill="rgba(212,175,55,0.4)" />
          <path d="M 24,0 L 6,-5 L 0,0 L 6,5 Z" fill="rgba(212,175,55,0.4)" />
          <text x="-4" y="-30" fill="#d4af37" fontSize="10" fontWeight="bold">N</text>
        </g>
      </svg>

      {/* Top Header Controls: Title & Enclave Focus Tabs */}
      <div className="relative z-20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-b from-[#0d1013]/90 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[2px] bg-[#1f2428] border border-[#c5a880]/50 flex items-center justify-center text-[#c5a880]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="label-caps text-[#c5a880] text-[10px]">Stylized Geographical Chart</span>
              <span className="text-[#dadad8]/40">·</span>
              <span className="text-[11px] text-[#dadad8]">{displayedProperties.length} Properties Located</span>
            </div>
          </div>
        </div>

        {/* Enclave Quick-Focus Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#121517]/90 p-1 rounded-[3px] border border-[#c5a880]/30 backdrop-blur-md">
          {enclaves.map((enclave) => (
            <button
              key={enclave}
              onClick={() => setSelectedEnclave(enclave)}
              className={`px-2.5 py-1 text-[10px] font-semibold tracking-wider rounded-[2px] transition-colors ${
                selectedEnclave === enclave
                  ? 'bg-[#c5a880] text-[#121517]'
                  : 'text-[#dadad8] hover:text-white hover:bg-white/5'
              }`}
            >
              {enclave === 'All' ? 'All Enclaves' : enclave}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Property Location Markers */}
      <div className="absolute inset-0 pointer-events-none">
        {displayedProperties.map((property) => {
          const isSelected = selectedPropertyId === property.id || activeProperty?.id === property.id;
          const isHovered = hoveredPropertyId === property.id;

          return (
            <div
              key={property.id}
              style={{
                left: `${property.coordinates.x}%`,
                top: `${property.coordinates.y}%`
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
              onMouseEnter={() => setHoveredPropertyId(property.id)}
              onMouseLeave={() => setHoveredPropertyId(null)}
              onClick={() => {
                setActiveProperty(property);
              }}
            >
              {/* Radiating pulse ring for active/selected marker */}
              {(isHovered || isSelected) && (
                <span className="absolute -inset-2.5 rounded-full bg-[#c5a880]/35 animate-ping pointer-events-none" />
              )}

              {/* Pin Container */}
              <div
                className={`relative flex flex-col items-center transition-transform duration-200 ${
                  isHovered || isSelected ? 'scale-115 z-40' : 'scale-100 z-30'
                }`}
              >
                {/* Asking Price Tag above Pin Marker */}
                <div
                  className={`whitespace-nowrap px-2.5 py-0.5 rounded-[2px] border text-[10px] font-semibold tracking-wider tabular-nums shadow-lg mb-1 transition-all ${
                    isSelected
                      ? 'bg-[#5a1645] border-[#d4af37] text-white'
                      : isHovered
                      ? 'bg-[#c5a880] border-white text-[#121517]'
                      : 'bg-[#181d22]/95 border-[#c5a880]/50 text-[#e9dac1]'
                  }`}
                >
                  {formatPrice(property.priceAED, currency)}
                </div>

                {/* Marker Node Pin */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border shadow-xl transition-all ${
                    isSelected
                      ? 'bg-[#5a1645] border-[#d4af37] text-white ring-2 ring-[#d4af37]/60'
                      : isHovered
                      ? 'bg-[#c5a880] border-white text-[#121517]'
                      : 'bg-[#1f2428] border-[#c5a880] text-[#c5a880]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Property Dossier Card for Active/Hovered Marker */}
      {previewProperty && (
        <div
          className="relative z-40 m-4 sm:m-6 self-end w-80 sm:w-88 bg-[#1f2428]/95 backdrop-blur-xl rounded-[4px] border border-[#c5a880]/60 p-4 text-white shadow-2xl animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="label-caps text-[#c5a880] text-[9px] block">
              {previewProperty.location} · {previewProperty.type}
            </span>
            <button
              onClick={() => {
                setActiveProperty(null);
                setHoveredPropertyId(null);
              }}
              className="text-[#dadad8] hover:text-white p-0.5 rounded"
              title="Close preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative aspect-[16/9] w-full rounded-[2px] overflow-hidden mb-3 border border-white/10 bg-black">
            <PropertyImage
              src={previewProperty.image}
              alt={previewProperty.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-[#121517]/85 text-[#ffe088] rounded-[2px] border border-[#d4af37]/40">
              {previewProperty.status}
            </div>
          </div>

          <h4 className="font-editorial text-base font-medium text-white mb-1 truncate">
            {previewProperty.title}
          </h4>

          <div className="flex items-center gap-2 text-xs text-[#dadad8] mb-3">
            <span>{previewProperty.bedrooms} Suites</span>
            <span aria-hidden="true" className="text-[#c5a880]">·</span>
            <span>{previewProperty.areaSqFt.toLocaleString()} sq.ft</span>
            <span aria-hidden="true" className="text-[#c5a880]">·</span>
            <span className="text-[#ffe088] font-semibold tabular-nums">
              {formatPrice(previewProperty.priceAED, currency)}
            </span>
          </div>

          <button
            onClick={() => onSelectProperty(previewProperty)}
            className="w-full py-2 bg-[#c5a880] hover:bg-[#e9dac1] text-[#121517] text-xs font-semibold tracking-[0.14em] uppercase rounded-[2px] flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Architectural Dossier</span>
          </button>
        </div>
      )}

      {/* Bottom Coordinates & Map Controls Legend */}
      <div className="relative z-20 p-4 flex items-center justify-between text-[10px] text-[#75777a] font-mono tabular-nums bg-gradient-to-t from-[#0d1013]/90 to-transparent">
        <div>
          25°12′N 55°17′E · DUBAI MARITIME QUADRANT · ELEVATION 0–450M
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#c5a880] hidden sm:inline">Click pin to inspect residence</span>
        </div>
      </div>

    </div>
  );
};
