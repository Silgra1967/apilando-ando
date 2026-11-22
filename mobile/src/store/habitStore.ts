import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, DailyLog, AppSettings, HabitStatus } from '../types/habit';
import { MilestoneCelebrationData } from '../components/MilestoneCelebrationModal';

interface HabitStore {
  habits: Habit[];
  logs: Record<string, DailyLog>; // key: `${habitId}_${date}`
  settings: AppSettings;
  isLoaded: boolean;
  
  // Acciones
  loadFromStorage: () => Promise<void>;
  createInitialHabit: (name: string, color: string, anchorText?: string, reminderTime?: string) => Promise<void>;
  promoteToMaintenance: (habitId: string) => Promise<void>;
  graduateToAnchor: (habitId: string) => Promise<void>;
  addNewActiveHabit: (name: string, color: string, anchorText?: string) => Promise<void>;
  toggleDayCompletion: (habitId: string, dateStr: string) => Promise<MilestoneCelebrationData | null>;
  useShield: (habitId: string, dateStr: string) => Promise<void>;
  resetStreak: (habitId: string) => Promise<void>;
  pauseHabit: (habitId: string) => Promise<void>;
  resumeHabit: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  checkPendingShieldsAndExpiration: () => Promise<{
    pendingHabit: Habit;
    missedDate: string;
  } | null>;
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

    if (!habit) return null;

    let updatedLogs = { ...logs };
    let celebrationResult: MilestoneCelebrationData | null = null;

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

        // Comprobar hitos y reposición de escudo (+1 si tiene menos de 3)
        let newShields = h.shieldsAvailable;
        let shieldReplenished = false;
        let milestoneMet = false;
        let stickerName = '';
        let stickerEmoji = '✨';

        if (newStreak === 7) {
          milestoneMet = true;
          stickerName = 'Semana Firme';
          stickerEmoji = '🔥';
        } else if (newStreak === 14) {
          milestoneMet = true;
          stickerName = 'Ritmo Vivo';
          stickerEmoji = '⚡';
        } else if (newStreak === 21) {
          milestoneMet = true;
          stickerName = 'Hábito Consolidado';
          stickerEmoji = '🌿';
        } else if (newStreak === 30) {
          milestoneMet = true;
          stickerName = 'Mes Imparable';
          stickerEmoji = '🌙';
        } else if (newStreak === 50) {
          milestoneMet = true;
          stickerName = 'Mitad de Cien';
          stickerEmoji = '⭐';
        } else if (newStreak === 100) {
          milestoneMet = true;
          stickerName = 'Centenario Dorado';
          stickerEmoji = '👑';
        }

