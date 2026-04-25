import { useEffect, useRef, useState } from 'react';

import type { Rarity } from '@/src/constants/theme';
import { populateCache } from '@/src/store/itemCache';
import { supabase } from '@/src/services/supabase';
import type { Item } from '@/src/types/item';

export type PriceSort = 'asc' | 'desc' | null;

interface Filters {
  query: string;
  rarity: Rarity | null;
  priceSort: PriceSort;
  maxPrice: number | null;
}

const cache = new Map<string, Item[]>();

export function useItemSearch({ query, rarity, priceSort, maxPrice }: Filters) {
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const lastKey = useRef('');

  useEffect(() => {
    let active = true;
    const trimmed = query.trim();
    const key = `${trimmed}|${rarity}|${priceSort}|${maxPrice}`;

    if (cache.has(key)) {
      setResults(cache.get(key)!);
      setLoading(false);
      lastKey.current = key;
      return;
    }

    const run = async () => {
      setLoading(true);
      let builder = supabase.from('items').select('*').limit(100);

      if (trimmed.length > 0) builder = builder.ilike('name', `%${trimmed}%`);
      if (rarity) builder = builder.eq('rarity', rarity);
      if (maxPrice !== null) builder = builder.lte('price', maxPrice);
      if (priceSort) {
        builder = builder.order('price', { ascending: priceSort === 'asc' });
      } else {
        builder = builder.order('created_at', { ascending: false });
      }

      const { data, error } = await builder;
      if (!active) return;
      setLoading(false);
      if (error) {
        console.error('[search] error', error);
        return;
      }
      const items = (data ?? []) as Item[];
      populateCache(items);
      cache.set(key, items);
      if (cache.size > 30) cache.delete(cache.keys().next().value!);
      setResults(items);
      lastKey.current = key;
    };

    const handle = setTimeout(run, 300);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, rarity, priceSort, maxPrice]);

  return { results, loading };
}
