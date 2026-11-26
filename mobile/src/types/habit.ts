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
 * Umbrales de ciclo de vida (configurados para prueba real: 5 días y 10 días).
 * Para producción definitiva: CONSOLIDATION_DAYS = 21, ANCHOR_GRADUATION_DAYS = 180.
 */
export const CONSOLIDATION_DAYS = 5;
export const ANCHOR_GRADUATION_DAYS = 10;

/**
 * Determina si un hábito en Perseverando ya cumplió el tiempo requerido para graduarse a Ancla.
 */
export function isEligibleForAnchorGraduation(
  habit: Habit,
  currentDate: Date = new Date()
): boolean {
  if (habit.status !== 'maintenance' || !habit.promotedToMaintenanceAt) return false;
  const promotedDay = parseLocalDateStr(toLocalDateStr(new Date(habit.promotedToMaintenanceAt)));
  const currentDay = parseLocalDateStr(toLocalDateStr(currentDate));
  const diffDays = Math.floor((currentDay.getTime() - promotedDay.getTime()) / 86400000);
  return diffDays >= ANCHOR_GRADUATION_DAYS;
}

export function getDaysRemainingToAnchor(
  habit: Habit,
  currentDate: Date = new Date()
): number {
  if (!habit.promotedToMaintenanceAt) return ANCHOR_GRADUATION_DAYS;
  const promotedDay = parseLocalDateStr(toLocalDateStr(new Date(habit.promotedToMaintenanceAt)));
  const currentDay = parseLocalDateStr(toLocalDateStr(currentDate));
  const diffDays = Math.max(0, Math.floor((currentDay.getTime() - promotedDay.getTime()) / 86400000));
  return Math.max(1, ANCHOR_GRADUATION_DAYS - diffDays);
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
 * Habilita promover a Perseverando y sumar un nuevo hábito recién al día siguiente
 * de cumplir CONSOLIDATION_DAYS (para no superponer días).
 */
export function isReadyForMaintenancePromotion(
  habit: Habit,
  logs: Record<string, DailyLog>,
  todayStr: string = toLocalDateStr(new Date())
): boolean {
  if (habit.status !== 'active' || habit.currentStreak < CONSOLIDATION_DAYS) return false;
  const completedToday = logs[`${habit.id}_${todayStr}`]?.status === 'completed';
  if (habit.currentStreak === CONSOLIDATION_DAYS && completedToday) {
    return false;
  }
  return true;
}
