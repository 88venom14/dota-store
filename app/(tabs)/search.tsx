import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components/EmptyState';
import { FilterBar } from '@/src/components/FilterBar';
import { ItemCard } from '@/src/components/ItemCard';
import { PriceFilterBar } from '@/src/components/PriceFilterBar';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SearchBar } from '@/src/components/SearchBar';
import { colors, spacing, type Rarity } from '@/src/constants/theme';
import { useCart } from '@/src/contexts/CartContext';
import { useItemSearch, type PriceSort } from '@/src/hooks/useItemSearch';
import type { Item } from '@/src/types/item';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [rarity, setRarity] = useState<Rarity | null>(null);
  const [priceSort, setPriceSort] = useState<PriceSort>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const { results, loading } = useItemSearch({ query, rarity, priceSort, maxPrice });
  const { addToCart, entries } = useCart();
  const cartIds = new Set(entries.map((e) => e.item_id));

  const onAdd = async (item: Item) => {
    try {
      await addToCart(item);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось добавить';
      Alert.alert('Корзина', message);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Поиск" subtitle="Найди ту самую шмотку" />

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} autoFocus={false} />
      </View>

      <View style={styles.filtersWrap}>
        <FilterBar selected={rarity} onChange={setRarity} />
        <View style={styles.filterSpacer} />
        <PriceFilterBar
          priceSort={priceSort}
          maxPrice={maxPrice}
          onPriceSortChange={setPriceSort}
          onMaxPriceChange={setMaxPrice}
        />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.yellow} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ItemCard
                item={item}
                onAddToCart={onAdd}
                onPress={(i) => router.push({ pathname: '/item/[id]', params: { id: i.id } })}
                inCart={cartIds.has(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title={query || rarity || maxPrice ? 'Ничего не найдено' : 'Начни поиск'}
              subtitle={
                query || rarity || maxPrice
                  ? 'Попробуй изменить фильтры или запрос.'
                  : 'Введи название предмета или выбери фильтр.'
              }
            />
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filtersWrap: {
    paddingBottom: spacing.sm,
    gap: 0,
  },
  filterSpacer: {
    height: spacing.sm,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    gap: spacing.md,
  },
  cardWrap: {
    flex: 1,
    marginBottom: spacing.md,
  },
});
