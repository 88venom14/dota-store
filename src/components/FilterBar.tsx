import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fontSizes, fontWeights, radii, rarityColors, spacing } from '@/src/constants/theme';
import { RARITIES, type Rarity } from '@/src/constants/theme';

interface Props {
  selected: Rarity | null;
  onChange: (rarity: Rarity | null) => void;
}

export function FilterBar({ selected, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Chip label="All" active={selected === null} onPress={() => onChange(null)} />
      {RARITIES.map((rarity) => (
        <Chip
          key={rarity}
          label={rarity}
          color={rarityColors[rarity]}
          active={selected === rarity}
          onPress={() => onChange(selected === rarity ? null : rarity)}
        />
      ))}
    </ScrollView>
  );
}

interface ChipProps {
  label: string;
  color?: string;
  active: boolean;
  onPress: () => void;
}

function Chip({ label, color, active, onPress }: ChipProps) {
  const accent = color ?? colors.yellow;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: active ? accent : colors.border,
          backgroundColor: active ? `${accent}22` : colors.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? accent : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.3,
  },
});
