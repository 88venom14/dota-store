import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { RarityBadge } from '@/src/components/RarityBadge';
import { colors, fontSizes, fontWeights, radii, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { useCart } from '@/src/contexts/CartContext';
import type { CartEntry } from '@/src/types/cart';
import { formatCurrency } from '@/src/utils/format';

export default function CartScreen() {
  const { entries, totalPrice, totalItems, setQuantity, removeFromCart, checkout } = useCart();
  const { profile } = useAuth();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);

  const onCheckout = async () => {
    setCheckingOut(true);
    try {
      const { charged, remainingBalance } = await checkout();
      Alert.alert(
        'Покупка завершена!',
        `Списано ${formatCurrency(charged)}. Остаток на балансе: ${formatCurrency(remainingBalance)}.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка оплаты';
      Alert.alert('Оплата', message);
    } finally {
      setCheckingOut(false);
    }
  };

  const canAfford = profile ? profile.balance >= totalPrice : false;

  function pluralItems(n: number) {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} предмет`;
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} предмета`;
    return `${n} предметов`;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Row
            entry={item}
            onIncrement={() => setQuantity(item.id, item.quantity + 1)}
            onDecrement={() => setQuantity(item.id, item.quantity - 1)}
            onRemove={() => removeFromCart(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="Корзина пуста"
            subtitle="Зайди в магазин и добавь товары"
          />
        }
      />

      {entries.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryLabel}>{pluralItems(totalItems)}</Text>
              <Text style={styles.summaryTotal}>{formatCurrency(totalPrice)}</Text>
            </View>
            {profile ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryLabel}>Баланс</Text>
                <Text style={[styles.summaryBalance, !canAfford && { color: colors.error }]}>
                  {formatCurrency(profile.balance)}
                </Text>
              </View>
            ) : null}
          </View>
          <Button
            title={canAfford ? 'Оплатить' : 'Недостаточно средств'}
            size="lg"
            onPress={onCheckout}
            loading={checkingOut}
            disabled={!canAfford}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

interface RowProps {
  entry: CartEntry;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

function Row({ entry, onIncrement, onDecrement, onRemove }: RowProps) {
  const lineTotal = entry.item.price * entry.quantity;
  return (
    <View style={styles.row}>
      <View style={styles.thumbWrap}>
        <Image
          source={entry.item.image_url ? { uri: entry.item.image_url } : undefined}
          style={styles.thumb}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.item.name}
        </Text>
        <RarityBadge rarity={entry.item.rarity} />
        <View style={styles.rowControls}>
          <View style={styles.qtyGroup}>
            <Pressable style={styles.qtyBtn} onPress={onDecrement} hitSlop={6}>
              <Ionicons name="remove" size={14} color={colors.white} />
            </Pressable>
            <Text style={styles.qtyText}>{entry.quantity}</Text>
            <Pressable style={styles.qtyBtn} onPress={onIncrement} hitSlop={6}>
              <Ionicons name="add" size={14} color={colors.white} />
            </Pressable>
          </View>
          <Text style={styles.rowPrice}>{formatCurrency(lineTotal)}</Text>
        </View>
      </View>
      <Pressable style={styles.removeBtn} onPress={onRemove} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
  rowName: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },
  rowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  qtyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    minWidth: 18,
    textAlign: 'center',
  },
  rowPrice: {
    color: colors.yellow,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  removeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryTotal: {
    color: colors.yellow,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
  },
  summaryBalance: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
});
