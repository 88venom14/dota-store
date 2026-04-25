import type { Rarity } from '@/src/constants/theme';

export interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  image_url: string;
  created_at: string;
}
