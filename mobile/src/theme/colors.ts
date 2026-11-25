import { ThemeMode } from '../types/habit';

export const LIGHT_COLORS = {
  // Superficies Stitch Citrus
  cream: '#F7FBF9',
  surfaceLow: '#EFF6F3',
  surfaceContainer: '#E5F0EC',
  surfaceHigh: '#D8E7E2',
  white: '#FFFFFF',
  dark: '#121E1C',
  muted: '#495A56',
  outline: '#7A8A86',
  lightGray: '#E9F7F3',
  border: '#D8E5E2',

  // Acentos principales Citrus
  coral: '#E85B4A',
  coralLight: '#FFEDE9',
  coralDark: '#C53B2B',
  onCoral: '#FFFFFF',
  lima: '#D6E85A',
  limaLight: '#F5FAD0',
  limaDark: '#3A4300',
  onLima: '#3A4300',
  aqua: '#8FD6D3',
  aquaLight: '#EAF7F6',
  aquaDark: '#166664',
  onAqua: '#166664',

  // Aliados de compatibilidad con componentes existentes
  sage: '#166664',
  sageLight: '#EAF7F6',
  terracotta: '#E85B4A',
  terracottaLight: '#FFEDE9',
  lavender: '#8FD6D3',
  lavenderLight: '#EAF7F6',
  sand: '#D6E85A',
  sandLight: '#F5FAD0',
  shieldGold: '#D35400',
  shieldGoldLight: '#FFE8DF',
};

export const DARK_COLORS: typeof LIGHT_COLORS = {
  // Superficies oscuras cálidas
  cream: '#0E1715',
  surfaceLow: '#15221F',
  surfaceContainer: '#1C2C28',
  surfaceHigh: '#243732',
  white: '#172522',
  dark: '#EFF6F3',
  muted: '#A3B6B0',
  outline: '#768A84',
  lightGray: '#1A2925',
  border: '#273A35',

  // Acentos adaptados para contraste en fondo oscuro
  coral: '#F06F5F',
  coralLight: '#3A201D',
  coralDark: '#FFA59A',
  onCoral: '#FFFFFF',
  lima: '#C9DC4A',
  limaLight: '#283014',
  limaDark: '#E6F57E',
  onLima: '#242B00',
  aqua: '#6EC2BE',
  aquaLight: '#173130',
  aquaDark: '#8FD6D3',
  onAqua: '#0B2E2D',

  // Aliados de compatibilidad
  sage: '#7FD1CE',
  sageLight: '#173130',
  terracotta: '#F06F5F',
  terracottaLight: '#3A201D',
  lavender: '#6EC2BE',
  lavenderLight: '#173130',
  sand: '#C9DC4A',
  sandLight: '#283014',
  shieldGold: '#F59E0B',
  shieldGoldLight: '#362712',
};

export type ThemeColors = typeof LIGHT_COLORS;

export function getThemeColors(mode: ThemeMode = 'light'): ThemeColors {
  return mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

export function getThemeShadows(mode: ThemeMode = 'light') {
  return {
    card: {
      shadowColor: mode === 'dark' ? '#000000' : '#121E1C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: mode === 'dark' ? 0.28 : 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
  };
}

export const THEME = {
  colors: LIGHT_COLORS,
  palette: [
    { name: 'Coral Pomelo', hex: '#E85B4A' },
    { name: 'Aqua Menta', hex: '#8FD6D3' },
    { name: 'Lima Pistacho', hex: '#D6E85A' },
    { name: 'Salvia', hex: '#4C6358' },
  ],
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fonts: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  shadows: getThemeShadows('light'),
};
