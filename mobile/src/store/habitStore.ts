import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, DailyLog, AppSettings, HabitStatus } from '../types/habit';
import { MilestoneCelebrationData } from '../components/MilestoneCelebrationModal';
import { scheduleDailyReminder } from '../services/notificationService';

export function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function areTodayCheckableHabitsCompleted(
  habits: Habit[],
  logs: Record<string, DailyLog>
): boolean {
  const todayStr = toLocalDateStr(new Date());
  const checkable = habits.filter((h) => h.status === 'active' || h.status === 'maintenance');
  return (
    checkable.length > 0 &&
    checkable.every((h) => logs[`${h.id}_${todayStr}`]?.status === 'completed')
  );
}

interface HabitStore {
  habits: Habit[];
  logs: Record<string, DailyLog>; // key: `${habitId}_${date}`
  settings: AppSettings;
  isLoaded: boolean;
  
  // Acciones
  loadFromStorage: () => Promise<void>;
  createInitialHabit: (
    name: string,
    color: string,
    anchorText?: string,
    reminderTime?: string,
    userName?: string
  ) => Promise<void>;
  promoteToMaintenance: (habitId: string) => Promise<void>;
  graduateToAnchor: (habitId: string) => Promise<void>;
  addNewActiveHabit: (name: string, color: string, anchorText?: string) => Promise<void>;
  toggleDayCompletion: (habitId: string, dateStr: string) => Promise<MilestoneCelebrationData | null>;
  useShield: (habitId: string, dateStr: string) => Promise<void>;
  resetStreak: (habitId: string) => Promise<void>;
  resolveShieldDecisions: (
    dateStr: string,
    protectedHabitIds: string[],
    resetHabitIds: string[]
  ) => Promise<void>;
  pauseHabit: (habitId: string) => Promise<void>;
  resumeHabit: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  checkPendingShieldsAndExpiration: () => Promise<{
    pendingHabits: Habit[];
    missedDate: string;
  } | null>;
  setSimulatedStreak: (habitId: string, streak: number, shields?: number) => Promise<void>;
  simulateSixMonthsReady: (habitId: string) => Promise<void>;
  simulateFullHistoryEnvironment: () => Promise<void>;
}

