import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Habit,
  DailyLog,
  AppSettings,
  HabitStatus,
  isEligibleForAnchorGraduation,
  isReadyForMaintenancePromotion,
  toLocalDateStr,
} from '../types/habit';
import { MilestoneCelebrationData } from '../components/MilestoneCelebrationModal';
import {
  scheduleDailyReminder,
  cancelDailyReminders,
  cancelShieldAlerts,
} from '../services/notificationService';

export { toLocalDateStr };

function generateHabitId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function unlockShieldSticker(stickers: string[]): string[] {
  const label = '🛡️ Guardián Resiliente';
  return stickers.includes(label) ? stickers : [...stickers, label];
}

function safeJsonParse<T>(
  raw: string | null,
  fallback: T,
  isValid?: (val: unknown) => val is T
): T {
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValid && !isValid(parsed)) {
      return fallback;
    }
    return parsed as T;
  } catch (err) {
    console.warn('Registro local corrupto, usando respaldo seguro:', err);
    return fallback;
  }
}

function isPlainRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function getEffectiveStartDateStr(habit: Habit): string {
  const createdDateStr = toLocalDateStr(new Date(habit.createdAt));
  if (!habit.resumedAt) return createdDateStr;
  const resumedDateStr = toLocalDateStr(new Date(habit.resumedAt));
  return resumedDateStr > createdDateStr ? resumedDateStr : createdDateStr;
}

