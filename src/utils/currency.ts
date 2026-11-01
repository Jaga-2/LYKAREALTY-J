import { Currency } from '../types';

export interface CurrencyMetadata {
  code: Currency;
  symbol: string;
  label: string;
  name: string;
  flag: string;
}

export const CURRENCY_CONFIG: Record<Currency, CurrencyMetadata> = {
  AED: { code: 'AED', symbol: 'AED', label: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  USD: { code: 'USD', symbol: '$', label: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR', name: 'Euro', flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', label: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  CHF: { code: 'CHF', symbol: 'CHF', label: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' }
};

// Institutional baseline rates pegged/market rates (AED base: 1 AED =)
export const BASELINE_RATES: Record<Currency, number> = {
  AED: 1.0,
  USD: 0.272294, // 1 USD ≈ 3.6725 AED
  EUR: 0.251840, // 1 EUR ≈ 3.97 AED
  GBP: 0.217520, // 1 GBP ≈ 4.597 AED
  CHF: 0.243180  // 1 CHF ≈ 4.11 AED
};

const STORAGE_KEY_RATES = 'lyka_fx_rates';
const STORAGE_KEY_TIMESTAMP = 'lyka_fx_updated';

/**
 * Fetch live exchange rates from open exchange API with fallback to baseline
 */
export async function fetchLiveExchangeRates(): Promise<{
  rates: Record<Currency, number>;
  isLive: boolean;
  updatedAt: string;
}> {
  try {
    // Open reliable public exchange rates endpoint (AED base, no key required)
    const response = await fetch('https://open.er-api.com/v6/latest/AED');
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data && data.rates) {
      const liveRates: Record<Currency, number> = {
        AED: 1.0,
        USD: data.rates.USD || BASELINE_RATES.USD,
        EUR: data.rates.EUR || BASELINE_RATES.EUR,
        GBP: data.rates.GBP || BASELINE_RATES.GBP,
        CHF: data.rates.CHF || BASELINE_RATES.CHF
      };

      const now = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(liveRates));
        localStorage.setItem(STORAGE_KEY_TIMESTAMP, now);
      } catch (e) {
        // ignore storage errors
      }

      return {
        rates: liveRates,
        isLive: true,
        updatedAt: now
      };
    }
  } catch (error) {
    // If network fails, try cached rates
    try {
      const cached = localStorage.getItem(STORAGE_KEY_RATES);
      const timestamp = localStorage.getItem(STORAGE_KEY_TIMESTAMP);
      if (cached) {
        return {
          rates: JSON.parse(cached),
          isLive: true,
          updatedAt: timestamp || new Date().toISOString()
        };
      }
    } catch (e) {
      // fallback
    }
  }

  // Baseline fallback
  return {
    rates: BASELINE_RATES,
    isLive: false,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Format compact price (e.g., "AED 185.0M", "$50.4M")
 */
export function formatCompactPrice(
  priceAED: number,
  currency: Currency = 'AED',
  rates: Record<Currency, number> = BASELINE_RATES
): string {
  const rate = rates[currency] || BASELINE_RATES[currency] || 1;
  const converted = priceAED * rate;
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.AED;

  if (currency === 'AED') {
    return `AED ${(converted / 1000000).toFixed(1)}M`;
  }
  if (currency === 'CHF') {
    return `CHF ${(converted / 1000000).toFixed(1)}M`;
  }
  return `${config.symbol}${(converted / 1000000).toFixed(1)}M`;
}

/**
 * Format full exact currency price (e.g., "$ 50,374,390")
 */
export function formatFullCurrencyPrice(
  priceAED: number,
  currency: Currency = 'AED',
  rates: Record<Currency, number> = BASELINE_RATES
): string {
  const rate = rates[currency] || BASELINE_RATES[currency] || 1;
  const converted = Math.round(priceAED * rate);
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.AED;

  if (currency === 'AED') {
    return `AED ${converted.toLocaleString()}`;
  }
  if (currency === 'CHF') {
    return `CHF ${converted.toLocaleString()}`;
  }
  return `${config.symbol} ${converted.toLocaleString()}`;
}

export const formatCurrency = formatFullCurrencyPrice;

/**
 * Format rate per sq.ft in active currency
 */
export function formatRatePerSqFt(
  rateAED: number,
  currency: Currency = 'AED',
  rates: Record<Currency, number> = BASELINE_RATES
): string {
  const rate = rates[currency] || BASELINE_RATES[currency] || 1;
  const converted = Math.round(rateAED * rate);
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.AED;

  if (currency === 'AED') {
    return `AED ${converted.toLocaleString()} / sq.ft`;
  }
  if (currency === 'CHF') {
    return `CHF ${converted.toLocaleString()} / sq.ft`;
  }
  return `${config.symbol}${converted.toLocaleString()} / sq.ft`;
}
