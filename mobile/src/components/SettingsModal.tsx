import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { THEME } from '../theme/colors';
import { useHabitStore } from '../store/habitStore';
import { scheduleDailyReminder } from '../services/notificationService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onResetOnboarding: () => void;
  onOpenHabitDetail?: (habit: import('../types/habit').Habit) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onResetOnboarding,
  onOpenHabitDetail,
}) => {
  const {
    settings,
    updateSettings,
    habits,
    resetAllData,
    resumeHabit,
    setSimulatedStreak,
    simulateFullHistoryEnvironment,
  } = useHabitStore();
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || '20:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const activeHabit = habits.find((h) => h.status === 'active');
  const pausedHabits = habits.filter((h) => h.status === 'paused');
  const archivedHabits = habits.filter((h) => h.status === 'archived');

  const getDaysPaused = (pausedAt?: string) => {
    if (!pausedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(pausedAt).getTime()) / 86400000));
  };

  const handleClose = () => {
    setConfirmingReset(false);
    onClose();
  };

  const notifyIfNative = (alertTitle: string, alertBody: string) => {
    if (Platform.OS !== 'web') {
      Alert.alert(alertTitle, alertBody);
    }
  };

  const times = ['07:00', '08:30', '13:00', '19:00', '20:00', '21:30', '22:00'];

  const handleSelectTime = async (t: string) => {
    setReminderTime(t);
    await updateSettings({ reminderTime: t });
    if (notificationsEnabled) {
      await scheduleDailyReminder(t);
    }
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    await updateSettings({ notificationsEnabled: val });
    if (val) {
      await scheduleDailyReminder(reminderTime);
    }
  };

  const handleConfirmReset = async () => {
    await resetAllData();
    setConfirmingReset(false);
    onClose();
    onResetOnboarding();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.badgeText}>PREFERENCIAS</Text>
              <Text style={styles.title}>Configuración</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* SECCIÓN NOTIFICACIONES */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recordatorio diario</Text>
              <Text style={styles.sectionSubtitle}>
                Un aviso suave al final del día para registrar tu avance sin prisa.
              </Text>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Notificaciones activadas</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: THEME.colors.border, true: THEME.colors.sage }}
                  thumbColor={notificationsEnabled ? THEME.colors.white : '#F4F3F4'}
                />
              </View>

              {notificationsEnabled && (
                <>
                  <Text style={styles.subLabel}>Horario del recordatorio</Text>
                  <View style={styles.timesRow}>
                    {times.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.timeChip,
                          reminderTime === t && styles.timeChipActive,
                        ]}
                        onPress={() => handleSelectTime(t)}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            reminderTime === t && styles.timeChipTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* SECCIÓN ESTADÍSTICAS GENERALES */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resumen de rutina</Text>
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {habits.filter((h) => h.status === 'active').length}
                  </Text>
                  <Text style={styles.statLabel}>En foco 🌱</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {habits.filter((h) => h.status === 'maintenance').length}
                  </Text>
                  <Text style={styles.statLabel}>Mantenimiento 🌿</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {habits.filter((h) => h.status === 'anchor').length}
                  </Text>
                  <Text style={styles.statLabel}>Anclas 🌳</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{pausedHabits.length}</Text>
                  <Text style={styles.statLabel}>Pausados ⏸️</Text>
                </View>
              </View>
            </View>

            {/* SECCIÓN HÁBITOS PAUSADOS Y ARCHIVADOS */}
            {(pausedHabits.length > 0 || archivedHabits.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pausados y archivados</Text>
                <Text style={styles.sectionSubtitle}>
                  Tu historial y stickers se conservan intactos. Podés retomar cuando te sientas listo.
                </Text>

                {pausedHabits.map((h) => {
                  const daysPaused = getDaysPaused(h.pausedAt);
                  return (
                    <View key={h.id} style={styles.inactiveHabitRow}>
                      <View style={styles.inactiveHabitInfo}>
                        <Text style={styles.inactiveHabitName}>⏸️ {h.name}</Text>
                        <Text style={styles.inactiveHabitMeta}>
                          En pausa hace {daysPaused} {daysPaused === 1 ? 'día' : 'días'} · Racha conservada: {h.currentStreak}d
                        </Text>
                        {daysPaused >= 14 && (
                          <Text style={styles.longPauseTag}>
                            🌿 ¿Listo para retomar con calma?
                          </Text>
                        )}
                      </View>
                      <View style={styles.inactiveActions}>
                        <TouchableOpacity
                          style={styles.resumeSmallBtn}
                          onPress={async () => {
                            await resumeHabit(h.id);
                          }}
                        >
                          <Text style={styles.resumeSmallBtnText}>Reanudar</Text>
                        </TouchableOpacity>
                        {onOpenHabitDetail && (
                          <TouchableOpacity
                            style={styles.viewSmallBtn}
                            onPress={() => {
                              handleClose();
                              onOpenHabitDetail(h);
                            }}
                          >
                            <Text style={styles.viewSmallBtnText}>Ver</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}

                {archivedHabits.map((h) => (
                  <View key={h.id} style={styles.inactiveHabitRow}>
                    <View style={styles.inactiveHabitInfo}>
                      <Text style={styles.inactiveHabitName}>📦 {h.name}</Text>
                      <Text style={styles.inactiveHabitMeta}>
                        Archivado · {h.totalCompletedDays}d totales · Récord {h.bestStreak}d
                      </Text>
                    </View>
                    {onOpenHabitDetail && (
                      <TouchableOpacity
                        style={styles.viewSmallBtn}
                        onPress={() => {
                          handleClose();
                          onOpenHabitDetail(h);
                        }}
                      >
                        <Text style={styles.viewSmallBtnText}>Ver historial</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* SIMULADOR RÁPIDO PARA PRUEBAS DE HITOS */}
            {activeHabit && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Laboratorio de prueba de hitos 🧪</Text>
                <Text style={styles.sectionSubtitle}>
                  Colocá tu hábito a 1 día de un hito (con 1 escudo disponible) para probar la reposición y el festejo inmediato al marcarlo en "Mi Día".
                </Text>
                <View style={styles.simRow}>
                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={async () => {
                      await setSimulatedStreak(activeHabit.id, 6, 1);
                      notifyIfNative(
                        'Racha ajustada a 6 días',
                        'Ahora andá a "Mi Día" y marcá el hábito para ver el festejo del hito de 7 días y la reposición de escudo.'
                      );
                      handleClose();
                    }}
                  >
                    <Text style={styles.simBtnText}>Día 6 (para hito 7d 🔥)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={async () => {
                      await setSimulatedStreak(activeHabit.id, 20, 1);
                      notifyIfNative(
                        'Racha ajustada a 20 días',
                        'Ahora andá a "Mi Día" y marcalo para ver el festejo del hito de 21 días, reposición y habilitación de consolidar.'
                      );
                      handleClose();
                    }}
                  >
                    <Text style={styles.simBtnText}>Día 20 (para hito 21d 🌿)</Text>
                  </TouchableOpacity>
                </View>

                {/* BOTÓN SIMULAR ENTORNO COMPLETO CON HISTORIAL */}
                <TouchableOpacity
                  style={styles.fullSimBtn}
                  onPress={async () => {
                    await simulateFullHistoryEnvironment();
                    notifyIfNative(
                      '🌱 Rutina completa simulada',
                      'Se generó una rutina con:\n• 1 Hábito Graduado a Ancla (180d)\n• 1 Hábito en Mantenimiento (45d)\n• 1 Hábito Activo (12d)\n• 1 Hábito Pausado (15d)\n\nPodés explorar su cadena en Mi Día y tocar cualquiera para ver su historial y calendario.'
                    );
                    handleClose();
                  }}
                >
                  <Text style={styles.fullSimBtnText}>
                    ✨ Cargar ecosistema completo (Ancla + Mantenimiento + Activo)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SECCIÓN ZONA DE PRUEBAS / REINICIO */}
            <View style={styles.dangerSection}>
              <Text style={styles.dangerTitle}>Datos locales</Text>
              <Text style={styles.dangerSubtitle}>
                Apilando Ando guarda todo offline en tu dispositivo. Podés reiniciar para volver a vivir el onboarding.
              </Text>
              {!confirmingReset ? (
                <TouchableOpacity style={styles.resetBtn} onPress={() => setConfirmingReset(true)}>
                  <Text style={styles.resetBtnText}>🔄 Reiniciar datos y repetir Onboarding</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>
                    ¿Seguro que querés reiniciar? Se borrarán tus hábitos actuales y volverás al Onboarding inicial.
                  </Text>
                  <View style={styles.confirmActions}>
                    <TouchableOpacity
                      style={styles.cancelResetBtn}
                      onPress={() => setConfirmingReset(false)}
                    >
                      <Text style={styles.cancelResetText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmResetBtn} onPress={handleConfirmReset}>
                      <Text style={styles.confirmResetText}>Sí, reiniciar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 46, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: THEME.colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: THEME.fonts.medium,
    fontSize: 21,
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
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.muted,
  },
  content: {
    paddingBottom: 24,
  },
  section: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 15,
    color: THEME.colors.dark,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.muted,
    lineHeight: 16,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: THEME.colors.dark,
  },
  subLabel: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.muted,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: THEME.colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  timeChipActive: {
    backgroundColor: THEME.colors.dark,
    borderColor: THEME.colors.dark,
  },
  timeChipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.dark,
  },
  timeChipTextActive: {
    color: THEME.colors.white,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.lightGray,
    borderRadius: THEME.radius.md,
    paddingVertical: 12,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: THEME.fonts.medium,
    fontSize: 19,
    color: THEME.colors.dark,
  },
  statLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 10,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: THEME.colors.border,
    height: '70%',
    alignSelf: 'center',
  },
  dangerSection: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  simRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  simBtn: {
    flex: 1,
    backgroundColor: THEME.colors.sandLight,
    borderWidth: 1,
    borderColor: THEME.colors.sand,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  simBtnText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.dark,
    textAlign: 'center',
  },
  fullSimBtn: {
    backgroundColor: THEME.colors.sageLight,
    borderWidth: 1,
    borderColor: THEME.colors.sage,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  fullSimBtnText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: THEME.colors.dark,
    textAlign: 'center',
  },
  dangerTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.dark,
    marginBottom: 4,
  },
  dangerSubtitle: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.muted,
    lineHeight: 16,
    marginBottom: 14,
  },
  resetBtn: {
    backgroundColor: '#FDEDEC',
    borderWidth: 1,
    borderColor: '#F5B7B1',
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  resetBtnText: {
    fontFamily: THEME.fonts.semibold,
    color: '#C0392B',
    fontSize: 12,
  },
  confirmBox: {
    backgroundColor: '#FDEDEC',
    borderWidth: 1,
    borderColor: '#F5B7B1',
    borderRadius: THEME.radius.md,
    padding: 12,
  },
  confirmText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.dark,
    lineHeight: 17,
    marginBottom: 10,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelResetBtn: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  cancelResetText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.dark,
  },
  confirmResetBtn: {
    flex: 1,
    backgroundColor: '#C0392B',
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  confirmResetText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: THEME.colors.white,
  },
  inactiveHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceLow,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  inactiveHabitInfo: {
    flex: 1,
  },
  inactiveHabitName: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: THEME.colors.dark,
  },
  inactiveHabitMeta: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  longPauseTag: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.aquaDark,
    marginTop: 4,
  },
  inactiveActions: {
    flexDirection: 'row',
    gap: 6,
  },
  resumeSmallBtn: {
    backgroundColor: THEME.colors.aqua,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: THEME.radius.full,
  },
  resumeSmallBtnText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.aquaDark,
  },
  viewSmallBtn: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: THEME.radius.full,
  },
  viewSmallBtnText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.dark,
  },
});