async function safePersist(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error guardando ${key} en storage local:`, err);
  }
}

async function safeRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn(`Error eliminando ${key} en storage local:`, err);
  }
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
  addNewActiveHabit: (name: string, color: string, anchorText?: string) => Promise<boolean>;
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

const STREAK_MILESTONES: ReadonlyArray<{
  streak: number;
  title: string;
  emoji: string;
  stickerLabel: string;
}> = [
  { streak: 7, title: 'Semana Firme', emoji: '🔥', stickerLabel: '🔥 7 Días' },
  { streak: 14, title: 'Ritmo Vivo', emoji: '⚡', stickerLabel: '⚡ 14 Días' },
  { streak: 21, title: 'Hábito Consolidado', emoji: '🌿', stickerLabel: '🏆 Hábito 21 Días' },
  { streak: 30, title: 'Mes Imparable', emoji: '🌙', stickerLabel: '🌙 Mes Imparable' },
  { streak: 50, title: 'Mitad de Cien', emoji: '⭐', stickerLabel: '⭐ Mitad de Cien' },
  { streak: 90, title: 'Trimestre Sólido', emoji: '💎', stickerLabel: '💎 90 Días' },
  { streak: 100, title: 'Centenario Dorado', emoji: '👑', stickerLabel: '👑 Centenario Dorado' },
];

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  logs: {},
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadFromStorage: async () => {
    try {
      const [storedHabits, storedLogs, storedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HABITS).catch(() => null),
        AsyncStorage.getItem(STORAGE_KEYS.LOGS).catch(() => null),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS).catch(() => null),
      ]);

      const parsedHabits = safeJsonParse<Habit[]>(
        storedHabits,
        [],
        (v): v is Habit[] => Array.isArray(v)
      );
      const parsedLogs = safeJsonParse<Record<string, DailyLog>>(
        storedLogs,
        {},
        (v): v is Record<string, DailyLog> => isPlainRecord(v)
      );
      const parsedSettings = safeJsonParse<Partial<AppSettings>>(
        storedSettings,
        {},
        (v): v is Partial<AppSettings> => isPlainRecord(v)
      );

      const mergedSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...parsedSettings,
        // Si ya existen hábitos válidos pero settings se corrompió, no devolver al Onboarding
        onboardingCompleted:
          parsedSettings.onboardingCompleted ?? parsedHabits.length > 0,
      };

      set({
        habits: parsedHabits,
        logs: parsedLogs,
        settings: mergedSettings,
        isLoaded: true,
      });
    } catch (e) {
      console.error('Error cargando storage local:', e);
      set({ isLoaded: true });
    }
  },

  createInitialHabit: async (name, color, anchorText, reminderTime = '20:00', userName) => {
    const { settings, habits } = get();
    if (settings.onboardingCompleted && habits.length > 0) return;

    const newHabit: Habit = {
      id: generateHabitId(),
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
      rewardedMilestones: [],
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
      safePersist(STORAGE_KEYS.HABITS, updatedHabits),
      safePersist(STORAGE_KEYS.SETTINGS, newSettings),
    ]);
  },

  toggleDayCompletion: async (habitId, dateStr) => {
    const todayStr = toLocalDateStr(new Date());
    // Regla invariable: sin registro retroactivo ni fechas futuras
    if (dateStr !== todayStr) return null;

    const { habits, logs } = get();
    const logKey = `${habitId}_${dateStr}`;
    const currentLog = logs[logKey];
    const habit = habits.find((h) => h.id === habitId);

    if (!habit || (habit.status !== 'active' && habit.status !== 'maintenance')) return null;

    let updatedLogs = { ...logs };
    let celebrationResult: MilestoneCelebrationData | null = null;

    let updatedHabits = habits.map((h) => {
      if (h.id !== habitId) return h;

      if (currentLog?.status === 'completed') {
        // Desmarcar
        delete updatedLogs[logKey];
        const newStreak = Math.max(0, h.currentStreak - 1);
        const newTotal = Math.max(0, h.totalCompletedDays - 1);
        return {
          ...h,
          currentStreak: newStreak,
          bestStreak: newTotal === 0 ? 0 : h.bestStreak,
          totalCompletedDays: newTotal,
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

        // Comprobar hitos y reposición de escudo (+1 si tiene menos de 3, una sola vez por hito)
        let newShields = h.shieldsAvailable;
        let shieldReplenished = false;
        const baseRewarded =
          h.rewardedMilestones ??
          STREAK_MILESTONES.filter((m) => m.streak <= h.bestStreak).map((m) => m.streak);
        const newRewardedMilestones = [...baseRewarded];
        const newStickers = [...h.stickersUnlocked];

        const matchedMilestone = STREAK_MILESTONES.find((m) => m.streak === newStreak);
        if (matchedMilestone && !newRewardedMilestones.includes(newStreak)) {
          newRewardedMilestones.push(newStreak);

          if (newShields < 3) {
            newShields = Math.min(3, newShields + 1);
            shieldReplenished = true;
          }

          celebrationResult = {
            habitName: h.name,
            streak: newStreak,
            stickerName: matchedMilestone.title,
            stickerEmoji: matchedMilestone.emoji,
            shieldReplenished,
            totalShields: newShields,
          };
        }

        // Asegurar stickers ganados para todos los hitos alcanzados
        for (const milestone of STREAK_MILESTONES) {
          if (newStreak >= milestone.streak && !newStickers.includes(milestone.stickerLabel)) {
            newStickers.push(milestone.stickerLabel);
          }
        }

        return {
          ...h,
          currentStreak: newStreak,
          bestStreak: newBest,
          totalCompletedDays: newTotal,
          shieldsAvailable: newShields,
          stickersUnlocked: newStickers,
          rewardedMilestones: newRewardedMilestones,
        };
      }
    });

    set({ habits: updatedHabits, logs: updatedLogs });

    await Promise.all([
      safePersist(STORAGE_KEYS.HABITS, updatedHabits),
      safePersist(STORAGE_KEYS.LOGS, updatedLogs),
    ]);

    const { settings } = get();
    if (settings.notificationsEnabled && dateStr === toLocalDateStr(new Date())) {
      void scheduleDailyReminder(
        settings.reminderTime || '20:00',
        areTodayCheckableHabitsCompleted(updatedHabits, updatedLogs),
        settings.language || 'es'
      );
    }

    return celebrationResult;
  },

  useShield: async (habitId, dateStr) => {
    const { habits, logs } = get();
    const targetHabit = habits.find((h) => h.id === habitId);
    const logKey = `${habitId}_${dateStr}`;
    const existingLog = logs[logKey];

    if (
      !targetHabit ||
      (targetHabit.status !== 'active' && targetHabit.status !== 'maintenance') ||
      targetHabit.shieldsAvailable <= 0 ||
      existingLog?.status === 'completed' ||
      existingLog?.status === 'shielded'
    ) {
      return;
    }

    const updatedHabits = habits.map((h) => {
      if (h.id === habitId && h.shieldsAvailable > 0) {
        return {
          ...h,
          shieldsAvailable: h.shieldsAvailable - 1,
          stickersUnlocked: unlockShieldSticker(h.stickersUnlocked),
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
      safePersist(STORAGE_KEYS.HABITS, updatedHabits),
      safePersist(STORAGE_KEYS.LOGS, updatedLogs),
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
    await safePersist(STORAGE_KEYS.HABITS, updatedHabits);
  },

  resolveShieldDecisions: async (dateStr, protectedHabitIds, resetHabitIds) => {
    const { habits, logs } = get();
    const protectSet = new Set(protectedHabitIds);
    const resetSet = new Set(resetHabitIds);
    const updatedLogs = { ...logs };
    const nowISO = new Date().toISOString();
    const todayStr = toLocalDateStr(new Date());

    const updatedHabits = habits.map((h) => {
      if (h.status !== 'active' && h.status !== 'maintenance') return h;

      const effectiveStartDateStr = getEffectiveStartDateStr(h);
      if (dateStr < effectiveStartDateStr) return h;

      const logKey = `${h.id}_${dateStr}`;
      const existingLog = logs[logKey];
      if (existingLog?.status === 'completed' || existingLog?.status === 'shielded') {
        return h;
      }

      if (protectSet.has(h.id) && h.shieldsAvailable > 0) {
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
          stickersUnlocked: unlockShieldSticker(h.stickersUnlocked),
        };
      }
      if (resetSet.has(h.id)) {
        updatedLogs[logKey] = {
          id: logKey,
          habitId: h.id,
          date: dateStr,
          status: 'missed',
          loggedAt: nowISO,
        };
        const todayCompleted = logs[`${h.id}_${todayStr}`]?.status === 'completed';
        return {
          ...h,
          currentStreak: todayCompleted ? 1 : 0,
        };
      }
      return h;
    });

    set({ habits: updatedHabits, logs: updatedLogs });

    await Promise.all([
      safePersist(STORAGE_KEYS.HABITS, updatedHabits),
      safePersist(STORAGE_KEYS.LOGS, updatedLogs),
    ]);
  },

  promoteToMaintenance: async (habitId) => {
    const { habits, logs } = get();
    const target = habits.find((h) => h.id === habitId);
    if (!target || !isReadyForMaintenancePromotion(target, logs, toLocalDateStr(new Date()))) {
      return;
    }

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
    await safePersist(STORAGE_KEYS.HABITS, updatedHabits);
  },

  graduateToAnchor: async (habitId) => {
    const { habits } = get();
    const target = habits.find((h) => h.id === habitId);
    if (!target || !isEligibleForAnchorGraduation(target)) return;

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
    await safePersist(STORAGE_KEYS.HABITS, updatedHabits);
  },

  addNewActiveHabit: async (name, color, anchorText) => {
    const { habits } = get();
    const trimmedName = name.trim();
    if (!trimmedName) return false;

    // Regla invariable: solo puede existir un hábito activo en construcción a la vez
    if (habits.some((h) => h.status === 'active')) {
      return false;
    }

    const newHabit: Habit = {
      id: generateHabitId(),
      name: trimmedName,
      color,
      anchorText: anchorText?.trim() || undefined,
      status: 'active',
      currentStreak: 0,
      bestStreak: 0,
      totalCompletedDays: 0,
      shieldsAvailable: 2,
      createdAt: new Date().toISOString(),
      stickersUnlocked: ['🌱 Nuevo Comienzo'],
      rewardedMilestones: [],
    };

    const updatedHabits = [...habits, newHabit];
    set({ habits: updatedHabits });
    await safePersist(STORAGE_KEYS.HABITS, updatedHabits);
    return true;
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
    await safePersist(STORAGE_KEYS.HABITS, updatedHabits);
  },

  resumeHabit: async (habitId) => {
    const { habits } = get();
    const target = habits.find((h) => h.id === habitId);
    if (!target || target.status !== 'paused') return;

    const hasActive = habits.some((h) => h.status === 'active' && h.id !== habitId);
    // Preservar estado previo sin duplicar nunca un hábito activo
    const nextStatus: HabitStatus = target.graduatedToAnchorAt
      ? 'anchor'
      : hasActive || target.promotedToMaintenanceAt
      ? 'maintenance'
      : 'active';

    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        return {
          ...h,
          status: nextStatus,
          pausedAt: undefined,
          resumedAt: new Date().toISOString(),
        };
      }
      return h;
    });

    set({ habits: updatedHabits });
    await safePersist(STORAGE_KEYS.HABITS, updatedHabits);
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
    await safePersist(STORAGE_KEYS.HABITS, updatedHabits);
  },

  updateSettings: async (newSettings) => {
    const { settings } = get();
    const merged = { ...settings, ...newSettings };
    set({ settings: merged });
    await safePersist(STORAGE_KEYS.SETTINGS, merged);
  },

  resetAllData: async () => {
    await Promise.all([
      safeRemove(STORAGE_KEYS.HABITS),
      safeRemove(STORAGE_KEYS.LOGS),
      safeRemove(STORAGE_KEYS.SETTINGS),
      cancelDailyReminders(),
      cancelShieldAlerts(),
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
    const nowISO = now.toISOString();
    const todayStr = toLocalDateStr(now);

    // Ayer
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = toLocalDateStr(yesterday);

    // Anteayer
    const dayBefore = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
    const dayBeforeStr = toLocalDateStr(dayBefore);

    const isDayCovered = (log?: DailyLog) =>
      log?.status === 'completed' || log?.status === 'shielded';

    // 1. Expiración estricta a las 23:59 del día siguiente y cierre sin escudos para ayer
    let habitsChanged = false;
    let logsChanged = false;
    const updatedLogs: Record<string, DailyLog> = { ...logs };

    const updatedAfterExpiration = habits.map((h) => {
      if (h.status !== 'active' && h.status !== 'maintenance') return h;
      const effectiveStartDateStr = getEffectiveStartDateStr(h);

      const todayCompleted = logs[`${h.id}_${todayStr}`]?.status === 'completed';
      const baseTodayStreak = todayCompleted ? 1 : 0;
      const yesterdayLog = logs[`${h.id}_${yesterdayStr}`];
      const dayBeforeLog = logs[`${h.id}_${dayBeforeStr}`];

      let nextStreak = h.currentStreak;

      // Caso A: Anteayer no fue cubierto (su ventana de gracia venció a las 23:59 de ayer)
      if (dayBeforeStr >= effectiveStartDateStr && !isDayCovered(dayBeforeLog)) {
        if (!isDayCovered(yesterdayLog)) {
          if (nextStreak > baseTodayStreak) {
            nextStreak = baseTodayStreak;
          }
        } else {
          // Ayer sí se cubrió, pero la racha previa a ayer se cortó por el hueco de anteayer
          const maxSinceYesterday =
            (yesterdayLog?.status === 'completed' ? 1 : 0) + baseTodayStreak;
          if (nextStreak > maxSinceYesterday) {
            nextStreak = maxSinceYesterday;
          }
        }
      }

      // Caso B: Ayer no fue cubierto y el hábito no tiene escudos disponibles para protegerlo
      if (
        yesterdayStr >= effectiveStartDateStr &&
        !isDayCovered(yesterdayLog) &&
        h.shieldsAvailable <= 0
      ) {
        if (nextStreak > baseTodayStreak) {
          nextStreak = baseTodayStreak;
        }
        const yesterdayKey = `${h.id}_${yesterdayStr}`;
        if (!updatedLogs[yesterdayKey] && h.currentStreak > baseTodayStreak) {
          updatedLogs[yesterdayKey] = {
            id: yesterdayKey,
            habitId: h.id,
            date: yesterdayStr,
            status: 'missed',
            loggedAt: nowISO,
          };
          logsChanged = true;
        }
      }

      if (nextStreak !== h.currentStreak) {
        habitsChanged = true;
        return { ...h, currentStreak: nextStreak };
      }
      return h;
    });

    if (habitsChanged || logsChanged) {
      set({
        ...(habitsChanged ? { habits: updatedAfterExpiration } : {}),
        ...(logsChanged ? { logs: updatedLogs } : {}),
      });
      await Promise.all([
        habitsChanged ? safePersist(STORAGE_KEYS.HABITS, updatedAfterExpiration) : Promise.resolve(),
        logsChanged ? safePersist(STORAGE_KEYS.LOGS, updatedLogs) : Promise.resolve(),
      ]);
    }

    // 2. Detección agrupada de escudos pendientes de ayer (active primero, luego maintenance)
    // Nunca ofrecer protección para un día anterior a la creación del hábito ni sin racha previa a hoy
    const pendingHabits = updatedAfterExpiration
      .filter((h) => h.status === 'active' || h.status === 'maintenance')
      .sort((a, b) => (a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0))
      .filter((h) => {
        const effectiveStartDateStr = getEffectiveStartDateStr(h);
        if (yesterdayStr < effectiveStartDateStr) return false;

        const yesterdayLog = updatedLogs[`${h.id}_${yesterdayStr}`];
        const todayCompleted = updatedLogs[`${h.id}_${todayStr}`]?.status === 'completed';
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
            rewardedMilestones: STREAK_MILESTONES.filter((m) => m.streak <= streak).map(
              (m) => m.streak
            ),
          }
        : h
    );
    set({ habits: updated, logs: updatedLogs });
    await Promise.all([
      safePersist(STORAGE_KEYS.HABITS, updated),
      safePersist(STORAGE_KEYS.LOGS, updatedLogs),
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
    await safePersist(STORAGE_KEYS.HABITS, updated);
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
      safePersist(STORAGE_KEYS.HABITS, allSimulatedHabits),
      safePersist(STORAGE_KEYS.LOGS, simulatedLogs),
    ]);
  },
}));
