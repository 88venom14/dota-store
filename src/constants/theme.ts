export const colors = {
  background: '#0B0B0D',
  surface: '#141418',
  surfaceElevated: '#1C1C22',
  border: '#2A2A33',
  red: '#D13438',
  redDark: '#8B1A1D',
  yellow: '#F5C518',
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#B5B5BD',
  textMuted: '#6E6E78',
  black: '#000000',
  success: '#3FB950',
  error: '#F85149',
};

export const rarityColors: Record<string, string> = {
  Common: '#B0C3D9',
  Uncommon: '#5E98D9',
  Rare: '#4B69FF',
  Mythical: '#8847FF',
  Legendary: '#D32CE6',
  Immortal: '#E4AE39',
  Arcana: '#ADE55C',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  title: 32,
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Mythical',
  'Legendary',
  'Immortal',
  'Arcana',
] as const;

export type Rarity = (typeof RARITIES)[number];
