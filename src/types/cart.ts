import type { Item } from './item';

export interface CartRow {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
}

export interface CartEntry extends CartRow {
  item: Item;
}
