import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { THEME } from '../theme/colors';
import { Habit } from '../types/habit';
import { useHabitStore } from '../store/habitStore';

interface DetailScreenProps {
  habit: Habit;
  onBack: () => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({ habit, onBack }) => {
  const { logs } = useHabitStore();

  // Generar 30 días para simulación de calendario
  // Días 1..currentStreak completados con número legible
  const days = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    let type: 'done' | 'shield' | 'empty' = 'empty';

    if (dayNum <= habit.currentStreak) {
      type = 'done';
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
            <Text style={styles.calendarTitle}>Noviembre 2026</Text>
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
              return (
                <View
                  key={d.num}
                  style={[styles.dayCell, isDone && styles.dayCellDone]}
                >
                  <Text style={[styles.dayNumber, isDone && styles.dayNumberDone]}>
                    {d.num}
                  </Text>
                  {isDone && <Text style={styles.cornerCheck}>✓</Text>}
                </View>
              );
            })}
          </View>
        </View>

        {/* ÁLBUM DE STICKERS / LOGROS */}
        <View style={styles.stickersBox}>
          <View style={styles.stickersHeader}>
            <Text style={styles.stickersTitle}>Álbum de Logros</Text>
            <Text style={styles.stickersCount}>{habit.stickersUnlocked.length} ganados</Text>
          </View>

          <View style={styles.stickersList}>
            {habit.stickersUnlocked.map((st) => (
              <View key={st} style={styles.stickerBadge}>
                <Text style={styles.stickerText}>{st}</Text>
              </View>
            ))}

            <View style={styles.stickerLocked}>
              <Text style={styles.stickerLockedText}>🔒 Próximo: 21 Días</Text>
            </View>
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
  },
  container: {
    padding: THEME.spacing.lg,
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
  dayNumber: {
    fontSize: 11,
    color: THEME.colors.muted,
    fontWeight: '600',
  },
  dayNumberDone: {
    color: THEME.colors.dark,
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
});
