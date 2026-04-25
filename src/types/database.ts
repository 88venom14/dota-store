export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          balance: number;
          created_at: string;
          card_last4: string | null;
          card_brand: string | null;
          card_holder: string | null;
          card_expiry: string | null;
        };
        Insert: {
          id: string;
          nickname: string;
          avatar_url?: string | null;
          balance?: number;
          created_at?: string;
          card_last4?: string | null;
          card_brand?: string | null;
          card_holder?: string | null;
          card_expiry?: string | null;
        };
        Update: {
          nickname?: string;
          avatar_url?: string | null;
          balance?: number;
          card_last4?: string | null;
          card_brand?: string | null;
          card_holder?: string | null;
          card_expiry?: string | null;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          name: string;
          rarity: string;
          price: number;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rarity: string;
          price: number;
          image_url: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          rarity?: string;
          price?: number;
          image_url?: string;
        };
        Relationships: [];
      };
      cart: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          quantity?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
