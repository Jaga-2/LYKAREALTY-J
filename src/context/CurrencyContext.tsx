import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Currency } from '../types';
import {
  CurrencyMetadata,
  CURRENCY_CONFIG,
  BASELINE_RATES,
  fetchLiveExchangeRates,
  formatCompactPrice,
  formatFullCurrencyPrice,
  formatRatePerSqFt
} from '../utils/currency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Record<Currency, number>;
  isLoading: boolean;
  isLiveFeed: boolean;
  lastUpdated: string | null;
  refreshRates: () => Promise<void>;
  formatPrice: (priceAED: number) => string;
  formatFullPrice: (priceAED: number) => string;
  formatRate: (rateAED: number) => string;
  currentConfig: CurrencyMetadata;
  availableCurrencies: CurrencyMetadata[];
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const STORAGE_CURRENCY_KEY = 'lyka_selected_currency';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CURRENCY_KEY);
      if (stored && ['AED', 'USD', 'EUR', 'GBP', 'CHF'].includes(stored)) {
        return stored as Currency;
      }
    } catch {
      // fallback
    }
    return 'AED';
  });

  const [rates, setRates] = useState<Record<Currency, number>>(BASELINE_RATES);
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchLiveExchangeRates();
      setRates(result.rates);
      setIsLiveFeed(result.isLive);
      setLastUpdated(result.updatedAt);
    } catch (e) {
      setRates(BASELINE_RATES);
      setIsLiveFeed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
    // Refresh exchange rates every 15 minutes
    const interval = setInterval(loadRates, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadRates]);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(STORAGE_CURRENCY_KEY, newCurrency);
    } catch {
      // ignore
    }
  }, []);

  const formatPriceCb = useCallback(
    (priceAED: number) => formatCompactPrice(priceAED, currency, rates),
    [currency, rates]
  );

  const formatFullPriceCb = useCallback(
    (priceAED: number) => formatFullCurrencyPrice(priceAED, currency, rates),
    [currency, rates]
  );

  const formatRateCb = useCallback(
    (rateAED: number) => formatRatePerSqFt(rateAED, currency, rates),
    [currency, rates]
  );

  const currentConfig = useMemo(() => CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.AED, [currency]);

  const availableCurrencies = useMemo(() => Object.values(CURRENCY_CONFIG), []);

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      isLoading,
      isLiveFeed,
      lastUpdated,
      refreshRates: loadRates,
      formatPrice: formatPriceCb,
      formatFullPrice: formatFullPriceCb,
      formatRate: formatRateCb,
      currentConfig,
      availableCurrencies
    }),
    [
      currency,
      setCurrency,
      rates,
      isLoading,
      isLiveFeed,
      lastUpdated,
      loadRates,
      formatPriceCb,
      formatFullPriceCb,
      formatRateCb,
      currentConfig,
      availableCurrencies
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
