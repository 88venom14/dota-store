# Dota 2 Items Store

Мобильное приложение-магазин косметических предметов Dota 2, построенное на Expo Router, React Native, TypeScript и Supabase.

## Функционал

- **Авторизация** — вход/регистрация по email и паролю через Supabase Auth, сессия сохраняется между запусками.
- **Магазин** — сетка предметов, добавление в корзину, фильтрация по редкости.
- **Поиск** — поиск с дебаунсом и живыми результатами.
- **Профиль** — смена никнейма, загрузка аватара в Supabase Storage, просмотр баланса, переход в корзину.
- **Корзина** — управление количеством, итоговая сумма, оплата с списанием баланса.
- **Тема** — тёмная, акценты красного/жёлтого, цветовая кодировка по редкости.

## Стек технологий

- TypeScript · React Native 0.81 · Expo 54 · Expo Router 6
- Supabase (Auth + Postgres + Storage)
- `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`

## Структура проекта

```
app/                      Экраны Expo Router
  _layout.tsx             Корневой стек + провайдеры Auth/Cart + защита маршрутов
  auth.tsx                Вход / регистрация
  cart.tsx                Модальное окно корзины (количество, оплата)
  (tabs)/
    _layout.tsx           Нижние табы (Магазин, Поиск, Профиль)
    index.tsx             Магазин (сетка + фильтр по редкости)
    search.tsx            Экран поиска
    profile.tsx           Профиль / аватар / баланс / корзина

src/
  components/             ItemCard, FilterBar, SearchBar, Button, RarityBadge, ...
  constants/theme.ts      Цвета, отступы, палитра редкостей
  contexts/               AuthContext, CartContext
  hooks/                  useItems, useItemSearch
  services/supabase.ts    Клиент Supabase (сессия через AsyncStorage)
  types/                  Типы: item, user, cart, схема базы данных
  utils/format.ts         Форматирование валюты

supabase/
  schema.sql              Таблицы, политики RLS, бакет для хранилища
  seed.sql                Тестовые предметы
```

## Установка

1. **Установи зависимости**
   ```bash
   npm install
   ```

2. **Создай проект в Supabase** на https://supabase.com и скопируй URL проекта и анонимный ключ.

3. **Примени схему** в SQL-редакторе Supabase:
   - вставь и выполни `supabase/schema.sql` (создаёт таблицы, RLS, бакет `avatars`)
   - вставь и выполни `supabase/seed.sql` (добавляет тестовые предметы)

4. **Настрой переменные окружения** — скопируй `.env.example` в `.env` и заполни:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

5. **Запусти приложение**
   ```bash
   npm run start       # dev-сервер
   npm run android     # Android-эмулятор / устройство
   npm run ios         # iOS-симулятор / устройство
   npm run web         # веб-предпросмотр
   ```

## Заметки

- Новым пользователям автоматически создаётся профиль с начальным балансом $1000 (настраивается в `supabase/schema.sql`).
- Оплата симулируется: списывает `users.balance` и очищает корзину — платёжный провайдер не используется.
- Изображения тестовых предметов берутся с picsum.photos; замени на реальные CDN-ссылки при необходимости.
- Подтверждение email включено в Supabase по умолчанию — отключи для быстрой разработки в Auth → Providers → Email.
