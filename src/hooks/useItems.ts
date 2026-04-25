import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';

import { populateCache } from '@/src/store/itemCache';
import { supabase } from '@/src/services/supabase';
import type { Item } from '@/src/types/item';

interface State {
  items: Item[];
  loading: boolean;
  error: string | null;
}

export function useItems() {
  const [state, setState] = useState<State>({ items: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setState({ items: [], loading: false, error: error.message });
      return;
    }
    const items = (data ?? []) as Item[];
    populateCache(items);
    setState({ items, loading: false, error: null });
    Image.prefetch(items.slice(0, 20).map((i) => i.image_url));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
