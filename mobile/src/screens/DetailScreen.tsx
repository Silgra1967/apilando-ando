import React from 'react';
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
import { THEME } from '../theme/colors';
import { Habit } from '../types/habit';
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
    habits,
    promoteToMaintenance,
    graduateToAnchor,
    pauseHabit,
    resumeHabit,
    archiveHabit,
  } = useHabitStore();

  const now = new Date();
  const currentDayNum = now.getDate();
  const currentMonthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // Cantidad de días del mes actual
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Generar días reales del mes
  const days = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const log = logs[`${habit.id}_${dateStr}`];

    let type: 'done' | 'shield' | 'today' | 'empty' = 'empty';

    if (log?.status === 'completed') {
      type = 'done';
    } else if (log?.status === 'shielded') {
      type = 'shield';
    } else if (dayNum === currentDayNum) {
      type = 'today';
    }

    return { num: dayNum, type };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* BARRA SUPERIOR */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Volver a Mi Día</Text>
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {habit.status === 'active'
                ? '🌱 Activo'
                : habit.status === 'maintenance'
                ? '🌿 Mantenimiento'
                : '🌳 Graduado'}
            </Text>
          </View>
        </View>

        {/* TÍTULO Y ANCLA */}
        <View style={styles.header}>
          <Text style={styles.habitTitle}>{habit.name}</Text>
          {habit.anchorText && (
            <Text style={styles.habitAnchor}>↳ {habit.anchorText}</Text>
          )}
        </View>

        {/* TARJETAS DE MÉTRICAS */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Racha actual</Text>
            <Text style={styles.metricValue}>🔥 {habit.currentStreak}d</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Récord</Text>
            <Text style={styles.metricValue}>🏆 {habit.bestStreak}d</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Escudos</Text>
            <Text style={styles.metricValue}>🛡️ {habit.shieldsAvailable}/3</Text>
          </View>
        </View>

        {/* CALENDARIO MENSUAL MINIMALISTA */}
        <View style={styles.calendarBox}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>{capitalizedMonth}</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: THEME.colors.sage }]} />
                <Text style={styles.legendText}>Hecho</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendText}>🛡️ Escudo</Text>
              </View>
            </View>
          </View>

          {/* DÍAS DE LA SEMANA */}
          <View style={styles.weekDaysRow}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, idx) => (
              <Text key={idx} style={styles.weekDayText}>
                {d}
              </Text>
            ))}
          </View>

          {/* MATRIZ DE DÍAS (NÚMEROS VISIBLES) */}
          <View style={styles.daysGrid}>
            {days.map((d) => {
              const isDone = d.type === 'done';
              const isShield = d.type === 'shield';
              const isToday = d.type === 'today';

              return (
                <View
                  key={d.num}
                  style={[
                    styles.dayCell,
                    isDone && styles.dayCellDone,
                    isShield && styles.dayCellShield,
                    isToday && styles.dayCellToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      (isDone || isShield) && styles.dayNumberDone,
                      isToday && styles.dayNumberToday,
                    ]}
                  >
                    {d.num}
                  </Text>
                  {isDone && <Text style={styles.cornerCheck}>✓</Text>}
                  {isShield && <Text style={styles.cornerShield}>🛡️</Text>}
                </View>
              );
            })}
          </View>
        </View>

        {/* ÁLBUM DE STICKERS / LOGROS */}
        <TouchableOpacity
          style={styles.stickersBox}
          activeOpacity={0.85}
          onPress={onOpenStickers}
        >
          <View style={styles.stickersHeader}>
            <View>
              <Text style={styles.stickersTitle}>Álbum de Logros</Text>
              <Text style={styles.stickersSub}>Tocá para ver todas las insignias disponibles ✨</Text>
            </View>
            <Text style={styles.stickersCount}>{habit.stickersUnlocked.length} ganados →</Text>
          </View>

          <View style={styles.stickersList}>
            {habit.stickersUnlocked.map((st) => (
              <View key={st} style={styles.stickerBadge}>
                <Text style={styles.stickerText}>{st}</Text>
              </View>
            ))}

            <View style={styles.stickerLocked}>
              <Text style={styles.stickerLockedText}>🔒 Ver colección</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ACCIONES DEL CICLO DE VIDA */}
        <View style={styles.actionsBox}>
          <Text style={styles.actionsTitle}>Ciclo de vida del hábito</Text>

          {habit.status === 'active' && habit.currentStreak >= 21 && (
            <TouchableOpacity
              style={styles.promoteBtn}
              onPress={async () => {
                await promoteToMaintenance(habit.id);
                if (onOpenAddHabit) onOpenAddHabit();
              }}
            >
              <Text style={styles.promoteBtnText}>🌿 Consolidar a Mantenimiento</Text>
              <Text style={styles.promoteBtnSub}>
                Cumpliste 21 días. Libera el espacio para un nuevo hábito activo.
              </Text>
            </TouchableOpacity>
          )}

          {habit.status === 'maintenance' && (
            <TouchableOpacity
              style={styles.graduateBtn}
              onPress={async () => {
                await graduateToAnchor(habit.id);
                onBack();
              }}
            >
              <Text style={styles.graduateBtnText}>🌳 Graduar a Ancla Definitiva</Text>
              <Text style={styles.graduateBtnSub}>
                Si ya es parte 100% natural de tu vida, deja de requerir tildado diario.
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
                <Text style={styles.actionPillText}>▶️ Reanudar hábito</Text>
              </TouchableOpacity>
            ) : (
              habit.status !== 'archived' && (
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={async () => {
                    await pauseHabit(habit.id);
                  }}
                >
                  <Text style={styles.actionPillText}>⏸️ Pausar temporalmente</Text>
                </TouchableOpacity>
              )
            )}

            {habit.status !== 'archived' && (
              <TouchableOpacity
                style={[styles.actionPill, styles.actionPillArchived]}
                onPress={async () => {
                  await archiveHabit(habit.id);
                  onBack();
                }}
              >
                <Text style={[styles.actionPillText, styles.actionPillTextArchived]}>
                  📦 Archivar
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  backButton: {
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.muted,
  },
  statusBadge: {
    backgroundColor: THEME.colors.terracottaLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.terracotta,
    textTransform: 'uppercase',
  },
  header: {
    marginBottom: THEME.spacing.lg,
  },
  habitTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.colors.dark,
  },
  habitAnchor: {
    fontSize: 13,
    color: THEME.colors.muted,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: THEME.spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    padding: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.muted,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.dark,
    marginTop: 4,
  },
  calendarBox: {
    backgroundColor: THEME.colors.white,
    padding: 16,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calendarTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.dark,
    textTransform: 'uppercase',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: THEME.colors.muted,
    fontWeight: '600',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekDayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.muted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '12.5%',
    aspectRatio: 1,
    backgroundColor: THEME.colors.lightGray,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellDone: {
    backgroundColor: THEME.colors.sageLight,
    borderWidth: 1,
    borderColor: THEME.colors.sage,
  },
  dayCellShield: {
    backgroundColor: THEME.colors.shieldGoldLight,
    borderWidth: 1,
    borderColor: THEME.colors.shieldGold,
  },
  dayCellToday: {
    backgroundColor: THEME.colors.white,
    borderWidth: 2,
    borderColor: THEME.colors.terracotta,
  },
  dayNumber: {
    fontSize: 11,
    color: THEME.colors.muted,
    fontWeight: '600',
  },
  dayNumberDone: {
    color: THEME.colors.dark,
    fontWeight: '900',
  },
  dayNumberToday: {
    color: THEME.colors.terracotta,
    fontWeight: '900',
  },
  cornerCheck: {
    position: 'absolute',
    top: 2,
    right: 3,
    fontSize: 8,
    fontWeight: '900',
    color: THEME.colors.sage,
  },
  cornerShield: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 8,
  },
  stickersBox: {
    backgroundColor: THEME.colors.lightGray,
    padding: 16,
    borderRadius: THEME.radius.lg,
  },
  stickersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stickersTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.dark,
    textTransform: 'uppercase',
  },
  stickersSub: {
    fontSize: 10,
    color: THEME.colors.muted,
    marginTop: 2,
    fontWeight: '600',
  },
  stickersCount: {
    fontSize: 11,
    color: THEME.colors.muted,
    fontWeight: '700',
  },
  stickersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stickerBadge: {
    backgroundColor: THEME.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  stickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.dark,
  },
  stickerLocked: {
    borderWidth: 1,
    borderColor: THEME.colors.muted,
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
  },
  stickerLockedText: {
    fontSize: 11,
    color: THEME.colors.muted,
    fontWeight: '600',
  },
  actionsBox: {
    marginTop: THEME.spacing.lg,
    backgroundColor: THEME.colors.white,
    padding: 16,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  actionsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.dark,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  promoteBtn: {
    backgroundColor: THEME.colors.sageLight,
    borderWidth: 1,
    borderColor: THEME.colors.sage,
    padding: 14,
    borderRadius: THEME.radius.md,
    marginBottom: 12,
  },
  promoteBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  promoteBtnSub: {
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 4,
    lineHeight: 15,
  },
  graduateBtn: {
    backgroundColor: THEME.colors.sandLight,
    borderWidth: 1,
    borderColor: THEME.colors.sand,
    padding: 14,
    borderRadius: THEME.radius.md,
    marginBottom: 12,
  },
  graduateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  graduateBtnSub: {
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 4,
    lineHeight: 15,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionPill: {
    flex: 1,
    backgroundColor: THEME.colors.lightGray,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  actionPillArchived: {
    backgroundColor: '#FBEBEB',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.dark,
  },
  actionPillTextArchived: {
    color: '#C0392B',
  },
});
