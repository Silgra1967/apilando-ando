import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  CornerDownRight,
  Flame,
  Trophy,
  Shield,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Award,
  Leaf,
  Lock,
  PauseCircle,
  Archive,
  Play,
  Sprout,
} from 'lucide-react-native';
import { THEME, ThemeColors } from '../theme/colors';
import { useAppTheme } from '../theme/useAppTheme';
import { useTranslation, formatText } from '../i18n/translations';
import {
  Habit,
  isEligibleForAnchorGraduation,
  isReadyForMaintenancePromotion,
  parseLocalDateStr,
  toLocalDateStr,
} from '../types/habit';
import { findMilestoneSticker } from '../types/stickers';
import { useHabitStore } from '../store/habitStore';

interface DetailScreenProps {
  habit: Habit;
  currentDateKey?: string;
  onBack: () => void;
  onOpenAddHabit?: () => void;
  onOpenStickers?: () => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  habit,
  currentDateKey,
  onBack,
  onOpenAddHabit,
  onOpenStickers,
}) => {
  const {
    logs,
    promoteToMaintenance,
    graduateToAnchor,
    pauseHabit,
    resumeHabit,
    archiveHabit,
  } = useHabitStore();

  const now = currentDateKey ? parseLocalDateStr(currentDateKey) : new Date();
  const todayStr = currentDateKey || toLocalDateStr(now);
  const readyForMaintenance = isReadyForMaintenancePromotion(habit, logs, todayStr);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [confirmingAction, setConfirmingAction] = useState<'graduate' | 'archive' | null>(null);
  const { colors, shadows } = useAppTheme();
  const { t, language, locale } = useTranslation();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  useEffect(() => {
    setConfirmingAction(null);
  }, [habit.id]);

  const viewedDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewedYear = viewedDate.getFullYear();
  const viewedMonth = viewedDate.getMonth();
  const isCurrentMonth =
    viewedYear === now.getFullYear() && viewedMonth === now.getMonth();
  const createdDate = new Date(habit.createdAt);
  const isCreationMonth =
    viewedYear < createdDate.getFullYear() ||
    (viewedYear === createdDate.getFullYear() && viewedMonth <= createdDate.getMonth());
  const currentDayNum = now.getDate();

  const viewedMonthName = viewedDate.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  const capitalizedMonth = viewedMonthName.charAt(0).toUpperCase() + viewedMonthName.slice(1);

  const daysInViewedMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();
  const firstDayOffset = (new Date(viewedYear, viewedMonth, 1).getDay() + 6) % 7;

  const days = Array.from({ length: daysInViewedMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${viewedYear}-${String(viewedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const log = logs[`${habit.id}_${dateStr}`];

    let type: 'done' | 'shield' | 'today' | 'empty' = 'empty';

    if (log?.status === 'completed') {
      type = 'done';
    } else if (log?.status === 'shielded') {
      type = 'shield';
    } else if (isCurrentMonth && dayNum === currentDayNum) {
      type = 'today';
    }

    return { num: dayNum, type };
  });

  const calendarCells: Array<{ key: string; num?: number; type?: 'done' | 'shield' | 'today' | 'empty' }> = [
    ...Array.from({ length: firstDayOffset }, (_, i) => ({ key: `empty_${i}` })),
    ...days.map((d) => ({ key: `day_${d.num}`, num: d.num, type: d.type })),
  ];

  const daysRemainingTo21 = Math.max(0, 21 - habit.currentStreak);
  const progressPct = Math.min(100, Math.round((habit.currentStreak / 21) * 100));
  const readyForAnchorGraduation = isEligibleForAnchorGraduation(habit, now);
  const monthsRemainingToAnchor = useMemo(() => {
    if (!habit.promotedToMaintenanceAt) return 6;
    const promoted = new Date(habit.promotedToMaintenanceAt);
    const monthsPassed =
      (now.getFullYear() - promoted.getFullYear()) * 12 +
      (now.getMonth() - promoted.getMonth()) -
      (now.getDate() < promoted.getDate() ? 1 : 0);
    return Math.max(1, 6 - Math.max(0, monthsPassed));
  }, [habit.promotedToMaintenanceAt, now.getFullYear(), now.getMonth(), now.getDate()]);
  const latestRawSticker =
    habit.stickersUnlocked[habit.stickersUnlocked.length - 1] || '🌱 Primer Paso';
  const latestSticker = useMemo(() => {
    if (latestRawSticker.includes('90 Días')) {
      return `💎 ${t.modals.milestone90Name}`;
    }
    const matched = findMilestoneSticker(latestRawSticker);
    if (!matched) return latestRawSticker;
    const key = matched.id as keyof typeof t.stickers.items;
    const localized = t.stickers.items[key]?.name || matched.name;
    return `${matched.emoji} ${localized}`;
  }, [latestRawSticker, t]);

  const statusLabel =
    habit.status === 'active'
      ? t.detail.statusActive
      : habit.status === 'maintenance'
      ? t.detail.statusMaintenance
      : habit.status === 'anchor'
      ? t.detail.statusAnchor
      : habit.status === 'paused'
      ? t.detail.statusPaused
      : t.detail.statusArchived;

  const habitAccent = habit.color || colors.coral;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContent}>
          {/* SUB-BARRA DE NAVEGACIÓN & BADGE */}
          <View style={styles.topNav}>
            <View
              style={[
                styles.statusBadge,
                habit.status === 'maintenance' && styles.statusBadgeMaintenance,
                habit.status === 'paused' && styles.statusBadgeNeutral,
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: habitAccent }]} />
              <Text style={styles.statusBadgeText}>{statusLabel}</Text>
            </View>

            <TouchableOpacity
              onPress={onBack}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t.detail.backToToday}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ENCABEZADO HERO DEL HÁBITO */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={[styles.heroIconBox, { borderColor: habitAccent }]}>
                <Sprout size={26} color={habitAccent} />
              </View>
              <View style={styles.heroTitleCol}>
                <Text style={styles.habitTitle}>{habit.name}</Text>
                {habit.anchorText && (
                  <View style={styles.anchorRow}>
                    <CornerDownRight size={14} color={colors.coral} />
                    <Text style={styles.habitAnchor}>{habit.anchorText}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* MÉTRICAS TÁCTILES EN 3 TARJETAS */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHead}>
                <Text style={styles.metricLabel}>{t.detail.streak}</Text>
                <Flame size={16} color={colors.coral} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{habit.currentStreak}</Text>
                <Text style={styles.metricUnit}>
                  {habit.currentStreak === 1 ? t.detail.daySingular : t.detail.days}
                </Text>
              </View>
              <Text style={styles.metricSubCoral}>
                {habit.currentStreak > 0 ? t.detail.constant : t.detail.starting}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHead}>
                <Text style={styles.metricLabel}>{t.detail.record}</Text>
                <Trophy size={16} color={colors.aquaDark} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{habit.bestStreak}</Text>
                <Text style={styles.metricUnit}>
                  {habit.bestStreak === 1 ? t.detail.daySingular : t.detail.days}
                </Text>
              </View>
              <Text style={styles.metricSubMuted}>{t.detail.bestMark}</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHead}>
                <Text style={styles.metricLabel}>{t.detail.shields}</Text>
                <Shield size={16} color={colors.shieldGold} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{habit.shieldsAvailable}</Text>
                <Text style={styles.metricUnit}>/3</Text>
              </View>
              <Text style={styles.metricSubGold}>
                {habit.shieldsAvailable < 3 ? t.detail.shieldHint : '3/3'}
              </Text>
            </View>
          </View>

          {/* CALENDARIO MENSUAL MINIMALISTA LIBRE DE CULPA */}
          <View style={styles.calendarBox}>
            <View style={styles.calendarHeader}>
              <View style={styles.calendarTitleRow}>
                <Calendar size={18} color={colors.coral} />
                <Text style={styles.calendarTitle}>{capitalizedMonth}</Text>
              </View>
              <View style={styles.calendarNavRow}>
                <TouchableOpacity
                  style={[styles.calendarNavBtn, isCreationMonth && styles.calendarNavBtnDisabled]}
                  disabled={isCreationMonth}
                  onPress={() => setMonthOffset((prev) => prev - 1)}
                >
                  <ChevronLeft
                    size={18}
                    color={isCreationMonth ? colors.outline : colors.dark}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calendarNavBtn, isCurrentMonth && styles.calendarNavBtnDisabled]}
                  disabled={isCurrentMonth}
                  onPress={() => setMonthOffset((prev) => Math.min(0, prev + 1))}
                >
                  <ChevronRight
                    size={18}
                    color={isCurrentMonth ? colors.outline : colors.dark}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.weekDaysRow}>
              {(language === 'en'
                ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
                : ['L', 'M', 'M', 'J', 'V', 'S', 'D']
              ).map((d, idx) => (
                <Text key={idx} style={styles.weekDayText}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarCells.map((cell) => {
                if (!cell.num) {
                  return <View key={cell.key} style={styles.dayCellSpacer} />;
                }

                const isDone = cell.type === 'done';
                const isShield = cell.type === 'shield';
                const isToday = cell.type === 'today';

                return (
                  <View key={cell.key} style={styles.dayCellWrapper}>
                    <View
                      style={[
                        styles.dayCell,
                        isDone && styles.dayCellDone,
                        isShield && styles.dayCellShield,
                        isToday && styles.dayCellToday,
                      ]}
                    >
                      {isDone ? (
                        <Check size={15} color="#003836" strokeWidth={2.8} />
                      ) : isShield ? (
                        <Shield size={14} color={colors.shieldGold} />
                      ) : (
                        <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                          {cell.num}
                        </Text>
                      )}
                    </View>
                    {(isDone || isShield) && (
                      <Text style={styles.daySubNum}>{cell.num}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.aqua }]} />
                <Text style={styles.legendText}>{t.detail.legendCompleted}</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: colors.shieldGoldLight,
                      borderWidth: 1,
                      borderColor: colors.shieldGold,
                    },
                  ]}
                />
                <Text style={styles.legendText}>{t.detail.legendShielded}</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: colors.cream,
                      borderWidth: 1.5,
                      borderColor: colors.coral,
                    },
                  ]}
                />
                <Text style={styles.legendText}>{t.detail.legendToday}</Text>
              </View>
            </View>
          </View>

          {/* BANNER ÁLBUM DE LOGROS */}
          <TouchableOpacity
            style={styles.stickersBox}
            activeOpacity={0.85}
            onPress={onOpenStickers}
          >
            <View style={styles.stickersLeft}>
              <View style={styles.stickersIconCircle}>
                <Award size={20} color={colors.coral} />
              </View>
              <View style={styles.stickersTextCol}>
                <Text style={styles.stickersKicker}>
                  {formatText(t.detail.lastUnlocked, { count: habit.stickersUnlocked.length })}
                </Text>
                <Text style={styles.stickersTitle} numberOfLines={1}>
                  {latestSticker}
                </Text>
              </View>
            </View>
            <View style={styles.albumLinkRow}>
              <Text style={styles.albumLinkText}>{t.detail.albumLink}</Text>
              <ArrowRight size={15} color={colors.coral} />
            </View>
          </TouchableOpacity>

          {/* CICLO DE VIDA Y PROGRESIÓN */}
          <View style={styles.actionsBox}>
            {habit.status === 'active' && (
              <View style={styles.lifecycleProgressBlock}>
                <View style={styles.lifecycleHeader}>
                  <View style={styles.lifecycleTitleRow}>
                    <Leaf size={15} color={colors.limaDark} />
                    <Text style={styles.lifecycleTitle}>{t.detail.pathToMaintenance}</Text>
                  </View>
                  <Text style={styles.lifecycleCount}>
                    {formatText(t.detail.daysOf21, { count: habit.currentStreak, pct: progressPct })}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                </View>

                <Text style={styles.lifecycleHint}>
                  {daysRemainingTo21 > 0
                    ? formatText(t.detail.remainingToMaintenance, { count: daysRemainingTo21 })
                    : readyForMaintenance
                    ? t.detail.readyToMaintenance
                    : t.detail.waitTomorrowToMaintenance}
                </Text>

                {readyForMaintenance ? (
                  <TouchableOpacity
                    style={styles.promoteBtn}
                    onPress={async () => {
                      await promoteToMaintenance(habit.id);
                      if (onOpenAddHabit) onOpenAddHabit();
                    }}
                  >
                    <Text style={styles.promoteBtnText}>{t.detail.promoteMaintenanceBtn}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.promoteBtnDisabled}>
                    <Lock size={16} color={colors.outline} />
                    <Text style={styles.promoteBtnDisabledText}>
                      {daysRemainingTo21 > 0
                        ? `${t.detail.pathToMaintenance} (${daysRemainingTo21}d)`
                        : t.detail.waitTomorrowLockLabel}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {habit.status === 'maintenance' && (
              readyForAnchorGraduation ? (
                confirmingAction === 'graduate' ? (
                  <View style={styles.confirmCard}>
                    <Text style={styles.confirmCardText}>
                      {formatText(t.detail.graduateConfirmText, { name: habit.name })}
                    </Text>
                    <View style={styles.confirmActionsRow}>
                      <TouchableOpacity
                        style={styles.confirmCancelBtn}
                        onPress={() => setConfirmingAction(null)}
                      >
                        <Text style={styles.confirmCancelText}>{t.detail.cancelBtn}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmPrimaryBtn}
                        onPress={async () => {
                          await graduateToAnchor(habit.id);
                          setConfirmingAction(null);
                          onBack();
                        }}
                      >
                        <Text style={styles.confirmPrimaryText}>{t.detail.graduateConfirmBtn}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.graduateBtn, styles.graduateBtnHighlighted]}
                    onPress={() => setConfirmingAction('graduate')}
                  >
                    <Text style={styles.graduateBtnText}>{t.detail.graduateReadyTitle}</Text>
                    <Text style={styles.graduateBtnSub}>{t.detail.graduateReadySub}</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={styles.graduateLockedCard}>
                  <View style={styles.graduateLockedHeader}>
                    <Lock size={15} color={colors.outline} />
                    <Text style={styles.graduateLockedTitle}>{t.detail.pathToAnchor}</Text>
                  </View>
                  <Text style={styles.graduateLockedSub}>
                    {formatText(t.detail.remainingToAnchor, { count: monthsRemainingToAnchor })}
                  </Text>
                </View>
              )
            )}

            {habit.status === 'anchor' && (
              <View style={styles.anchorGraduatedCard}>
                <Text style={styles.anchorGraduatedText}>{t.detail.graduatedText}</Text>
              </View>
            )}

            {confirmingAction === 'archive' ? (
              <View style={styles.confirmCard}>
                <Text style={styles.confirmCardText}>
                  {formatText(t.detail.archiveConfirmText, { name: habit.name })}
                </Text>
                <View style={styles.confirmActionsRow}>
                  <TouchableOpacity
                    style={styles.confirmCancelBtn}
                    onPress={() => setConfirmingAction(null)}
                  >
                    <Text style={styles.confirmCancelText}>{t.detail.cancelBtn}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmDangerBtn}
                    onPress={async () => {
                      await archiveHabit(habit.id);
                      setConfirmingAction(null);
                      onBack();
                    }}
                  >
                    <Text style={styles.confirmDangerText}>{t.detail.archiveConfirmBtn}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.secondaryActionsRow}>
                {habit.status === 'paused' ? (
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={async () => {
                      await resumeHabit(habit.id);
                    }}
                  >
                    <Play size={15} color={colors.aquaDark} />
                    <Text style={styles.actionPillText}>{t.detail.resumeAction}</Text>
                  </TouchableOpacity>
                ) : (
                  habit.status !== 'archived' && (
                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={async () => {
                        await pauseHabit(habit.id);
                      }}
                    >
                      <PauseCircle size={15} color={colors.aquaDark} />
                      <Text style={styles.actionPillText}>{t.detail.pauseAction}</Text>
                    </TouchableOpacity>
                  )
                )}

                {habit.status !== 'archived' && (
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={() => setConfirmingAction('archive')}
                  >
                    <Archive size={15} color={colors.coral} />
                    <Text style={styles.actionPillText}>{t.detail.archiveAction}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <Text style={styles.gentleQuote}>{t.detail.gentleQuote}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, shadows: ReturnType<typeof useAppTheme>['shadows']) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  innerContent: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    gap: 14,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: colors.muted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lima,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
  },
  statusBadgeMaintenance: {
    backgroundColor: colors.aquaLight,
    borderWidth: 1,
    borderColor: colors.aqua,
  },
  statusBadgeNeutral: {
    backgroundColor: colors.surfaceContainer,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.coral,
  },
  statusBadgeText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: colors.dark,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.coralLight,
    borderWidth: 1,
    borderColor: '#F5C4BC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleCol: {
    flex: 1,
  },
  habitTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 21,
    color: colors.dark,
    lineHeight: 28,
  },
  anchorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  habitAnchor: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: colors.coral,
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    ...shadows.card,
  },
  metricHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.6,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 8,
  },
  metricValue: {
    fontFamily: THEME.fonts.medium,
    fontSize: 22,
    color: colors.dark,
  },
  metricUnit: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.outline,
  },
  metricSubCoral: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.coral,
    marginTop: 2,
  },
  metricSubMuted: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  metricSubGold: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.shieldGold,
    marginTop: 2,
  },
  calendarBox: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calendarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 17,
    color: colors.dark,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavBtnDisabled: {
    opacity: 0.45,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    fontFamily: THEME.fonts.semibold,
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    color: colors.outline,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellSpacer: {
    width: '14.28%',
    height: 44,
  },
  dayCellWrapper: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayCell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellDone: {
    backgroundColor: colors.aqua,
  },
  dayCellShield: {
    backgroundColor: colors.shieldGoldLight,
    borderWidth: 1,
    borderColor: '#FFCDAC',
  },
  dayCellToday: {
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.coral,
  },
  dayNumber: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: colors.muted,
  },
  dayNumberToday: {
    fontFamily: THEME.fonts.semibold,
    color: colors.coral,
  },
  daySubNum: {
    fontFamily: THEME.fonts.medium,
    fontSize: 9,
    color: colors.outline,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLow,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: colors.outline,
  },
  stickersBox: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    ...shadows.card,
  },
  stickersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stickersIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickersTextCol: {
    flex: 1,
  },
  stickersKicker: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: colors.aquaDark,
  },
  stickersTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 15,
    color: colors.dark,
    marginTop: 2,
  },
  albumLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  albumLinkText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: colors.coral,
  },
  actionsBox: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    ...shadows.card,
  },
  lifecycleProgressBlock: {
    gap: 10,
  },
  lifecycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lifecycleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lifecycleTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 13,
    color: colors.aquaDark,
  },
  lifecycleCount: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.outline,
  },
  progressTrack: {
    height: 11,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 99,
    overflow: 'hidden',
    padding: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.lima,
    borderRadius: 99,
  },
  lifecycleHint: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  promoteBtn: {
    backgroundColor: colors.lima,
    paddingVertical: 15,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
  },
  promoteBtnText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 14,
    color: colors.onLima,
  },
  promoteBtnDisabled: {
    backgroundColor: colors.surfaceContainer,
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: THEME.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  promoteBtnDisabledText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: colors.outline,
  },
  graduateBtn: {
    backgroundColor: colors.aquaLight,
    borderWidth: 1,
    borderColor: colors.aqua,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  graduateBtnHighlighted: {
    backgroundColor: colors.limaLight,
    borderColor: colors.lima,
  },
  graduateBtnText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 14,
    color: colors.aquaDark,
  },
  graduateBtnSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  graduateLockedCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  graduateLockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  graduateLockedTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 13,
    color: colors.muted,
  },
  graduateLockedSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: colors.outline,
    lineHeight: 17,
  },
  anchorGraduatedCard: {
    backgroundColor: colors.aquaLight,
    borderWidth: 1,
    borderColor: colors.aqua,
    borderRadius: 18,
    padding: 14,
  },
  anchorGraduatedText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: colors.aquaDark,
    lineHeight: 19,
  },
  confirmCard: {
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  confirmCardText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: colors.dark,
    lineHeight: 18,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: THEME.radius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: colors.dark,
  },
  confirmPrimaryBtn: {
    flex: 1,
    backgroundColor: colors.lima,
    borderRadius: THEME.radius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmPrimaryText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: colors.onLima,
  },
  confirmDangerBtn: {
    flex: 1,
    backgroundColor: colors.coral,
    borderRadius: THEME.radius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmDangerText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: colors.onCoral,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLow,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  actionPillText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: colors.muted,
  },
  gentleQuote: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: colors.outline,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
});
