export interface UserProfile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  balance: number;
  created_at: string;
  card_last4: string | null;
  card_brand: string | null;
  card_holder: string | null;
  card_expiry: string | null;
}
