export type HabitStatus =
  | 'active'        // 🌱 En construcción (máximo 1 simultáneo)
  | 'maintenance'   // 🌿 Consolidado, en seguimiento activo
  | 'anchor'        // 🌳 Graduado (sin checkbox, contexto)
  | 'paused'        // ⏸️ Congelado temporalmente
  | 'archived';     // 📦 Cerrado definitivamente

export interface Habit {
  id: string;
  name: string;
  color: string;
  anchorText?: string;
  status: HabitStatus;
  
  currentStreak: number;
  bestStreak: number;
  totalCompletedDays: number;
  shieldsAvailable: number; // Inicia en 2, tope 3
  
  createdAt: string;
  promotedToMaintenanceAt?: string;
  graduatedToAnchorAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  archivedAt?: string;
  
  stickersUnlocked: string[];
  rewardedMilestones?: number[];
}

export type DayStatus = 'completed' | 'shielded' | 'missed' | 'paused';

export interface DailyLog {
  id: string; // `${habitId}_${date}`
  habitId: string;
  date: string; // YYYY-MM-DD
  status: DayStatus;
  loggedAt?: string;
}

export type ThemeMode = 'light' | 'dark';
export type AppLanguage = 'es' | 'en';

export interface AppSettings {
  userName?: string;
  reminderTime: string; // "20:00"
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  onboardingCompleted: boolean;
  lastMonthlyReviewDismissed?: string; // Formato YYYY-MM
  themeMode: ThemeMode;
  language: AppLanguage;
}

/**
 * Determina si un hábito en mantenimiento ya cumplió 6 meses para graduarse a Ancla.
 */
export function isEligibleForAnchorGraduation(
  habit: Habit,
  currentDate: Date = new Date()
): boolean {
  if (habit.status !== 'maintenance' || !habit.promotedToMaintenanceAt) return false;
  const promotedDate = new Date(habit.promotedToMaintenanceAt);
  const thresholdDate = new Date(promotedDate);
  thresholdDate.setMonth(thresholdDate.getMonth() + 6);
  return currentDate.getTime() >= thresholdDate.getTime();
}

export function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function parseLocalDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Habilita promover a Mantenimiento y sumar un nuevo hábito recién en el día 22
 * (cuando ya cumplió los 21 días y no completó el día 21 hoy mismo).
 */
export function isReadyForMaintenancePromotion(
  habit: Habit,
  logs: Record<string, DailyLog>,
  todayStr: string = toLocalDateStr(new Date())
): boolean {
  if (habit.status !== 'active' || habit.currentStreak < 21) return false;
  const completedToday = logs[`${habit.id}_${todayStr}`]?.status === 'completed';
  if (habit.currentStreak === 21 && completedToday) {
    return false;
  }
  return true;
}
