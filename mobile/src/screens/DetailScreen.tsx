import React, { useState } from 'react';
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
  ArrowLeft,
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
import { THEME } from '../theme/colors';
import { Habit, isEligibleForAnchorGraduation } from '../types/habit';
import { useHabitStore } from '../store/habitStore';

interface DetailScreenProps {
  habit: Habit;
  onBack: () => void;
  onOpenAddHabit?: () => void;
  onOpenStickers?: () => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  habit,
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

  const now = new Date();
  const [monthOffset, setMonthOffset] = useState<number>(0);

  const viewedDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewedYear = viewedDate.getFullYear();
  const viewedMonth = viewedDate.getMonth();
  const isCurrentMonth =
    viewedYear === now.getFullYear() && viewedMonth === now.getMonth();
  const currentDayNum = now.getDate();

  const viewedMonthName = viewedDate.toLocaleDateString('es-ES', {
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
  const latestSticker =
    habit.stickersUnlocked[habit.stickersUnlocked.length - 1] || '🌱 Primer Paso';

  const statusLabel =
    habit.status === 'active'
      ? '🌱 Activo (En construcción)'
      : habit.status === 'maintenance'
      ? '🌿 Mantenimiento'
      : habit.status === 'anchor'
      ? '🌳 Graduado'
      : habit.status === 'paused'
      ? '⏸️ Pausado'
      : '📦 Archivado';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContent}>
          {/* SUB-BARRA DE NAVEGACIÓN & BADGE */}
          <View style={styles.topNav}>
            <TouchableOpacity style={styles.backPill} onPress={onBack}>
              <ArrowLeft size={16} color={THEME.colors.dark} />
              <Text style={styles.backPillText}>Volver a Mi Día</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.statusBadge,
                habit.status === 'maintenance' && styles.statusBadgeMaintenance,
                habit.status === 'paused' && styles.statusBadgeNeutral,
              ]}
            >
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>{statusLabel}</Text>
            </View>
          </View>

          {/* ENCABEZADO HERO DEL HÁBITO */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBox}>
                <Sprout size={26} color={THEME.colors.coral} />
              </View>
              <View style={styles.heroTitleCol}>
                <Text style={styles.habitTitle}>{habit.name}</Text>
                {habit.anchorText && (
                  <View style={styles.anchorRow}>
                    <CornerDownRight size={14} color={THEME.colors.coral} />
                    <Text style={styles.habitAnchor}>{habit.anchorText}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.heroFooterStrip}>
              <Text style={styles.heroFooterLabel}>
                Total acumulado: {habit.totalCompletedDays} días cumplidos
              </Text>
              <Text style={styles.heroFooterTag}>1/1 diario</Text>
            </View>
          </View>

          {/* MÉTRICAS TÁCTILES EN 3 TARJETAS */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHead}>
                <Text style={styles.metricLabel}>RACHA</Text>
                <Flame size={16} color={THEME.colors.coral} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{habit.currentStreak}</Text>
                <Text style={styles.metricUnit}>días</Text>
              </View>
              <Text style={styles.metricSubCoral}>Constante</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHead}>
                <Text style={styles.metricLabel}>RÉCORD</Text>
                <Trophy size={16} color={THEME.colors.aquaDark} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{habit.bestStreak}</Text>
                <Text style={styles.metricUnit}>días</Text>
              </View>
              <Text style={styles.metricSubMuted}>Mejor marca</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHead}>
                <Text style={styles.metricLabel}>ESCUDOS</Text>
                <Shield size={16} color={THEME.colors.shieldGold} />
              </View>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{habit.shieldsAvailable}</Text>
                <Text style={styles.metricUnit}>/3</Text>
              </View>
              <Text style={styles.metricSubGold}>
                {habit.shieldsAvailable < 3 ? '+1 en hito' : 'Completa'}
              </Text>
            </View>
          </View>

          {/* CALENDARIO MENSUAL MINIMALISTA LIBRE DE CULPA */}
          <View style={styles.calendarBox}>
            <View style={styles.calendarHeader}>
              <View style={styles.calendarTitleRow}>
                <Calendar size={18} color={THEME.colors.coral} />
                <Text style={styles.calendarTitle}>{capitalizedMonth}</Text>
              </View>
              <View style={styles.calendarNavRow}>
                <TouchableOpacity
                  style={styles.calendarNavBtn}
                  onPress={() => setMonthOffset((prev) => prev - 1)}
                >
                  <ChevronLeft size={18} color={THEME.colors.dark} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calendarNavBtn, isCurrentMonth && styles.calendarNavBtnDisabled]}
                  disabled={isCurrentMonth}
                  onPress={() => setMonthOffset((prev) => Math.min(0, prev + 1))}
                >
                  <ChevronRight
                    size={18}
                    color={isCurrentMonth ? THEME.colors.outline : THEME.colors.dark}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.weekDaysRow}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, idx) => (
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
                        <Shield size={14} color={THEME.colors.shieldGold} />
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
                <View style={[styles.legendDot, { backgroundColor: THEME.colors.aqua }]} />
                <Text style={styles.legendText}>Cumplido</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: THEME.colors.shieldGoldLight,
                      borderWidth: 1,
                      borderColor: THEME.colors.shieldGold,
                    },
                  ]}
                />
                <Text style={styles.legendText}>Escudo protector</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: THEME.colors.cream,
                      borderWidth: 1.5,
                      borderColor: THEME.colors.coral,
                    },
                  ]}
                />
                <Text style={styles.legendText}>Hoy</Text>
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
                <Award size={20} color={THEME.colors.coral} />
              </View>
              <View style={styles.stickersTextCol}>
                <Text style={styles.stickersKicker}>
                  Último Desbloqueo ({habit.stickersUnlocked.length} ganados)
                </Text>
                <Text style={styles.stickersTitle} numberOfLines={1}>
                  {latestSticker}
                </Text>
              </View>
            </View>
            <View style={styles.albumLinkRow}>
              <Text style={styles.albumLinkText}>Álbum</Text>
              <ArrowRight size={15} color={THEME.colors.coral} />
            </View>
          </TouchableOpacity>

          {/* CICLO DE VIDA Y PROGRESIÓN */}
          <View style={styles.actionsBox}>
            {habit.status === 'active' && (
              <View style={styles.lifecycleProgressBlock}>
                <View style={styles.lifecycleHeader}>
                  <View style={styles.lifecycleTitleRow}>
                    <Leaf size={15} color={THEME.colors.limaDark} />
                    <Text style={styles.lifecycleTitle}>Camino a Mantenimiento</Text>
                  </View>
                  <Text style={styles.lifecycleCount}>
                    {habit.currentStreak} de 21 días ({progressPct}%)
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                </View>

                <Text style={styles.lifecycleHint}>
                  {daysRemainingTo21 > 0
                    ? `Faltan solo ${daysRemainingTo21} días para habilitar la consolidación a 🌿 Mantenimiento.`
                    : '¡Cumpliste los 21 días! Ya podés consolidar este hábito y sumar uno nuevo.'}
                </Text>

                {habit.currentStreak >= 21 ? (
                  <TouchableOpacity
                    style={styles.promoteBtn}
                    onPress={async () => {
                      await promoteToMaintenance(habit.id);
                      if (onOpenAddHabit) onOpenAddHabit();
                    }}
                  >
                    <Text style={styles.promoteBtnText}>🌿 Consolidar a Mantenimiento</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.promoteBtnDisabled}>
                    <Lock size={16} color={THEME.colors.outline} />
                    <Text style={styles.promoteBtnDisabledText}>
                      🌿 Consolidar a Mantenimiento (En {daysRemainingTo21} días)
                    </Text>
                  </View>
                )}
              </View>
            )}

            {habit.status === 'maintenance' && (
              <TouchableOpacity
                style={[styles.graduateBtn, readyForAnchorGraduation && styles.graduateBtnHighlighted]}
                onPress={async () => {
                  await graduateToAnchor(habit.id);
                  onBack();
                }}
              >
                <Text style={styles.graduateBtnText}>
                  {readyForAnchorGraduation
                    ? '🎉 ¡6 meses cumplidos! Graduar a Ancla 🌳'
                    : '🌳 Graduar a Ancla Definitiva'}
                </Text>
                <Text style={styles.graduateBtnSub}>
                  {readyForAnchorGraduation
                    ? 'Ya es parte natural de vos. Podés graduarlo y dejar de tildarlo todos los días.'
                    : 'Si ya es parte 100 % natural de tu vida, deja de requerir tildado diario.'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.secondaryActionsRow}>
              {habit.status === 'paused' ? (
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={async () => {
                    await resumeHabit(habit.id);
                  }}
                >
                  <Play size={15} color={THEME.colors.aquaDark} />
                  <Text style={styles.actionPillText}>Reanudar hábito</Text>
                </TouchableOpacity>
              ) : (
                habit.status !== 'archived' && (
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={async () => {
                      await pauseHabit(habit.id);
                    }}
                  >
                    <PauseCircle size={15} color={THEME.colors.aquaDark} />
                    <Text style={styles.actionPillText}>Pausar sin culpa</Text>
                  </TouchableOpacity>
                )
              )}

              {habit.status !== 'archived' && (
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={async () => {
                    await archiveHabit(habit.id);
                    onBack();
                  }}
                >
                  <Archive size={15} color={THEME.colors.coral} />
                  <Text style={styles.actionPillText}>Archivar con paz</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.gentleQuote}>
            "Las raíces no se apresuran; crecen en el silencio de cada pequeño intento."
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
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
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.surfaceContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radius.full,
  },
  backPillText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.dark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.lima,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
  },
  statusBadgeMaintenance: {
    backgroundColor: THEME.colors.aquaLight,
    borderWidth: 1,
    borderColor: THEME.colors.aqua,
  },
  statusBadgeNeutral: {
    backgroundColor: THEME.colors.surfaceContainer,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: THEME.colors.coral,
  },
  statusBadgeText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.dark,
  },
  heroCard: {
    backgroundColor: THEME.colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
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
    backgroundColor: THEME.colors.coralLight,
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
    color: THEME.colors.dark,
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
    color: THEME.colors.coral,
    flex: 1,
  },
  heroFooterStrip: {
    marginTop: 14,
    backgroundColor: THEME.colors.surfaceLow,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroFooterLabel: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.muted,
  },
  heroFooterTag: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.coral,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: 'space-between',
  },
  metricHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: THEME.colors.outline,
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
    color: THEME.colors.dark,
  },
  metricUnit: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.outline,
  },
  metricSubCoral: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.coral,
    marginTop: 2,
  },
  metricSubMuted: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  metricSubGold: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.shieldGold,
    marginTop: 2,
  },
  calendarBox: {
    backgroundColor: THEME.colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
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
    color: THEME.colors.dark,
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
    backgroundColor: THEME.colors.surfaceLow,
    borderWidth: 1,
    borderColor: THEME.colors.border,
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
    color: THEME.colors.outline,
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
    backgroundColor: THEME.colors.aqua,
  },
  dayCellShield: {
    backgroundColor: THEME.colors.shieldGoldLight,
    borderWidth: 1,
    borderColor: '#FFCDAC',
  },
  dayCellToday: {
    backgroundColor: THEME.colors.cream,
    borderWidth: 2,
    borderColor: THEME.colors.coral,
  },
  dayNumber: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: THEME.colors.muted,
  },
  dayNumberToday: {
    fontFamily: THEME.fonts.semibold,
    color: THEME.colors.coral,
  },
  daySubNum: {
    fontFamily: THEME.fonts.medium,
    fontSize: 9,
    color: THEME.colors.outline,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceLow,
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
    color: THEME.colors.outline,
  },
  stickersBox: {
    backgroundColor: THEME.colors.surfaceLow,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
    backgroundColor: THEME.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickersTextCol: {
    flex: 1,
  },
  stickersKicker: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.aquaDark,
  },
  stickersTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 15,
    color: THEME.colors.dark,
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
    color: THEME.colors.coral,
  },
  actionsBox: {
    backgroundColor: THEME.colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 14,
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
    color: THEME.colors.aquaDark,
  },
  lifecycleCount: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.outline,
  },
  progressTrack: {
    height: 11,
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: 99,
    overflow: 'hidden',
    padding: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.lima,
    borderRadius: 99,
  },
  lifecycleHint: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 18,
  },
  promoteBtn: {
    backgroundColor: THEME.colors.lima,
    paddingVertical: 15,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
  },
  promoteBtnText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 14,
    color: THEME.colors.limaDark,
  },
  promoteBtnDisabled: {
    backgroundColor: THEME.colors.surfaceContainer,
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
    color: THEME.colors.outline,
  },
  graduateBtn: {
    backgroundColor: THEME.colors.aquaLight,
    borderWidth: 1,
    borderColor: THEME.colors.aqua,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  graduateBtnHighlighted: {
    backgroundColor: THEME.colors.limaLight,
    borderColor: THEME.colors.lima,
  },
  graduateBtnText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 14,
    color: THEME.colors.aquaDark,
  },
  graduateBtnSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.muted,
    textAlign: 'center',
    marginTop: 4,
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
    backgroundColor: THEME.colors.surfaceLow,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  actionPillText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.muted,
  },
  gentleQuote: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.outline,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
});