const STORAGE_KEYS = {
  HABITS: '@apliando_habits',
  LOGS: '@apliando_logs',
  SETTINGS: '@apliando_settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  reminderTime: '20:00',
  notificationsEnabled: true,
  soundEnabled: true,
  onboardingCompleted: false,
  themeMode: 'light',
  language: 'es',
};

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  logs: {},
  settings: DEFAULT_SETTINGS,
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
        settings: storedSettings
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) }
          : DEFAULT_SETTINGS,
        isLoaded: true,
      });
    } catch (e) {
      console.error('Error cargando storage local:', e);
      set({ isLoaded: true });
    }
  },

  createInitialHabit: async (name, color, anchorText, reminderTime = '20:00', userName) => {
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
      userName: userName?.trim() || undefined,
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

    const { settings } = get();
    if (settings.notificationsEnabled && dateStr === toLocalDateStr(new Date())) {
      void scheduleDailyReminder(
        settings.reminderTime || '20:00',
        areTodayCheckableHabitsCompleted(updatedHabits, updatedLogs)
      );
    }

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

  resolveShieldDecisions: async (dateStr, protectedHabitIds, resetHabitIds) => {
    const { habits, logs } = get();
    const protectSet = new Set(protectedHabitIds);
    const resetSet = new Set(resetHabitIds);
    const updatedLogs = { ...logs };
    const nowISO = new Date().toISOString();

    const updatedHabits = habits.map((h) => {
      if (protectSet.has(h.id) && h.shieldsAvailable > 0) {
        const logKey = `${h.id}_${dateStr}`;
        updatedLogs[logKey] = {
          id: logKey,
          habitId: h.id,
          date: dateStr,
          status: 'shielded',
          loggedAt: nowISO,
        };
        return {
          ...h,
          shieldsAvailable: h.shieldsAvailable - 1,
        };
      }
      if (resetSet.has(h.id)) {
        const logKey = `${h.id}_${dateStr}`;
        updatedLogs[logKey] = {
          id: logKey,
          habitId: h.id,
          date: dateStr,
          status: 'missed',
          loggedAt: nowISO,
        };
        return {
          ...h,
          currentStreak: 0,
        };
      }
      return h;
    });

    set({ habits: updatedHabits, logs: updatedLogs });

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits)),
      AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs)),
    ]);
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
      settings: DEFAULT_SETTINGS,
    });
  },

  checkPendingShieldsAndExpiration: async () => {
    const { habits, logs } = get();
    const checkableHabits = habits.filter(
      (h) => h.status === 'active' || h.status === 'maintenance'
    );
    if (checkableHabits.length === 0) return null;

    const now = new Date();
    const todayStr = toLocalDateStr(now);

    // Ayer
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = toLocalDateStr(yesterday);

    // Anteayer
    const dayBefore = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
    const dayBeforeStr = toLocalDateStr(dayBefore);

    // 1. Expiración estricta a las 23:59 del día siguiente para hábitos activos y en mantenimiento
    // Solo aplica si el hábito ya existía anteayer (dayBeforeStr >= createdDateStr)
    let expiredAny = false;
    const updatedAfterExpiration = habits.map((h) => {
      if (h.status !== 'active' && h.status !== 'maintenance') return h;
      const createdDateStr = toLocalDateStr(new Date(h.createdAt));
      if (dayBeforeStr < createdDateStr) return h;

      const dayBeforeLog = logs[`${h.id}_${dayBeforeStr}`];
      const yesterdayLog = logs[`${h.id}_${yesterdayStr}`];
      if (
        (!dayBeforeLog || dayBeforeLog.status === 'missed') &&
        (!yesterdayLog || yesterdayLog.status === 'missed') &&
        h.currentStreak > 0
      ) {
        expiredAny = true;
        return { ...h, currentStreak: 0 };
      }
      return h;
    });

    if (expiredAny) {
      set({ habits: updatedAfterExpiration });
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedAfterExpiration));
    }

    // 2. Detección agrupada de escudos pendientes de ayer (active primero, luego maintenance)
    // Nunca ofrecer protección para un día anterior a la creación del hábito ni sin racha previa a hoy
    const pendingHabits = updatedAfterExpiration
      .filter((h) => h.status === 'active' || h.status === 'maintenance')
      .sort((a, b) => (a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0))
      .filter((h) => {
        const createdDateStr = toLocalDateStr(new Date(h.createdAt));
        if (yesterdayStr < createdDateStr) return false;

        const yesterdayLog = logs[`${h.id}_${yesterdayStr}`];
        const todayCompleted = logs[`${h.id}_${todayStr}`]?.status === 'completed';
        const streakBeforeToday = todayCompleted ? h.currentStreak - 1 : h.currentStreak;

        return !yesterdayLog && h.shieldsAvailable > 0 && streakBeforeToday > 0;
      });

    if (pendingHabits.length > 0) {
      return {
        pendingHabits,
        missedDate: yesterdayStr,
      };
    }

    return null;
  },

  setSimulatedStreak: async (habitId, streak, shields = 1) => {
    const { habits, logs } = get();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const updatedLogs = { ...logs };
    delete updatedLogs[`${habitId}_${todayStr}`];

    const updated = habits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            currentStreak: streak,
            bestStreak: Math.max(h.bestStreak, streak),
            totalCompletedDays: Math.max(h.totalCompletedDays, streak),
            shieldsAvailable: shields,
          }
        : h
    );
    set({ habits: updated, logs: updatedLogs });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated)),
      AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs)),
    ]);
  },

  simulateSixMonthsReady: async (habitId) => {
    const { habits } = get();
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString();

    const updated = habits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            status: 'maintenance' as const,
            promotedToMaintenanceAt: sixMonthsAgo,
            currentStreak: Math.max(h.currentStreak, 180),
            bestStreak: Math.max(h.bestStreak, 180),
            totalCompletedDays: Math.max(h.totalCompletedDays, 180),
            shieldsAvailable: 3,
          }
        : h
    );
    set({ habits: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
  },

  simulateFullHistoryEnvironment: async () => {
    const now = new Date();
    const nowISO = now.toISOString();

    // 1. Hábito Graduado a Ancla (Trofeo de racha 180 días)
    const anchorHabit: Habit = {
      id: 'sim_anchor_1',
      name: 'Caminar 20 minutos',
      color: '#8FA89B',
      anchorText: 'Después del café mañanero',
      status: 'anchor',
      currentStreak: 180,
      bestStreak: 180,
      totalCompletedDays: 180,
      shieldsAvailable: 3,
      createdAt: new Date(Date.now() - 86400000 * 200).toISOString(),
      promotedToMaintenanceAt: new Date(Date.now() - 86400000 * 180).toISOString(),
      graduatedToAnchorAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      stickersUnlocked: [
        '🌱 Primer Paso',
        '🔥 Semana Firme',
        '⚡ Ritmo Vivo',
        '🌿 Hábito Consolidado',
        '🌙 Mes Imparable',
        '👑 Centenario Dorado',
        '🌳 Ancla Eterna',
      ],
    };

    // 2. Hábito en Mantenimiento (Consolidado, tildable diario, racha 45 días)
    const maintenanceHabit: Habit = {
      id: 'sim_maint_1',
      name: 'Leer 10 minutos',
      color: '#D6C7A1',
      anchorText: '↳ Después de Caminar 20 minutos',
      status: 'maintenance',
      currentStreak: 45,
      bestStreak: 45,
      totalCompletedDays: 45,
      shieldsAvailable: 2,
      createdAt: new Date(Date.now() - 86400000 * 50).toISOString(),
      promotedToMaintenanceAt: new Date(Date.now() - 86400000 * 24).toISOString(),
      stickersUnlocked: [
        '🌱 Primer Paso',
        '🔥 Semana Firme',
        '⚡ Ritmo Vivo',
        '🌿 Hábito Consolidado',
        '🌙 Mes Imparable',
      ],
    };

    // 3. Hábito Activo en Construcción (Día 12 de 21)
    const activeHabit: Habit = {
      id: 'sim_active_1',
      name: 'Meditar 5 minutos',
      color: '#A89BB9',
      anchorText: '↳ Después de Leer 10 minutos',
      status: 'active',
      currentStreak: 12,
      bestStreak: 12,
      totalCompletedDays: 12,
      shieldsAvailable: 2,
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      stickersUnlocked: ['🌱 Primer Paso', '🔥 Semana Firme'],
    };

    // 4. Hábito Pausado (por viaje o lesión)
    const pausedHabit: Habit = {
      id: 'sim_paused_1',
      name: 'Entrenar fuerza en casa',
      color: '#D97D64',
      status: 'paused',
      currentStreak: 15,
      bestStreak: 15,
      totalCompletedDays: 15,
      shieldsAvailable: 1,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      pausedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      stickersUnlocked: ['🌱 Primer Paso', '🔥 Semana Firme', '⚡ Ritmo Vivo'],
    };

    // 5. Generar historial de registros diarios del mes actual para el calendario
    const simulatedLogs: Record<string, DailyLog> = {};
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayNum = now.getDate();

    // Llenar días previos del mes para que los calendarios se vean vivos
    for (let d = 1; d <= todayNum; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      // Hábito ancla (casi todos completados)
      simulatedLogs[`${anchorHabit.id}_${dateStr}`] = {
        id: `${anchorHabit.id}_${dateStr}`,
        habitId: anchorHabit.id,
        date: dateStr,
        status: 'completed',
        loggedAt: nowISO,
      };

      // Hábito mantenimiento
      if (d % 6 === 0) {
        simulatedLogs[`${maintenanceHabit.id}_${dateStr}`] = {
          id: `${maintenanceHabit.id}_${dateStr}`,
          habitId: maintenanceHabit.id,
          date: dateStr,
          status: 'shielded',
          loggedAt: nowISO,
        };
      } else if (d < todayNum) {
        simulatedLogs[`${maintenanceHabit.id}_${dateStr}`] = {
          id: `${maintenanceHabit.id}_${dateStr}`,
          habitId: maintenanceHabit.id,
          date: dateStr,
          status: 'completed',
          loggedAt: nowISO,
        };
      }

      // Hábito activo (últimos 12 días)
      if (d > todayNum - 12 && d < todayNum) {
        simulatedLogs[`${activeHabit.id}_${dateStr}`] = {
          id: `${activeHabit.id}_${dateStr}`,
          habitId: activeHabit.id,
          date: dateStr,
          status: 'completed',
          loggedAt: nowISO,
        };
      }
    }

    const allSimulatedHabits = [anchorHabit, maintenanceHabit, activeHabit, pausedHabit];

    set({ habits: allSimulatedHabits, logs: simulatedLogs });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(allSimulatedHabits)),
      AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(simulatedLogs)),
    ]);
  },
}));
