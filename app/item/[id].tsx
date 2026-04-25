import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/Button';
import { RarityBadge } from '@/src/components/RarityBadge';
import { colors, fontSizes, fontWeights, radii, rarityColors, spacing } from '@/src/constants/theme';
import { useCart } from '@/src/contexts/CartContext';
import { supabase } from '@/src/services/supabase';
import { getCached } from '@/src/store/itemCache';
import type { Item } from '@/src/types/item';
import { formatCurrency } from '@/src/utils/format';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart, entries } = useCart();
  const [item, setItem] = useState<Item | null>(() => (id ? (getCached(id) ?? null) : null));
  const [loading, setLoading] = useState(!id || !getCached(id));
  const [adding, setAdding] = useState(false);

  const inCart = entries.some((e) => e.item_id === id);
  const rarityColor = item ? (rarityColors[item.rarity] ?? colors.border) : colors.border;

  useEffect(() => {
    if (!id || getCached(id)) return;
    let active = true;
    const run = async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single();
        if (!active) return;
        setLoading(false);
        if (error) { console.error('[item detail]', error); return; }
        setItem(data as Item);
      } catch (e) {
        if (!active) return;
        console.error('[item detail] fetch failed', e);
        setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [id]);

  const onAddToCart = async () => {
    if (!item) return;
    setAdding(true);
    try {
      await addToCart(item);
    } catch (err) {
      Alert.alert('Cart', err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.red} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loader}>
          <Text style={styles.notFound}>Предмет не найден.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </Pressable>

        <View style={[styles.imageWrap, { borderColor: rarityColor }]}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            contentFit="contain"
            transition={300}
          />
          <View style={[styles.imageGlow, { backgroundColor: `${rarityColor}18` }]} />
        </View>

        <View style={styles.card}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
          </View>
          <View style={styles.badgeRow}>
            <RarityBadge rarity={item.rarity} />
          </View>

          <View style={[styles.divider, { backgroundColor: rarityColor + '44' }]} />

          <View style={styles.statsGrid}>
            <Stat label="Редкость" value={item.rarity} valueColor={rarityColor} />
            <Stat label="Цена" value={formatCurrency(item.price)} valueColor={colors.yellow} />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={styles.sectionTitle}>О предмете</Text>
          <Text style={styles.description}>
            {descriptionFor(item)}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Цена</Text>
          <Text style={styles.priceValue}>{formatCurrency(item.price)}</Text>
        </View>
        <Button
          title={inCart ? 'В корзине' : 'Добавить в корзину'}
          variant={inCart ? 'secondary' : 'primary'}
          size="lg"
          onPress={onAddToCart}
          loading={adding}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function descriptionFor(item: Item): string {
  const rarityFlavour: Record<string, string> = {
    Common: 'Широко распространённый косметический предмет, которым пользуются герои по всему полю боя.',
    Uncommon: 'Предмет с лёгкой изюминкой, выделяющий своего владельца среди рядовых бойцов.',
    Rare: 'Изысканная вещь, редко встречающаяся у кого-то кроме опытных ветеранов.',
    Mythical: 'Эффектный косметический предмет, окутанный тайной и мастерством создателя.',
    Legendary: 'Легендарный предмет, вписанный в историю и лор героя, которому он принадлежит.',
    Immortal: 'Косметика бессмертного качества — вручается самым прославленным воинам игры.',
    Arcana: 'Редчайшая из редкостей. Аркана полностью преображает героя: новые анимации, звуки и визуальные эффекты.',
  };

  return `«${item.name}» — косметический предмет Dota 2 уровня редкости «${item.rarity}». ` +
    (rarityFlavour[item.rarity] ?? '') +
    ' Надень его, чтобы изменить облик своего героя в каждом матче.';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: colors.textMuted, fontSize: fontSizes.lg },
  content: { paddingBottom: 120 },

  backBtn: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imageGlow: {
    ...StyleSheet.absoluteFillObject,
  },

  card: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: {
    flex: 1,
    color: colors.white,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: 32,
  },
  badgeRow: { flexDirection: 'row' },
  divider: { height: 1, borderRadius: 1 },

  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },

  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    lineHeight: 22,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceBlock: { gap: 2 },
  priceLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceValue: {
    color: colors.yellow,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
});
