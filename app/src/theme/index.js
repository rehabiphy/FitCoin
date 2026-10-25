import { Platform } from 'react-native';

export const colors = {
  bg: '#060912',
  bgElevated: '#0B1120',
  surface: '#111828',
  surfaceAlt: '#161F33',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',

  text: '#F4F7FF',
  textSecondary: '#A3ADC6',
  textMuted: '#69738D',

  primary: '#7C5CFF',
  primaryDark: '#5B3FE0',
  cyan: '#22D3EE',
  mint: '#34F5B4',
  gold: '#FFC94D',
  orange: '#FF8A3D',
  pink: '#FF5C9A',
  red: '#FF5A6E',
  blue: '#4D8DFF',

  success: '#34F5B4',
  danger: '#FF5A6E',
  warning: '#FFC94D',

  overlay: 'rgba(6,9,18,0.72)',
};

export const gradients = {
  primary: ['#7C5CFF', '#22D3EE'],
  mint: ['#34F5B4', '#22D3EE'],
  gold: ['#FFD86B', '#FF8A3D'],
  pink: ['#FF5C9A', '#7C5CFF'],
  card: ['#1A2240', '#0E1426'],
  wallet: ['#5B3FE0', '#7C5CFF', '#22D3EE'],
  dark: ['#0B1120', '#060912'],
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };

const family = Platform.select({ android: 'sans-serif', default: undefined });
const familyMedium = Platform.select({ android: 'sans-serif-medium', default: undefined });

export const type = {
  display: { fontFamily: family, fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  h1: { fontFamily: family, fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  h2: { fontFamily: family, fontSize: 20, fontWeight: '700', color: colors.text },
  h3: { fontFamily: familyMedium, fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontFamily: family, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  bodyStrong: { fontFamily: familyMedium, fontSize: 14, fontWeight: '600', color: colors.text },
  caption: { fontFamily: family, fontSize: 12, color: colors.textMuted },
  label: { fontFamily: familyMedium, fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
};

export const shadow = {
  glow: (color = colors.primary) => ({
    shadowColor: color,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  }),
};

export const TOKEN = 'FIT';