        if (milestoneMet) {
          if (newShields < 3) {
            newShields = Math.min(3, newShields + 1);
            shieldReplenished = true;
          }

          celebrationResult = {
            habitName: h.name,
            streak: newStreak,
            stickerName,
            stickerEmoji,
            shieldReplenished,
            totalShields: newShields,
          };
        }

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
          shieldsAvailable: newShields,
          stickersUnlocked: newStickers,
        };
      }
    });

    set({ habits: updatedHabits, logs: updatedLogs });

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits)),
      AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs)),
    ]);

    return celebrationResult;
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

  promoteToMaintenance: async (habitId) => {
    const { habits } = get();
    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        let newStickers = [...h.stickersUnlocked];
        if (!newStickers.includes('🌿 Hábito Consolidado')) {
          newStickers.push('🌿 Hábito Consolidado');
        }
        return {
          ...h,
          status: 'maintenance' as const,
          promotedToMaintenanceAt: new Date().toISOString(),
          stickersUnlocked: newStickers,
        };
      }
      return h;
    });

    set({ habits: updatedHabits });
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
  },

  graduateToAnchor: async (habitId) => {
    const { habits } = get();
    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        let newStickers = [...h.stickersUnlocked];
        if (!newStickers.includes('🌳 Ancla de Vida')) {
          newStickers.push('🌳 Ancla de Vida');
        }
        return {
          ...h,
          status: 'anchor' as const,
          graduatedToAnchorAt: new Date().toISOString(),
          stickersUnlocked: newStickers,
        };
      }
      return h;
    });

    set({ habits: updatedHabits });
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
  },

  addNewActiveHabit: async (name, color, anchorText) => {
    const { habits } = get();
    // Validar que no haya otro hábito activo actualmente (o si hay, asegurarse de que se maneje)
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
      stickersUnlocked: ['🌱 Nuevo Comienzo'],
    };

    const updatedHabits = [...habits, newHabit];
    set({ habits: updatedHabits });
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
  },

  pauseHabit: async (habitId) => {
    const { habits } = get();
    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        return {
          ...h,
          status: 'paused' as const,
          pausedAt: new Date().toISOString(),
        };
      }
      return h;
    });

    set({ habits: updatedHabits });
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
  },

  resumeHabit: async (habitId) => {
    const { habits } = get();
    const target = habits.find((h) => h.id === habitId);
    if (!target) return;

    const hasActive = habits.some((h) => h.status === 'active' && h.id !== habitId);
    // Si ya hay un activo, vuelve a mantenimiento si ya fue promovido antes, o activo si no hay ninguno activo
    const nextStatus: HabitStatus = hasActive ? 'maintenance' : (target.promotedToMaintenanceAt ? 'maintenance' : 'active');

    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        return {
          ...h,
          status: nextStatus,
          pausedAt: undefined,
        };
      }
      return h;
    });

    set({ habits: updatedHabits });
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
  },

  archiveHabit: async (habitId) => {
    const { habits } = get();
    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        return {
          ...h,
          status: 'archived' as const,
          archivedAt: new Date().toISOString(),
        };
      }
      return h;
    });

    set({ habits: updatedHabits });
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
  },

  updateSettings: async (newSettings) => {
    const { settings } = get();
    const merged = { ...settings, ...newSettings };
    set({ settings: merged });
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
  },

  resetAllData: async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.HABITS),
      AsyncStorage.removeItem(STORAGE_KEYS.LOGS),
      AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
    ]);

    set({
      habits: [],
      logs: {},
      settings: {
        reminderTime: '20:00',
        notificationsEnabled: true,
        soundEnabled: true,
        onboardingCompleted: false,
      },
    });
  },

  checkPendingShieldsAndExpiration: async () => {
    const { habits, logs } = get();
    const activeHabit = habits.find((h) => h.status === 'active');
    if (!activeHabit) return null;

    const now = new Date();
    // Ayer
    const yesterday = new Date(Date.now() - 86400000);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    // Anteayer
    const dayBefore = new Date(Date.now() - 86400000 * 2);
    const bYear = dayBefore.getFullYear();
    const bMonth = String(dayBefore.getMonth() + 1).padStart(2, '0');
    const bDay = String(dayBefore.getDate()).padStart(2, '0');
    const dayBeforeStr = `${bYear}-${bMonth}-${bDay}`;

    const yesterdayLog = logs[`${activeHabit.id}_${yesterdayStr}`];
    const dayBeforeLog = logs[`${activeHabit.id}_${dayBeforeStr}`];

    // 1. Expiración estricta a las 23:59 del día siguiente:
    // Si anteayer no se tildó ni se protegió y la racha era > 0, se rompió la ventana de confirmación
    if (
      (!dayBeforeLog || dayBeforeLog.status === 'missed') &&
      activeHabit.currentStreak > 0 &&
      now.getTime() - dayBefore.getTime() > 86400000 * 2
    ) {
      // Reiniciar racha por expiración sin culpa
      const updated = habits.map((h) =>
        h.id === activeHabit.id ? { ...h, currentStreak: 0 } : h
      );
      set({ habits: updated });
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
    }

    // 2. Detección automática de escudo pendiente de ayer
    // Si ayer no se tildó y hay escudos disponibles y la racha es > 0
    if (
      !yesterdayLog &&
      activeHabit.shieldsAvailable > 0 &&
      activeHabit.currentStreak > 0
    ) {
      return {
        pendingHabit: activeHabit,
        missedDate: yesterdayStr,
      };
    }

    return null;
  },
}));
