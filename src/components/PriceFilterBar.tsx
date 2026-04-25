import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fontSizes, fontWeights, radii, spacing } from '@/src/constants/theme';
import type { PriceSort } from '@/src/hooks/useItemSearch';

const MAX_PRICE_OPTIONS = [1, 5, 15, 50, 100, 300] as const;

interface Props {
  priceSort: PriceSort;
  maxPrice: number | null;
  onPriceSortChange: (sort: PriceSort) => void;
  onMaxPriceChange: (max: number | null) => void;
}

export function PriceFilterBar({ priceSort, maxPrice, onPriceSortChange, onMaxPriceChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <SortChip
        label="Дешевле"
        icon="arrow-up"
        active={priceSort === 'asc'}
        onPress={() => onPriceSortChange(priceSort === 'asc' ? null : 'asc')}
      />
      <SortChip
        label="Дороже"
        icon="arrow-down"
        active={priceSort === 'desc'}
        onPress={() => onPriceSortChange(priceSort === 'desc' ? null : 'desc')}
      />

      <Text style={styles.separator}>до</Text>

      {MAX_PRICE_OPTIONS.map((price) => (
        <Pressable
          key={price}
          onPress={() => onMaxPriceChange(maxPrice === price ? null : price)}
          style={({ pressed }) => [
            styles.chip,
            {
              borderColor: maxPrice === price ? colors.yellow : colors.border,
              backgroundColor: maxPrice === price ? `${colors.yellow}22` : colors.surface,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.chipText, { color: maxPrice === price ? colors.yellow : colors.textSecondary }]}>
            ${price}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function SortChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: 'arrow-up' | 'arrow-down';
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        styles.sortChip,
        {
          borderColor: active ? colors.red : colors.border,
          backgroundColor: active ? `${colors.red}22` : colors.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={12} color={active ? colors.red : colors.textSecondary} />
      <Text style={[styles.chipText, { color: active ? colors.red : colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.3,
  },
  separator: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    alignSelf: 'center',
    marginHorizontal: spacing.xs,
  },
});
