import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
  currencyCode: string;
  currencySymbol: string;
  exchangeRate: number; // Relative to USD
  isLoaded: boolean;
  formatPrice: (price: number | string) => string;
  fetchCurrencyAndRate: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currencyCode: 'USD',
      currencySymbol: '$',
      exchangeRate: 1,
      isLoaded: false,
      formatPrice: (price: number | string) => {
        const { currencyCode, exchangeRate } = get();
        const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]+/g, '')) : price;
        if (isNaN(numPrice)) return String(price);

        // Convert price (assuming base is USD)
        const convertedPrice = numPrice * exchangeRate;

        try {
          return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode,
          }).format(convertedPrice);
        } catch (e) {
          // Fallback
          return `${get().currencySymbol}${convertedPrice.toFixed(2)}`;
        }
      },
      fetchCurrencyAndRate: async () => {
        if (get().isLoaded) return;
        try {
          // 1. Get user currency based on location
          const ipRes = await fetch('https://ipapi.co/json/');
          if (!ipRes.ok) throw new Error('Failed to fetch IP details');
          const ipData = await ipRes.json();
          const userCurrency = ipData.currency || 'USD';
          
          // If the currency is USD, we don't need to fetch exchange rates
          if (userCurrency === 'USD') {
            set({ currencyCode: 'USD', currencySymbol: '$', exchangeRate: 1, isLoaded: true });
            return;
          }

          // 2. Fetch exchange rate (base USD)
          const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
          if (!rateRes.ok) throw new Error('Failed to fetch exchange rates');
          const rateData = await rateRes.json();
          
          const rate = rateData.rates[userCurrency] || 1;
          
          // Get the symbol using Intl
          const symbol = (0).toLocaleString(undefined, {
            style: 'currency',
            currency: userCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).replace(/\\d/g, '').trim() || userCurrency;

          set({
            currencyCode: userCurrency,
            currencySymbol: symbol,
            exchangeRate: rate,
            isLoaded: true
          });
        } catch (error) {
          console.error('Error fetching currency data:', error);
          // Fallback to USD
          set({ currencyCode: 'USD', currencySymbol: '$', exchangeRate: 1, isLoaded: true });
        }
      }
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({ 
        currencyCode: state.currencyCode,
        currencySymbol: state.currencySymbol,
        exchangeRate: state.exchangeRate,
        isLoaded: state.isLoaded
      }),
    }
  )
);
