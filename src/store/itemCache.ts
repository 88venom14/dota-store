import type { Item } from '@/src/types/item';

const cache = new Map<string, Item>();

export function populateCache(items: Item[]) {
  for (const item of items) cache.set(item.id, item);
}

export function getCached(id: string): Item | undefined {
  return cache.get(id);
}

export function isCacheEmpty(): boolean {
  return cache.size === 0;
}
