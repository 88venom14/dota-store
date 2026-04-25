import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fontWeights, radii, rarityColors, spacing } from '@/src/constants/theme';
import type { Item } from '@/src/types/item';
import { formatCurrency } from '@/src/utils/format';

import { RarityBadge } from './RarityBadge';

interface Props {
  item: Item;
  onAddToCart?: (item: Item) => void;
  onPress?: (item: Item) => void;
  inCart?: boolean;
}

export function ItemCard({ item, onAddToCart, onPress, inCart }: Props) {
  const rarityColor = rarityColors[item.rarity] ?? colors.border;

  return (
    <Pressable
      onPress={onPress ? () => onPress(item) : undefined}
      style={({ pressed }) => [
        styles.card,
        { borderColor: rarityColor, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={item.image_url ? { uri: item.image_url } : undefined}
          style={styles.image}
          contentFit="contain"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={item.id}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <RarityBadge rarity={item.rarity} />
        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
          {onAddToCart ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={inCart ? 'Add another to cart' : 'Add to cart'}
              onPress={() => onAddToCart(item)}
              style={({ pressed }) => [
                styles.addButton,
                {
                  backgroundColor: inCart ? colors.yellow : colors.red,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              hitSlop={8}
            >
              <Ionicons
                name={inCart ? 'checkmark' : 'cart'}
                size={16}
                color={inCart ? colors.black : colors.white}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  price: {
    color: colors.yellow,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
