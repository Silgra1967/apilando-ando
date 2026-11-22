import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { THEME } from '../theme/colors';
import { Habit, DailyLog } from '../types/habit';

interface MonthlyReviewModalProps {
  visible: boolean;
  onClose: () => void;
  habits: Habit[];
  logs: Record<string, DailyLog>;
  onPromoteAndAddHabit: (habit: Habit) => void;
}

export const MonthlyReviewModal: React.FC<MonthlyReviewModalProps> = ({
  visible,
  onClose,
  habits,
  logs,
  onPromoteAndAddHabit,
}) => {
  const now = new Date();
  const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Calcular constancia en los últimos 30 días
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLogs = Object.values(logs).filter((l) => l.date.startsWith(currentMonthPrefix));

  const daysCompletedSet = new Set<string>();
  const daysShieldedSet = new Set<string>();

  monthLogs.forEach((l) => {
    if (l.status === 'completed') daysCompletedSet.add(l.date);
    if (l.status === 'shielded') daysShieldedSet.add(l.date);
  });

  const totalActiveDays = daysCompletedSet.size;
  const totalShieldedDays = daysShieldedSet.size;

  const activeHabit = habits.find((h) => h.status === 'active');
  const maintenanceCount = habits.filter((h) => h.status === 'maintenance').length;
  const anchorCount = habits.filter((h) => h.status === 'anchor').length;

  const canPromote = activeHabit && activeHabit.currentStreak >= 21;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.badgeText}>RITUAL DE CIERRE</Text>
              <Text style={styles.title}>Revisión de {capitalizedMonth}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* BALANCE VISUAL DE CONSTANCIA */}
            <View style={styles.statsCard}>
              <Text style={styles.statsGreeting}>✨ Tu balance amable del mes</Text>
              <Text style={styles.statsDescription}>
                La constancia real no es la perfección, sino volver día tras día.
              </Text>

              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricNumber}>{totalActiveDays}</Text>
                  <Text style={styles.metricLabel}>Días activos</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBox}>
                  <Text style={styles.metricNumber}>{totalShieldedDays}</Text>
                  <Text style={styles.metricLabel}>🛡️ Protegidos</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBox}>
                  <Text style={styles.metricNumber}>{maintenanceCount + anchorCount}</Text>
                  <Text style={styles.metricLabel}>Consolidados</Text>
                </View>
              </View>
            </View>

            {/* SITUACIÓN DEL HÁBITO ACTIVO */}
            {activeHabit ? (
              <View style={styles.activeReviewBox}>
                <View style={styles.activeHeaderRow}>
                  <Text style={styles.activeTag}>HÁBITO EN FOCO 🌱</Text>
                  <Text style={styles.activeStreakText}>🔥 {activeHabit.currentStreak} días seguidos</Text>
                </View>
                <Text style={styles.activeName}>{activeHabit.name}</Text>
                {activeHabit.anchorText && (
                  <Text style={styles.activeAnchor}>↳ {activeHabit.anchorText}</Text>
                )}

                {/* DECISIÓN SEGÚN LOS 21 DÍAS */}
                {canPromote ? (
                  <View style={styles.decisionPass}>
                    <Text style={styles.decisionTitle}>🎉 ¡Listo para abrir un nuevo camino!</Text>
                    <Text style={styles.decisionText}>
                      Tu hábito ya superó los 21 días. Ha echado raíces suficientes como para pasar
                      a Mantenimiento y dar la bienvenida a tu próximo hábito activo.
                    </Text>

                    <TouchableOpacity
                      style={styles.promoteBtn}
                      onPress={() => {
                        onClose();
                        onPromoteAndAddHabit(activeHabit);
                      }}
                    >
                      <Text style={styles.promoteBtnText}>
                        Consolidar y sumar hábito para el mes que entra 🌿
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.decisionPedagogy}>
                    <Text style={styles.pedagogyTitle}>🌱 Un paso a la vez (filosofía sin culpa)</Text>
                    <Text style={styles.pedagogyText}>
                      Llevás {activeHabit.currentStreak} días con "{activeHabit.name}". El cerebro necesita al
                      menos 21 días para que una conducta pase a modo automático.
                      {'\n\n'}
                      Agregar otro hábito ahora dividiría tu energía. El mes que viene, cuando este ya
                      sea natural, abriremos la puerta para el siguiente.
                    </Text>
                    <TouchableOpacity style={styles.pedagogyBtn} onPress={onClose}>
                      <Text style={styles.pedagogyBtnText}>Seguir consolidando con calma 🌱</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.activeReviewBox}>
                <Text style={styles.activeTag}>🌿 RUTINA EN CURSO</Text>
                <Text style={styles.activeName}>Todos tus hábitos están consolidados</Text>
                <Text style={styles.pedagogyText}>
                  Podés sumar un nuevo hábito activo desde tu Dashboard en cualquier momento.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 46, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: THEME.colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.dark,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.muted,
  },
  content: {
    paddingBottom: 24,
  },
  statsCard: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  statsGreeting: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 2,
  },
  statsDescription: {
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 16,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.sandLight,
    borderRadius: THEME.radius.md,
    paddingVertical: 12,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.dark,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: THEME.colors.border,
    height: '60%',
    alignSelf: 'center',
  },
  activeReviewBox: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.sage,
    textTransform: 'uppercase',
  },
  activeStreakText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  activeName: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.dark,
  },
  activeAnchor: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 2,
    marginBottom: 12,
  },
  decisionPass: {
    backgroundColor: THEME.colors.sageLight,
    padding: 14,
    borderRadius: THEME.radius.md,
    marginTop: 10,
  },
  decisionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 4,
  },
  decisionText: {
    fontSize: 12,
    color: THEME.colors.dark,
    lineHeight: 17,
    marginBottom: 12,
  },
  promoteBtn: {
    backgroundColor: THEME.colors.sage,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  promoteBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  decisionPedagogy: {
    backgroundColor: THEME.colors.lightGray,
    padding: 14,
    borderRadius: THEME.radius.md,
    marginTop: 10,
  },
  pedagogyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 4,
  },
  pedagogyText: {
    fontSize: 12,
    color: THEME.colors.dark,
    lineHeight: 17,
    marginBottom: 12,
  },
  pedagogyBtn: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  pedagogyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.dark,
  },
});
