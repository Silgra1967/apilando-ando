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
import { useHabitStore } from '../store/habitStore';
import { Habit } from '../types/habit';
import { sendInstantTestNotification } from '../services/notificationService';

interface DashboardScreenProps {
  onOpenDetail: (habit: Habit) => void;
  onSimulateShield: () => void;
  onOpenAddHabit: () => void;
  onPromoteHabit: (habit: Habit) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenDetail,
  onSimulateShield,
  onOpenAddHabit,
  onPromoteHabit,
}) => {
  const { habits, logs, toggleDayCompletion } = useHabitStore();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const formattedDate = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const activeHabit = habits.find((h) => h.status === 'active');
  const maintenanceHabits = habits.filter((h) => h.status === 'maintenance');
  const anchorHabits = habits.filter((h) => h.status === 'anchor');

  const isCompletedToday = (habitId: string) => {
    return logs[`${habitId}_${todayStr}`]?.status === 'completed';
  };

  const totalCheckable = (activeHabit ? 1 : 0) + maintenanceHabits.length;
  const totalDone =
    (activeHabit && isCompletedToday(activeHabit.id) ? 1 : 0) +
    maintenanceHabits.filter((m) => isCompletedToday(m.id)).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View style={styles.titleCol}>
            <Text style={styles.dateText}>{capitalizedDate}</Text>
            <Text style={styles.headerTitle}>Mi Día</Text>
          </View>
          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={styles.notifTestBtn}
              onPress={sendInstantTestNotification}
            >
              <Text style={styles.notifTestBtnText}>🔔 Probar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shieldSimBtn} onPress={onSimulateShield}>
              <Text style={styles.shieldSimBtnText}>🛡️ Escudo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PROGRESO DIARIO */}
        <View style={styles.progressBarBox}>
          <Text style={styles.progressLabel}>Progreso de hoy</Text>
          <Text style={styles.progressCount}>
            {totalDone} de {totalCheckable} completados
          </Text>
        </View>

        {/* CADENA DE RUTINA (HABIT STACKING) */}
        <View style={styles.routineChain}>
          {/* Ancla Inicial */}
          {activeHabit?.anchorText && (
            <View style={styles.anchorBadgeRow}>
              <View style={styles.anchorBadge}>
                <Text style={styles.anchorBadgeText}>🌳 ANCLA</Text>
              </View>
              <Text style={styles.anchorDescription}>{activeHabit.anchorText}</Text>
            </View>
          )}

          <View style={styles.chainConnector}>
            {/* Hábitos Graduados (6 meses) */}
            {anchorHabits.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.graduatedCard}
                onPress={() => onOpenDetail(a)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.graduatedTag}>🌳 Hábito Graduado</Text>
                  <Text style={styles.streakSmall}>✦ {a.currentStreak} días racha</Text>
                </View>
                <Text style={styles.habitTitle}>{a.name}</Text>
                <Text style={styles.subtext}>Ya es parte natural de vos</Text>
              </TouchableOpacity>
            ))}

            {/* Hábitos en Mantenimiento */}
            {maintenanceHabits.map((m) => {
              const done = isCompletedToday(m.id);
              return (
                <View key={m.id} style={styles.maintenanceCard}>
                  <TouchableOpacity
                    style={styles.maintenanceInfo}
                    onPress={() => onOpenDetail(m)}
                  >
                    <Text style={styles.maintenanceTag}>🌿 Mantenimiento</Text>
                    <Text style={styles.habitTitle}>{m.name}</Text>
                    <Text style={styles.streakFlame}>🔥 {m.currentStreak} días</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.checkbox, done && styles.checkboxDone]}
                    onPress={() => toggleDayCompletion(m.id, todayStr)}
                  >
                    {done && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Hábito Activo (El protagonista) */}
            {activeHabit && (
              <View style={styles.activeCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>🌱 EN CONSTRUCCIÓN</Text>
                  </View>
                  <View style={styles.shieldsRow}>
                    <Text style={styles.shieldsText}>
                      {'🛡️'.repeat(activeHabit.shieldsAvailable)}
                      {'⚪'.repeat(Math.max(0, 3 - activeHabit.shieldsAvailable))}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => onOpenDetail(activeHabit)}>
                  <View style={styles.titleRow}>
                    <Text style={styles.activeHabitTitle}>{activeHabit.name}</Text>
                    <Text style={styles.seeDetailText}>Ver camino →</Text>
                  </View>
                  {activeHabit.anchorText && (
                    <Text style={styles.activeAnchorText}>↳ {activeHabit.anchorText}</Text>
                  )}
                </TouchableOpacity>

                {/* Barra hacia los 21 días */}
                <View style={styles.targetProgressBox}>
                  <View style={styles.progressRowText}>
                    <Text style={styles.progressSub}>
                      {activeHabit.currentStreak >= 21
                        ? '🎉 ¡21 días completados!'
                        : `Día ${activeHabit.currentStreak} de 21 para consolidar`}
                    </Text>
                    <Text style={styles.progressSub}>
                      {Math.min(100, Math.round((activeHabit.currentStreak / 21) * 100))}%
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(
                            100,
                            Math.round((activeHabit.currentStreak / 21) * 100)
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Invitación a consolidar si ya llegó a 21 días */}
                {activeHabit.currentStreak >= 21 && (
                  <TouchableOpacity
                    style={styles.readyConsolidateBanner}
                    onPress={() => onPromoteHabit(activeHabit)}
                  >
                    <Text style={styles.readyConsolidateTitle}>🌿 Listo para consolidar</Text>
                    <Text style={styles.readyConsolidateSub}>
                      Tocá acá para pasar a Mantenimiento y habilitar tu próximo hábito.
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Botón principal de tildado */}
                <TouchableOpacity
                  style={[
                    styles.bigCheckButton,
                    isCompletedToday(activeHabit.id) && styles.bigCheckButtonDone,
                  ]}
                  onPress={() => toggleDayCompletion(activeHabit.id, todayStr)}
                >
                  <Text style={styles.bigCheckButtonText}>
                    {isCompletedToday(activeHabit.id) ? '✓ Cumplido por hoy' : 'Marcar como hecho'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Si no hay hábito activo (todos consolidados/anclas), botón para sumar uno */}
            {!activeHabit && (
              <TouchableOpacity style={styles.addHabitCard} onPress={onOpenAddHabit}>
                <Text style={styles.addHabitIcon}>🌱</Text>
                <Text style={styles.addHabitTitle}>Elegir nuevo hábito en foco</Text>
                <Text style={styles.addHabitSub}>
                  Tus hábitos anteriores ya están en marcha. ¿Qué te gustaría construir ahora?
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mensaje de cierre de rutina */}
        {totalCheckable > 0 && totalDone === totalCheckable && (
          <View style={styles.closingBanner}>
            <Text style={styles.closingBannerText}>
              ✨ Rutina completa por hoy. Gran constancia, buen descanso.
            </Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  titleCol: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.dark,
    marginTop: 2,
  },
  shieldSimBtn: {
    backgroundColor: THEME.colors.shieldGoldLight,
    borderWidth: 1,
    borderColor: '#F9E79F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
  },
  shieldSimBtnText: {
    fontSize: 11,
    color: '#7D6608',
    fontWeight: '700',
  },
  headerButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  notifTestBtn: {
    backgroundColor: THEME.colors.sageLight,
    borderWidth: 1,
    borderColor: THEME.colors.sage,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
  },
  notifTestBtnText: {
    fontSize: 11,
    color: THEME.colors.dark,
    fontWeight: '700',
  },
  progressBarBox: {
    backgroundColor: THEME.colors.lightGray,
    padding: 14,
    borderRadius: THEME.radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  progressLabel: {
    fontSize: 12,
    color: THEME.colors.muted,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  routineChain: {
    gap: THEME.spacing.sm,
  },
  anchorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  anchorBadge: {
    backgroundColor: '#FEF5E7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  anchorBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B9770E',
  },
  anchorDescription: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.muted,
  },
  chainConnector: {
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.border,
    borderStyle: 'dashed',
    marginLeft: 16,
    paddingLeft: 16,
    gap: 16,
    paddingVertical: 8,
  },
  graduatedCard: {
    backgroundColor: THEME.colors.white,
    padding: 16,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  graduatedTag: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.sage,
    textTransform: 'uppercase',
  },
  streakSmall: {
    fontSize: 11,
    color: THEME.colors.muted,
    fontWeight: '600',
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  subtext: {
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  maintenanceCard: {
    backgroundColor: THEME.colors.white,
    padding: 16,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  maintenanceInfo: {
    flex: 1,
  },
  maintenanceTag: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.lavender,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  streakFlame: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.muted,
    marginTop: 4,
  },
  checkbox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: THEME.colors.sage,
    borderColor: THEME.colors.sage,
  },
  checkmark: {
    color: THEME.colors.white,
    fontWeight: '900',
    fontSize: 16,
  },
  activeCard: {
    backgroundColor: THEME.colors.white,
    padding: 18,
    borderRadius: THEME.radius.lg,
    borderWidth: 2,
    borderColor: THEME.colors.terracottaLight,
    shadowColor: THEME.colors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  activeTag: {
    backgroundColor: THEME.colors.terracottaLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.terracotta,
  },
  shieldsRow: {
    flexDirection: 'row',
  },
  shieldsText: {
    fontSize: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  activeHabitTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.colors.dark,
  },
  seeDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.terracotta,
  },
  activeAnchorText: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 2,
    marginBottom: 14,
  },
  targetProgressBox: {
    marginBottom: 16,
  },
  progressRowText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressSub: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.muted,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: THEME.colors.lightGray,
    borderRadius: THEME.radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.terracotta,
    borderRadius: THEME.radius.full,
  },
  bigCheckButton: {
    backgroundColor: THEME.colors.dark,
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  bigCheckButtonDone: {
    backgroundColor: THEME.colors.sage,
  },
  bigCheckButtonText: {
    color: THEME.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  closingBanner: {
    marginTop: 20,
    backgroundColor: THEME.colors.sageLight,
    padding: 14,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  closingBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.dark,
    textAlign: 'center',
  },
  readyConsolidateBanner: {
    backgroundColor: THEME.colors.sageLight,
    borderWidth: 1,
    borderColor: THEME.colors.sage,
    padding: 12,
    borderRadius: THEME.radius.md,
    marginBottom: 14,
  },
  readyConsolidateTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  readyConsolidateSub: {
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 2,
    lineHeight: 15,
  },
  addHabitCard: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1.5,
    borderColor: THEME.colors.sage,
    borderStyle: 'dashed',
    borderRadius: THEME.radius.lg,
    padding: 24,
    alignItems: 'center',
    marginVertical: 10,
  },
  addHabitIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  addHabitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  addHabitSub: {
    fontSize: 12,
    color: THEME.colors.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
