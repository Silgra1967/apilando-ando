import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, DailyLog, AppSettings } from '../types/habit';

interface HabitStore {
  habits: Habit[];
  logs: Record<string, DailyLog>; // key: `${habitId}_${date}`
  settings: AppSettings;
  isLoaded: boolean;
  
  // Acciones
  loadFromStorage: () => Promise<void>;
  createInitialHabit: (name: string, color: string, anchorText?: string, reminderTime?: string) => Promise<void>;
  toggleDayCompletion: (habitId: string, dateStr: string) => Promise<void>;
  useShield: (habitId: string, dateStr: string) => Promise<void>;
  resetStreak: (habitId: string) => Promise<void>;
}

const STORAGE_KEYS = {
  HABITS: '@apliando_habits',
  LOGS: '@apliando_logs',
  SETTINGS: '@apliando_settings',
};

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  logs: {},
  settings: {
    reminderTime: '20:00',
    notificationsEnabled: true,
    soundEnabled: true,
    onboardingCompleted: false,
  },
  isLoaded: false,

  loadFromStorage: async () => {
    try {
      const [storedHabits, storedLogs, storedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HABITS),
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      set({
        habits: storedHabits ? JSON.parse(storedHabits) : [],
        logs: storedLogs ? JSON.parse(storedLogs) : {},
        settings: storedSettings ? JSON.parse(storedSettings) : {
          reminderTime: '20:00',
          notificationsEnabled: true,
          soundEnabled: true,
          onboardingCompleted: false,
        },
        isLoaded: true,
      });
    } catch (e) {
      console.error('Error cargando storage local:', e);
      set({ isLoaded: true });
    }
  },

  createInitialHabit: async (name, color, anchorText, reminderTime = '20:00') => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: name.trim(),
      color,
      anchorText: anchorText?.trim() || undefined,
      status: 'active',
      currentStreak: 0,
      bestStreak: 0,
      totalCompletedDays: 0,
      shieldsAvailable: 2,
      createdAt: new Date().toISOString(),
      stickersUnlocked: ['🌱 Primer Paso'],
    };

    const newSettings: AppSettings = {
      ...get().settings,
      reminderTime,
      onboardingCompleted: true,
    };

    const updatedHabits = [newHabit];

    set({ habits: updatedHabits, settings: newSettings });

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits)),
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings)),
    ]);
  },

  toggleDayCompletion: async (habitId, dateStr) => {
    const { habits, logs } = get();
    const logKey = `${habitId}_${dateStr}`;
    const currentLog = logs[logKey];
    const habit = habits.find((h) => h.id === habitId);

    if (!habit) return;

    let updatedLogs = { ...logs };
    let updatedHabits = habits.map((h) => {
      if (h.id !== habitId) return h;

      if (currentLog?.status === 'completed') {
        // Desmarcar
        delete updatedLogs[logKey];
        const newStreak = Math.max(0, h.currentStreak - 1);
        return {
          ...h,
          currentStreak: newStreak,
          totalCompletedDays: Math.max(0, h.totalCompletedDays - 1),
        };
      } else {
        // Marcar completado
        updatedLogs[logKey] = {
          id: logKey,
          habitId,
          date: dateStr,
          status: 'completed',
          loggedAt: new Date().toISOString(),
        };

        const newStreak = h.currentStreak + 1;
        const newBest = Math.max(h.bestStreak, newStreak);
        const newTotal = h.totalCompletedDays + 1;

        // Comprobar stickers ganados
        let newStickers = [...h.stickersUnlocked];
        if (newStreak >= 7 && !newStickers.includes('🔥 7 Días')) {
          newStickers.push('🔥 7 Días');
        }
        if (newStreak >= 14 && !newStickers.includes('⚡ 14 Días')) {
          newStickers.push('⚡ 14 Días');
        }
        if (newStreak >= 21 && !newStickers.includes('🏆 Hábito 21 Días')) {
          newStickers.push('🏆 Hábito 21 Días');
        }

        return {
          ...h,
          currentStreak: newStreak,
          bestStreak: newBest,
          totalCompletedDays: newTotal,
          stickersUnlocked: newStickers,
        };
      }
    });

    set({ habits: updatedHabits, logs: updatedLogs });

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits)),
      AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs)),
    ]);
  },

  useShield: async (habitId, dateStr) => {
    const { habits, logs } = get();
    const logKey = `${habitId}_${dateStr}`;

    const updatedHabits = habits.map((h) => {
      if (h.id === habitId && h.shieldsAvailable > 0) {
        return {
          ...h,
          shieldsAvailable: h.shieldsAvailable - 1,
        };
      }
      return h;
    });

    const updatedLogs = {
      ...logs,
      [logKey]: {
        id: logKey,
        habitId,
        date: dateStr,
        status: 'shielded' as const,
        loggedAt: new Date().toISOString(),
      },
    };

    set({ habits: updatedHabits, logs: updatedLogs });

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits)),
      AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs)),
    ]);
  },

  resetStreak: async (habitId) => {
    const { habits } = get();
    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        return {
          ...h,
          currentStreak: 0,
        };
      }
      return h;
    });

    set({ habits: updatedHabits });
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
  },
}));
