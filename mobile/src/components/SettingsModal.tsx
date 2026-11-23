import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { THEME, ThemeColors } from '../theme/colors';
import { useAppTheme } from '../theme/useAppTheme';
import { useTranslation, formatText } from '../i18n/translations';
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
    simulateSixMonthsReady,
    simulateFullHistoryEnvironment,
  } = useHabitStore();
  const { colors, shadows, themeMode } = useAppTheme();
  const { t, language } = useTranslation();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const [userName, setUserName] = useState(settings.userName || '');
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

  const handleSelectTime = async (time: string) => {
    setReminderTime(time);
    await updateSettings({ reminderTime: time });
    if (notificationsEnabled) {
      await scheduleDailyReminder(time);
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
              <Text style={styles.badgeText}>{t.settings.kicker}</Text>
              <Text style={styles.title}>{t.settings.title}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* SECCIÓN APARIENCIA E IDIOMA */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.settings.appearanceTitle}</Text>
              <Text style={styles.sectionSubtitle}>{t.settings.appearanceSub}</Text>

              <Text style={[styles.subLabel, { marginTop: 2 }]}>{t.settings.nameLabel}</Text>
              <TextInput
                style={styles.nameInput}
                placeholder={t.settings.namePlaceholder}
                placeholderTextColor={colors.outline}
                value={userName}
                onChangeText={(val) => {
                  setUserName(val);
                  updateSettings({ userName: val.trim() || undefined });
                }}
              />

              <Text style={[styles.subLabel, { marginTop: 14 }]}>{t.settings.themeLabel}</Text>
              <View style={styles.segmentedRow}>
                <TouchableOpacity
                  style={[styles.segmentBtn, themeMode === 'light' && styles.segmentBtnActive]}
                  onPress={() => updateSettings({ themeMode: 'light' })}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      themeMode === 'light' && styles.segmentBtnTextActive,
                    ]}
                  >
                    {t.settings.themeLight}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, themeMode === 'dark' && styles.segmentBtnActive]}
                  onPress={() => updateSettings({ themeMode: 'dark' })}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      themeMode === 'dark' && styles.segmentBtnTextActive,
                    ]}
                  >
                    {t.settings.themeDark}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.subLabel, { marginTop: 14 }]}>{t.settings.languageLabel}</Text>
              <View style={styles.segmentedRow}>
                <TouchableOpacity
                  style={[styles.segmentBtn, language === 'es' && styles.segmentBtnActive]}
                  onPress={() => updateSettings({ language: 'es' })}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      language === 'es' && styles.segmentBtnTextActive,
                    ]}
                  >
                    {t.settings.languageEs}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, language === 'en' && styles.segmentBtnActive]}
                  onPress={() => updateSettings({ language: 'en' })}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      language === 'en' && styles.segmentBtnTextActive,
                    ]}
                  >
                    {t.settings.languageEn}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECCIÓN NOTIFICACIONES */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.settings.reminderTitle}</Text>
              <Text style={styles.sectionSubtitle}>{t.settings.reminderSub}</Text>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t.settings.notificationsEnabled}</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: colors.border, true: colors.sage }}
                  thumbColor={notificationsEnabled ? '#FFFFFF' : '#F4F3F4'}
                />
              </View>

              {notificationsEnabled && (
                <>
                  <Text style={styles.subLabel}>{t.settings.reminderTimeLabel}</Text>
                  <View style={styles.timesRow}>
                    {times.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeChip,
                          reminderTime === time && styles.timeChipActive,
                        ]}
                        onPress={() => handleSelectTime(time)}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            reminderTime === time && styles.timeChipTextActive,
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* SECCIÓN HÁBITOS PAUSADOS Y ARCHIVADOS */}
            {(pausedHabits.length > 0 || archivedHabits.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.settings.pausedTitle}</Text>
                <Text style={styles.sectionSubtitle}>{t.settings.pausedSub}</Text>

                {pausedHabits.map((h) => {
                  const daysPaused = getDaysPaused(h.pausedAt);
                  return (
                    <View key={h.id} style={styles.inactiveHabitRow}>
                      <View style={styles.inactiveHabitInfo}>
                        <Text style={styles.inactiveHabitName}>⏸️ {h.name}</Text>
                        <Text style={styles.inactiveHabitMeta}>
                          {formatText(t.settings.pausedMeta, {
                            streak: h.currentStreak,
                            shields: h.shieldsAvailable,
                          })}
                        </Text>
                        {daysPaused >= 14 && (
                          <Text style={styles.longPauseTag}>
                            {language === 'en'
                              ? `Paused ${daysPaused}d ago · Ready whenever you are`
                              : `Pausado hace ${daysPaused} días · ¿Retomamos hoy?`}
                          </Text>
                        )}
                      </View>
                      <View style={styles.inactiveActions}>
                        <TouchableOpacity
                          style={styles.resumeSmallBtn}
                          onPress={async () => {
                            await resumeHabit(h.id);
                            handleClose();
                          }}
                        >
                          <Text style={styles.resumeSmallBtnText}>{t.settings.resumeBtn}</Text>
                        </TouchableOpacity>
                        {onOpenHabitDetail && (
                          <TouchableOpacity
                            style={styles.viewSmallBtn}
                            onPress={() => {
                              handleClose();
                              onOpenHabitDetail(h);
                            }}
                          >
                            <Text style={styles.viewSmallBtnText}>{t.settings.viewBtn}</Text>
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
                        {formatText(t.settings.archivedMeta, {
                          total: h.totalCompletedDays,
                          best: h.bestStreak,
                        })}
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
                        <Text style={styles.viewSmallBtnText}>{t.settings.viewHistoryBtn}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* SIMULADOR RÁPIDO PARA PRUEBAS DE HITOS */}
            {activeHabit && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.settings.labTitle}</Text>
                <Text style={styles.sectionSubtitle}>{t.settings.labSub}</Text>
                <View style={styles.simRow}>
                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={async () => {
                      await setSimulatedStreak(activeHabit.id, 6, 1);
                      notifyIfNative('6 days', t.settings.labDay6);
                      handleClose();
                    }}
                  >
                    <Text style={styles.simBtnText}>{t.settings.labDay6}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={async () => {
                      await setSimulatedStreak(activeHabit.id, 20, 1);
                      notifyIfNative('20 days', t.settings.labDay20);
                      handleClose();
                    }}
                  >
                    <Text style={styles.simBtnText}>{t.settings.labDay20}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.sixMonthsBtn}
                  onPress={async () => {
                    await simulateSixMonthsReady(activeHabit.id);
                    notifyIfNative('6 months', t.settings.lab6Months);
                    handleClose();
                  }}
                >
                  <Text style={styles.simBtnText}>{t.settings.lab6Months}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fullSimBtn}
                  onPress={async () => {
                    await simulateFullHistoryEnvironment();
                    notifyIfNative('Demo', t.settings.labEcosystem);
                    handleClose();
                  }}
                >
                  <Text style={styles.fullSimBtnText}>{t.settings.labEcosystem}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SECCIÓN ZONA DE PRUEBAS / REINICIO */}
            <View style={styles.dangerSection}>
              <Text style={styles.dangerTitle}>{t.settings.localDataTitle}</Text>
              <Text style={styles.dangerSubtitle}>{t.settings.localDataSub}</Text>
              {!confirmingReset ? (
                <TouchableOpacity style={styles.resetBtn} onPress={() => setConfirmingReset(true)}>
                  <Text style={styles.resetBtnText}>{t.settings.resetBtn}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>{t.settings.resetConfirmText}</Text>
                  <View style={styles.confirmActions}>
                    <TouchableOpacity
                      style={styles.cancelResetBtn}
                      onPress={() => setConfirmingReset(false)}
                    >
                      <Text style={styles.cancelResetText}>{t.settings.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmResetBtn} onPress={handleConfirmReset}>
                      <Text style={styles.confirmResetText}>{t.settings.confirmReset}</Text>
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

const createStyles = (colors: ThemeColors, shadows: ReturnType<typeof useAppTheme>['shadows']) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(18, 30, 28, 0.55)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      backgroundColor: colors.cream,
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
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    title: {
      fontFamily: THEME.fonts.medium,
      fontSize: 21,
      color: colors.dark,
    },
    closeBtn: {
      padding: 8,
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
    content: {
      paddingBottom: 24,
    },
    section: {
      backgroundColor: colors.white,
      borderRadius: THEME.radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      ...shadows.card,
    },
    sectionTitle: {
      fontFamily: THEME.fonts.medium,
      fontSize: 15,
      color: colors.dark,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontFamily: THEME.fonts.regular,
      fontSize: 11,
      color: colors.muted,
      lineHeight: 16,
      marginBottom: 14,
    },
    segmentedRow: {
      flexDirection: 'row',
      gap: 8,
    },
    nameInput: {
      backgroundColor: colors.lightGray,
      borderRadius: THEME.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontFamily: THEME.fonts.regular,
      fontSize: 14,
      color: colors.dark,
    },
    segmentBtn: {
      flex: 1,
      backgroundColor: colors.lightGray,
      borderRadius: THEME.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      alignItems: 'center',
    },
    segmentBtnActive: {
      backgroundColor: colors.dark,
      borderColor: colors.dark,
    },
    segmentBtnText: {
      fontFamily: THEME.fonts.medium,
      fontSize: 13,
      color: colors.dark,
    },
    segmentBtnTextActive: {
      color: colors.cream,
      fontFamily: THEME.fonts.semibold,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    switchLabel: {
      fontFamily: THEME.fonts.medium,
      fontSize: 14,
      color: colors.dark,
    },
    subLabel: {
      fontFamily: THEME.fonts.semibold,
      fontSize: 11,
      color: colors.muted,
      marginTop: 10,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    timesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    timeChip: {
      backgroundColor: colors.lightGray,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: THEME.radius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeChipActive: {
      backgroundColor: colors.dark,
      borderColor: colors.dark,
    },
    timeChipText: {
      fontFamily: THEME.fonts.medium,
      fontSize: 12,
      color: colors.dark,
    },
    timeChipTextActive: {
      color: colors.cream,
    },
    dangerSection: {
      backgroundColor: colors.white,
      borderRadius: THEME.radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    simRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    simBtn: {
      flex: 1,
      backgroundColor: colors.sandLight,
      borderWidth: 1,
      borderColor: colors.sand,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: THEME.radius.md,
      alignItems: 'center',
    },
    simBtnText: {
      fontFamily: THEME.fonts.medium,
      fontSize: 11,
      color: colors.dark,
      textAlign: 'center',
    },
    sixMonthsBtn: {
      backgroundColor: colors.aquaLight,
      borderWidth: 1,
      borderColor: colors.aqua,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: THEME.radius.md,
      alignItems: 'center',
      marginTop: 8,
    },
    fullSimBtn: {
      backgroundColor: colors.sageLight,
      borderWidth: 1,
      borderColor: colors.sage,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: THEME.radius.md,
      alignItems: 'center',
      marginTop: 10,
    },
    fullSimBtnText: {
      fontFamily: THEME.fonts.semibold,
      fontSize: 12,
      color: colors.dark,
      textAlign: 'center',
    },
    dangerTitle: {
      fontFamily: THEME.fonts.medium,
      fontSize: 15,
      color: colors.terracotta,
      marginBottom: 4,
    },
    dangerSubtitle: {
      fontFamily: THEME.fonts.regular,
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
      marginBottom: 12,
    },
    resetBtn: {
      backgroundColor: colors.coralLight,
      paddingVertical: 12,
      borderRadius: THEME.radius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.coral,
    },
    resetBtnText: {
      fontFamily: THEME.fonts.medium,
      fontSize: 13,
      color: colors.coral,
    },
    confirmBox: {
      backgroundColor: colors.coralLight,
      padding: 12,
      borderRadius: THEME.radius.md,
      borderWidth: 1,
      borderColor: colors.coral,
    },
    confirmText: {
      fontFamily: THEME.fonts.medium,
      fontSize: 12,
      color: colors.dark,
      marginBottom: 10,
      lineHeight: 17,
    },
    confirmActions: {
      flexDirection: 'row',
      gap: 8,
    },
    cancelResetBtn: {
      flex: 1,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      borderRadius: THEME.radius.md,
      alignItems: 'center',
    },
    cancelResetText: {
      fontFamily: THEME.fonts.medium,
      fontSize: 12,
      color: colors.dark,
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
      color: '#FFFFFF',
    },
    inactiveHabitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceLow,
      borderRadius: THEME.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.dark,
    },
    inactiveHabitMeta: {
      fontFamily: THEME.fonts.regular,
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    longPauseTag: {
      fontFamily: THEME.fonts.medium,
      fontSize: 11,
      color: colors.aquaDark,
      marginTop: 4,
    },
    inactiveActions: {
      flexDirection: 'row',
      gap: 6,
    },
    resumeSmallBtn: {
      backgroundColor: colors.aqua,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: THEME.radius.full,
    },
    resumeSmallBtnText: {
      fontFamily: THEME.fonts.semibold,
      fontSize: 11,
      color: '#121E1C',
    },
    viewSmallBtn: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: THEME.radius.full,
    },
    viewSmallBtnText: {
      fontFamily: THEME.fonts.medium,
      fontSize: 11,
      color: colors.dark,
    },
  });
