'use client';

import { useEffect } from 'react';
import { useCurrencyStore } from '@/hooks/useCurrency';

export default function CurrencyInitializer() {
  const fetchCurrencyAndRate = useCurrencyStore((state) => state.fetchCurrencyAndRate);

  useEffect(() => {
    fetchCurrencyAndRate();
  }, [fetchCurrencyAndRate]);

  return null;
}
