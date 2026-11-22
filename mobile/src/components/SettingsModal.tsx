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
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onResetOnboarding,
}) => {
  const { settings, updateSettings, habits, resetAllData, setSimulatedStreak } = useHabitStore();
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || '20:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const activeHabit = habits.find((h) => h.status === 'active');

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

  const confirmReset = () => {
    Alert.alert(
      'Reiniciar datos de prueba',
      '¿Seguro que querés reiniciar la aplicación? Esto borrará tus hábitos actuales y volverá a mostrar el Onboarding inicial.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            onClose();
            onResetOnboarding();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.badgeText}>PREFERENCIAS</Text>
              <Text style={styles.title}>Configuración</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
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
              </View>
            </View>

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
                      Alert.alert('Racha ajustada a 6 días', 'Ahora andá a "Mi Día" y marcá el hábito para ver el festejo del hito de 7 días y la reposición de escudo.');
                      onClose();
                    }}
                  >
                    <Text style={styles.simBtnText}>Día 6 (para hito 7d 🔥)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={async () => {
                      await setSimulatedStreak(activeHabit.id, 20, 1);
                      Alert.alert('Racha ajustada a 20 días', 'Ahora andá a "Mi Día" y marcalo para ver el festejo del hito de 21 días, reposición y habilitación de consolidar.');
                      onClose();
                    }}
                  >
                    <Text style={styles.simBtnText}>Día 20 (para hito 21d 🌿)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SECCIÓN ZONA DE PRUEBAS / REINICIO */}
            <View style={styles.dangerSection}>
              <Text style={styles.dangerTitle}>Datos locales</Text>
              <Text style={styles.dangerSubtitle}>
                Apliando Ando guarda todo offline en tu dispositivo. Podés reiniciar para volver a vivir el onboarding.
              </Text>
              <TouchableOpacity style={styles.resetBtn} onPress={confirmReset}>
                <Text style={styles.resetBtnText}>🔄 Reiniciar datos y repetir Onboarding</Text>
              </TouchableOpacity>
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
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.muted,
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
  section: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 4,
  },
  sectionSubtitle: {
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
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.dark,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.dark,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
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
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.dark,
    textAlign: 'center',
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 4,
  },
  dangerSubtitle: {
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
    color: '#C0392B',
    fontSize: 12,
    fontWeight: '800',
  },
});
