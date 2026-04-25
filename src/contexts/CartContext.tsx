import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/src/services/supabase';
import type { CartEntry } from '@/src/types/cart';
import type { Item } from '@/src/types/item';

import { useAuth } from './AuthContext';

interface CartContextValue {
  entries: CartEntry[];
  totalItems: number;
  totalPrice: number;
  loading: boolean;
  addToCart: (item: Item, quantity?: number) => Promise<void>;
  removeFromCart: (entryId: string) => Promise<void>;
  setQuantity: (entryId: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  checkout: () => Promise<{ charged: number; remainingBalance: number }>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { session, profile, updateProfile } = useAuth();
  const userId = session?.user?.id;
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEntries([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('cart')
      .select('id, user_id, item_id, quantity, created_at, item:items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      console.error('[cart] refresh error', error);
      return;
    }
    setEntries((data ?? []) as unknown as CartEntry[]);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (item: Item, quantity = 1) => {
      if (!userId) throw new Error('Войдите чтобы добавить товар в корзину');
      const existing = entries.find((e) => e.item_id === item.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        setEntries((prev) => prev.map((e) => (e.id === existing.id ? { ...e, quantity: newQty } : e)));
        const { error } = await supabase
          .from('cart')
          .update({ quantity: newQty })
          .eq('id', existing.id);
        if (error) {
          setEntries((prev) => prev.map((e) => (e.id === existing.id ? { ...e, quantity: existing.quantity } : e)));
          throw error;
        }
      } else {
        const tempId = `temp_${Date.now()}`;
        const optimistic: CartEntry = {
          id: tempId,
          user_id: userId,
          item_id: item.id,
          quantity,
          created_at: new Date().toISOString(),
          item,
        };
        setEntries((prev) => [optimistic, ...prev]);
        const { data, error } = await supabase
          .from('cart')
          .insert({ user_id: userId, item_id: item.id, quantity })
          .select('id, user_id, item_id, quantity, created_at, item:items(*)')
          .single();
        if (error) {
          setEntries((prev) => prev.filter((e) => e.id !== tempId));
          throw error;
        }
        setEntries((prev) => prev.map((e) => (e.id === tempId ? (data as unknown as CartEntry) : e)));
      }
    },
    [userId, entries],
  );

  const removeFromCart = useCallback(
    async (entryId: string) => {
      const { error } = await supabase.from('cart').delete().eq('id', entryId);
      if (error) throw error;
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    },
    [],
  );

  const setQuantity = useCallback(
    async (entryId: string, quantity: number) => {
      if (quantity <= 0) return removeFromCart(entryId);
      const { error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('id', entryId);
      if (error) throw error;
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, quantity } : e)),
      );
    },
    [removeFromCart],
  );

  const clear = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase.from('cart').delete().eq('user_id', userId);
    if (error) throw error;
    setEntries([]);
  }, [userId]);

  const { totalItems, totalPrice } = useMemo(() => {
    let count = 0;
    let price = 0;
    for (const entry of entries) {
      count += entry.quantity;
      price += entry.quantity * (entry.item?.price ?? 0);
    }
    return { totalItems: count, totalPrice: price };
  }, [entries]);

  const checkout = useCallback(async () => {
    if (!profile) throw new Error('Профиль не загружен');
    if (entries.length === 0) throw new Error('Корзина пуста');
    if (profile.balance < totalPrice) {
      throw new Error('Недостаточно средств на балансе');
    }
    const remaining = profile.balance - totalPrice;
    await Promise.all([updateProfile({ balance: remaining }), clear()]);
    return { charged: totalPrice, remainingBalance: remaining };
  }, [profile, entries.length, totalPrice, updateProfile, clear]);

  const value = useMemo<CartContextValue>(
    () => ({
      entries,
      totalItems,
      totalPrice,
      loading,
      addToCart,
      removeFromCart,
      setQuantity,
      clear,
      checkout,
      refresh,
    }),
    [entries, totalItems, totalPrice, loading, addToCart, removeFromCart, setQuantity, clear, checkout, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
