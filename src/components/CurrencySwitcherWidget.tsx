import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { Currency } from '../types';
import { ChevronDown, RefreshCw, Radio, Check, Globe } from 'lucide-react';

interface CurrencySwitcherWidgetProps {
  compact?: boolean;
}

export const CurrencySwitcherWidget: React.FC<CurrencySwitcherWidgetProps> = ({ compact = false }) => {
  const {
    currency,
    setCurrency,
    rates,
    isLiveFeed,
    lastUpdated,
    refreshRates,
    isLoading,
    availableCurrencies,
    currentConfig
  } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatRateAgainstAED = (code: Currency) => {
    const rate = rates[code];
    if (code === 'AED') return '1.0000 AED';
    // Show 1 AED = X currency
    return `1 AED = ${rate.toFixed(4)} ${code}`;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-[3px] border border-[#c5a880]/35 bg-white hover:border-[#c5a880] text-[#1f2428] shadow-sm transition-all cursor-pointer focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-sm leading-none">{currentConfig.flag}</span>
        <span className="font-mono tabular-nums tracking-wide">{currentConfig.code}</span>
        <span className="text-[#75777a] font-normal text-[11px] hidden sm:inline">({currentConfig.symbol})</span>
        
        {/* Live indicator pip */}
        <span
          className={`w-1.5 h-1.5 rounded-full ${isLiveFeed ? 'bg-emerald-500 animate-pulse' : 'bg-[#c5a880]'}`}
          title={isLiveFeed ? 'Live Real-Time Forex Rates' : 'Institutional Pegged Rates'}
        />

        <ChevronDown className={`w-3.5 h-3.5 text-[#75777a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu with Live FX Feed and Rate Multipliers */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 rounded-[4px] bg-[#1f2428] text-white border border-[#c5a880]/50 shadow-2xl z-50 p-3 animate-fadeIn">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#c5a880]/20 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#c5a880]" />
              <span className="label-caps text-[#c5a880] text-[9px]">Real-Time Currency Stream</span>
            </div>

            <button
              onClick={() => refreshRates()}
              disabled={isLoading}
              className="p-1 text-[#dadad8] hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Refresh Live Exchange Rates"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Currencies List */}
          <div className="space-y-1">
            {availableCurrencies.map((item) => {
              const isSelected = currency === item.code;

              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setCurrency(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[2px] text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#c5a880] text-[#121517] font-semibold'
                      : 'hover:bg-white/10 text-[#dadad8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.flag}</span>
                    <span className="font-semibold">{item.code}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-[#121517]/80' : 'text-[#868b90]'}`}>
                      · {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono tabular-nums ${isSelected ? 'text-[#121517]' : 'text-[#c5a880]'}`}>
                      {formatRateAgainstAED(item.code)}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#121517]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-3 pt-2 border-t border-[#c5a880]/15 flex items-center justify-between text-[9px] text-[#868b90] font-mono">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveFeed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isLiveFeed ? 'Live Interbank Spot Feed' : 'Pegged Baseline'}
            </span>
            <span>AED Base (Peg: 3.6725 USD)</span>
          </div>

        </div>
      )}

    </div>
  );
};
