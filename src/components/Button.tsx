import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type ViewStyle } from 'react-native';

import { colors, fontSizes, fontWeights, radii, spacing } from '@/src/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ title, variant = 'primary', size = 'md', loading, disabled, style, ...rest }: Props) {
  const bg = variantBg[variant];
  const fg = variantFg[variant];
  const border = variantBorder[variant];
  const padV = size === 'sm' ? spacing.sm : size === 'lg' ? spacing.lg : spacing.md;
  const fontSize = size === 'sm' ? fontSizes.sm : size === 'lg' ? fontSizes.lg : fontSizes.md;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingVertical: padV,
          opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg, fontSize }]} numberOfLines={1}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const variantBg: Record<Variant, string> = {
  primary: colors.red,
  secondary: colors.surfaceElevated,
  ghost: 'transparent',
  danger: colors.redDark,
};

const variantFg: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.white,
  ghost: colors.yellow,
  danger: colors.white,
};

const variantBorder: Record<Variant, string> = {
  primary: colors.red,
  secondary: colors.border,
  ghost: 'transparent',
  danger: colors.redDark,
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.3,
  },
});
