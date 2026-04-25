# Dota 2 Items Store

A mobile store app for Dota 2 cosmetic items, built with Expo Router, React Native, TypeScript, and Supabase.

## Features

- **Auth** — email/password via Supabase Auth, session persisted across launches.
- **Store** — grid of items, add-to-cart, rarity filter chips.
- **Search** — real-time debounced search with live results.
- **Profile** — change nickname, upload avatar to Supabase Storage, view balance, jump to cart.
- **Cart** — quantities, totals, mocked checkout that debits balance.
- **Theme** — dark, red/yellow accents, per-rarity color coding.

## Tech stack

- TypeScript · React Native 0.81 · Expo 54 · Expo Router 6
- Supabase (Auth + Postgres + Storage)
- `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`

## Project layout

```
app/                      Expo Router screens
  _layout.tsx             Root stack + Auth/Cart providers + auth gate
  auth.tsx                Login / register
  cart.tsx                Cart modal (quantities, checkout)
  (tabs)/
    _layout.tsx           Bottom tabs (Store, Search, Profile)
    index.tsx             Store (grid + rarity filter)
    search.tsx            Search screen
    profile.tsx           Profile / avatar / balance / cart link

src/
  components/             ItemCard, FilterBar, SearchBar, Button, RarityBadge, ...
  constants/theme.ts      Colors, spacing, rarity palette
  contexts/               AuthContext, CartContext
  hooks/                  useItems, useItemSearch
  services/supabase.ts    Supabase client (AsyncStorage-backed session)
  types/                  item, user, cart, database schema types
  utils/format.ts         Currency formatting

supabase/
  schema.sql              Tables, RLS policies, storage bucket
  seed.sql                Sample items
```

## Setup

1. **Install deps**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com and grab the project URL + anon key.

3. **Run the schema** in the Supabase SQL editor:
   - paste `supabase/schema.sql` and run (creates tables, RLS, `avatars` bucket)
   - paste `supabase/seed.sql` and run (adds sample items)

4. **Configure env** — copy `.env.example` to `.env` and fill in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

5. **Run the app**
   ```bash
   npm run start       # dev server
   npm run android     # Android emulator / device
   npm run ios         # iOS simulator / device
   npm run web         # web preview
   ```

## Notes

- New users are auto-provisioned a profile row with a starting balance of $1000 (tweak in `supabase/schema.sql`).
- Checkout is mocked: it debits `users.balance` and clears the cart — no payment provider involved.
- Seed item images come from picsum.photos placeholders; swap them for real CDN URLs later.
- Email confirmation is on by default in Supabase — disable it for faster local iteration in Auth → Providers → Email.
