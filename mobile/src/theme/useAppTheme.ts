import { useMemo } from 'react';
import { useHabitStore } from '../store/habitStore';
import { getThemeColors, getThemeShadows } from './colors';

export function useAppTheme() {
  const themeMode = useHabitStore((s) => s.settings.themeMode || 'light');

  return useMemo(
    () => ({
      themeMode,
      isDark: themeMode === 'dark',
      colors: getThemeColors(themeMode),
      shadows: getThemeShadows(themeMode),
    }),
    [themeMode]
  );
}
