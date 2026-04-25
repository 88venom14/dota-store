import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartBadge } from '@/src/components/CartBadge';
import { EmptyState } from '@/src/components/EmptyState';
import { FilterBar } from '@/src/components/FilterBar';
import { ItemCard } from '@/src/components/ItemCard';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { colors, spacing, type Rarity } from '@/src/constants/theme';
import { useCart } from '@/src/contexts/CartContext';
import { useItems } from '@/src/hooks/useItems';
import type { Item } from '@/src/types/item';

export default function StoreScreen() {
  const router = useRouter();
  const { items, loading, reload } = useItems();
  const { addToCart, entries, totalItems } = useCart();
  const [rarity, setRarity] = useState<Rarity | null>(null);

  const filtered = useMemo(() => {
    if (!rarity) return items;
    return items.filter((i) => i.rarity === rarity);
  }, [items, rarity]);

  const cartItemIds = useMemo(
    () => new Set(entries.map((e) => e.item_id)),
    [entries],
  );

  const onAdd = async (item: Item) => {
    try {
      await addToCart(item);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add';
      Alert.alert('Cart', message);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader
        title="Магазин"
        subtitle="Крутые шмотки только здесь"
        right={<CartBadge count={totalItems} onPress={() => router.push('/cart')} />}
      />
      <View style={styles.filters}>
        <FilterBar selected={rarity} onChange={setRarity} />
      </View>
      {loading && items.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.red} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={reload}
              tintColor={colors.red}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ItemCard
                item={item}
                onAddToCart={onAdd}
                onPress={(i) => router.push({ pathname: '/item/[id]', params: { id: i.id } })}
                inCart={cartItemIds.has(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="Нет товаров"
              subtitle={
                rarity
                  ? `Предметов редкости «${rarity}» нет. Попробуй другой фильтр.`
                  : 'Магазин пуст.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filters: {
    paddingVertical: spacing.sm,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
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
