import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { Sprout, Trophy, Calendar } from 'lucide-react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useHabitStore, areTodayCheckableHabitsCompleted } from './src/store/habitStore';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { ShieldModal } from './src/components/ShieldModal';
import { AddHabitModal } from './src/components/AddHabitModal';
import { ConsolidationModal } from './src/components/ConsolidationModal';
import { StickersModal, StickersContent } from './src/components/StickersModal';
import { SettingsModal } from './src/components/SettingsModal';
import { MonthlyReviewModal, MonthlyReviewContent } from './src/components/MonthlyReviewModal';
import {
  MilestoneCelebrationModal,
  MilestoneCelebrationData,
} from './src/components/MilestoneCelebrationModal';
import { Habit } from './src/types/habit';
import { THEME, ThemeColors } from './src/theme/colors';
import { useAppTheme } from './src/theme/useAppTheme';
import { useTranslation } from './src/i18n/translations';
import {
  scheduleDailyReminder,
  cancelDailyReminders,
  scheduleShieldAlert,
  cancelShieldAlerts,
} from './src/services/notificationService';

function AppContent() {
  const {
    isLoaded,
    loadFromStorage,
    settings,
    habits,
    resolveShieldDecisions,
    promoteToMaintenance,
    addNewActiveHabit,
    updateSettings,
    checkPendingShieldsAndExpiration,
  } = useHabitStore();
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'detail'>('dashboard');
  const [activeTab, setActiveTab] = useState<'today' | 'album' | 'month'>('today');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [shieldModalVisible, setShieldModalVisible] = useState<boolean>(false);
  const [addHabitModalVisible, setAddHabitModalVisible] = useState<boolean>(false);
  const [consolidationModalVisible, setConsolidationModalVisible] = useState<boolean>(false);
  const [habitToConsolidate, setHabitToConsolidate] = useState<Habit | null>(null);
  const [stickersModalVisible, setStickersModalVisible] = useState<boolean>(false);
  const [habitForStickers, setHabitForStickers] = useState<Habit | null>(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  const [monthlyReviewVisible, setMonthlyReviewVisible] = useState<boolean>(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState<MilestoneCelebrationData | null>(null);
  const [pendingShieldDate, setPendingShieldDate] = useState<string | null>(null);
  const [pendingShieldHabits, setPendingShieldHabits] = useState<Habit[]>([]);
  const [simulatingShield, setSimulatingShield] = useState<boolean>(false);
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Programar recordatorio diario y verificar escudos pendientes al abrir
  useEffect(() => {
    if (isLoaded && settings.onboardingCompleted) {
      if (settings.notificationsEnabled) {
        const { habits: currentHabits, logs: currentLogs } = useHabitStore.getState();
        const allTodayDone = areTodayCheckableHabitsCompleted(currentHabits, currentLogs);
        scheduleDailyReminder(settings.reminderTime || '20:00', allTodayDone);
      } else {
        cancelDailyReminders();
      }

      // Comprobar automáticamente si ayer faltó tildar y hay escudos (activo + mantenimiento)
      checkPendingShieldsAndExpiration().then((pending) => {
        if (pending && pending.pendingHabits.length > 0) {
          setPendingShieldHabits(pending.pendingHabits);
          setPendingShieldDate(pending.missedDate);
          setSimulatingShield(false);
          setShieldModalVisible(true);
          if (settings.notificationsEnabled) {
            scheduleShieldAlert(pending.pendingHabits.map((h) => h.name));
          }
        } else {
          setPendingShieldHabits([]);
          setPendingShieldDate(null);
          cancelShieldAlerts();

          // Disparo automático de Revisión Mensual (día 1 o últimos 2 días del mes, una sola vez por mes)
          const now = new Date();
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const isReviewWindow = now.getDate() === 1 || now.getDate() >= daysInMonth - 1;
          const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          if (isReviewWindow && settings.lastMonthlyReviewDismissed !== currentMonthKey) {
            setMonthlyReviewVisible(true);
          }
        }
      });
    }
  }, [isLoaded, settings.onboardingCompleted, settings.reminderTime, settings.notificationsEnabled]);

  if (!isLoaded) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  // 1. Si no completó el onboarding, mostrar Onboarding
  if (!settings.onboardingCompleted || habits.length === 0) {
    return (
      <>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <OnboardingScreen />
      </>
    );
  }

  const activeHabit = habits.find((h) => h.status === 'active') || habits[0];
  const yesterdayLocal = new Date(Date.now() - 86400000);
  const yesterdayStr = `${yesterdayLocal.getFullYear()}-${String(yesterdayLocal.getMonth() + 1).padStart(2, '0')}-${String(yesterdayLocal.getDate()).padStart(2, '0')}`;
  const checkableWithShields = habits.filter(
    (h) => (h.status === 'active' || h.status === 'maintenance') && h.shieldsAvailable > 0
  );
  const modalShieldHabits =
    !simulatingShield && pendingShieldHabits.length > 0
      ? pendingShieldHabits
      : checkableWithShields.length > 0
      ? checkableWithShields
      : activeHabit
      ? [activeHabit]
      : [];

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {currentScreen === 'dashboard' ? (
        <View style={styles.mainShell}>
          <View style={styles.tabBody}>
            {activeTab === 'today' && (
              <DashboardScreen
                onOpenDetail={(habit) => {
                  setSelectedHabit(habit);
                  setCurrentScreen('detail');
                }}
                onSimulateShield={() => {
                  setSimulatingShield(pendingShieldHabits.length === 0);
                  setShieldModalVisible(true);
                }}
                onOpenAddHabit={() => setAddHabitModalVisible(true)}
                onPromoteHabit={(habit) => {
                  setHabitToConsolidate(habit);
                  setConsolidationModalVisible(true);
                }}
                onOpenSettings={() => setSettingsModalVisible(true)}
                onMilestoneReached={(celebration) => setMilestoneCelebration(celebration)}
                pendingShieldCount={pendingShieldHabits.length}
                onOpenPendingShields={() => {
                  setSimulatingShield(false);
                  setShieldModalVisible(true);
                }}
              />
            )}

            {activeTab === 'album' && (
              <SafeAreaView style={styles.tabSafeArea} edges={['top']}>
                <StickersContent embedded allHabits={habits} />
              </SafeAreaView>
            )}

            {activeTab === 'month' && (
              <SafeAreaView style={styles.tabSafeArea} edges={['top']}>
                <MonthlyReviewContent
                  embedded
                  habits={habits}
                  logs={useHabitStore.getState().logs}
                  onPromoteAndAddHabit={async (habit) => {
                    await promoteToMaintenance(habit.id);
                    setAddHabitModalVisible(true);
                  }}
                  onContinueFocus={() => setActiveTab('today')}
                />
              </SafeAreaView>
            )}
          </View>

          <SafeAreaView style={styles.bottomBarSafe} edges={['bottom']}>
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab('today')}
                activeOpacity={0.75}
              >
                <View style={[styles.tabIconPill, activeTab === 'today' && styles.tabIconPillActive]}>
                  <Sprout
                    size={20}
                    color={activeTab === 'today' ? colors.coral : colors.muted}
                  />
                </View>
                <Text style={[styles.tabLabel, activeTab === 'today' && styles.tabLabelActive]}>
                  {t.tabs.today}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab('album')}
                activeOpacity={0.75}
              >
                <View style={[styles.tabIconPill, activeTab === 'album' && styles.tabIconPillActive]}>
                  <Trophy
                    size={20}
                    color={activeTab === 'album' ? colors.coral : colors.muted}
                  />
                </View>
                <Text style={[styles.tabLabel, activeTab === 'album' && styles.tabLabelActive]}>
                  {t.tabs.album}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab('month')}
                activeOpacity={0.75}
              >
                <View style={[styles.tabIconPill, activeTab === 'month' && styles.tabIconPillActive]}>
                  <Calendar
                    size={20}
                    color={activeTab === 'month' ? colors.coral : colors.muted}
                  />
                </View>
                <Text style={[styles.tabLabel, activeTab === 'month' && styles.tabLabelActive]}>
                  {t.tabs.month}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        selectedHabit && (
          <DetailScreen
            habit={habits.find((h) => h.id === selectedHabit.id) || selectedHabit}
            onBack={() => {
              setSelectedHabit(null);
              setCurrentScreen('dashboard');
            }}
            onOpenAddHabit={() => setAddHabitModalVisible(true)}
            onOpenStickers={() => {
              setHabitForStickers(selectedHabit);
              setStickersModalVisible(true);
            }}
          />
        )
      )}

      {/* Modal de Consolidación por 21 Días */}
      <ConsolidationModal
        visible={consolidationModalVisible}
        habit={habitToConsolidate}
        onConfirmPromote={async () => {
          if (habitToConsolidate) {
            await promoteToMaintenance(habitToConsolidate.id);
          }
          setConsolidationModalVisible(false);
          setAddHabitModalVisible(true);
        }}
        onKeepActive={() => setConsolidationModalVisible(false)}
      />

      {/* Modal para Sumar Nuevo Hábito Activo */}
      <AddHabitModal
        visible={addHabitModalVisible}
        onClose={() => setAddHabitModalVisible(false)}
        availableAnchors={habits.filter((h) => h.status === 'maintenance' || h.status === 'anchor')}
        onAddHabit={async (name, color, anchorText) => {
          await addNewActiveHabit(name, color, anchorText);
        }}
      />

      {/* Modal de Álbum de Logros y Stickers */}
      <StickersModal
        visible={stickersModalVisible}
        onClose={() => setStickersModalVisible(false)}
        habit={habitForStickers}
        allHabits={habits}
      />

      {/* Modal de Configuración y Preferencias */}
      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        onResetOnboarding={() => {
          setSelectedHabit(null);
          setActiveTab('today');
          setCurrentScreen('dashboard');
        }}
        onOpenHabitDetail={(habit) => {
          setSelectedHabit(habit);
          setCurrentScreen('detail');
        }}
      />

      {/* Modal de Revisión y Balance Mensual */}
      <MonthlyReviewModal
        visible={monthlyReviewVisible}
        onClose={() => {
          const now = new Date();
          const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          updateSettings({ lastMonthlyReviewDismissed: currentMonthKey });
          setMonthlyReviewVisible(false);
        }}
        habits={habits}
        logs={useHabitStore.getState().logs}
        onPromoteAndAddHabit={async (habit) => {
          await promoteToMaintenance(habit.id);
          setAddHabitModalVisible(true);
        }}
      />

      {/* Modal interactivo de confirmación de escudo (individual o agrupado) */}
      <ShieldModal
        visible={shieldModalVisible}
        habits={modalShieldHabits}
        onConfirmSingle={async (habit) => {
          await resolveShieldDecisions(pendingShieldDate || yesterdayStr, [habit.id], []);
          setPendingShieldHabits([]);
          setPendingShieldDate(null);
          setSimulatingShield(false);
          setShieldModalVisible(false);
          cancelShieldAlerts();
        }}
        onRejectSingle={async (habit) => {
          await resolveShieldDecisions(pendingShieldDate || yesterdayStr, [], [habit.id]);
          setPendingShieldHabits([]);
          setPendingShieldDate(null);
          setSimulatingShield(false);
          setShieldModalVisible(false);
          cancelShieldAlerts();
        }}
        onConfirmGrouped={async (protectedIds, resetIds) => {
          await resolveShieldDecisions(
            pendingShieldDate || yesterdayStr,
            protectedIds,
            resetIds
          );
          setPendingShieldHabits([]);
          setPendingShieldDate(null);
          setSimulatingShield(false);
          setShieldModalVisible(false);
          cancelShieldAlerts();
        }}
        onClose={() => {
          setSimulatingShield(false);
          setShieldModalVisible(false);
        }}
      />

      {/* Modal de Festejo de Hitos y Reposición de Escudos */}
      <MilestoneCelebrationModal
        visible={milestoneCelebration !== null}
        data={milestoneCelebration}
        onClose={() => setMilestoneCelebration(null)}
      />
    </>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={loadingStyles.centerLoading}>
        <ActivityIndicator size="large" color={THEME.colors.coral} />
      </View>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppContent />
    </SafeAreaProvider>
  );
}

const loadingStyles = StyleSheet.create({
  centerLoading: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    centerLoading: {
      flex: 1,
      backgroundColor: colors.cream,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mainShell: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.cream,
      overflow: 'hidden',
    },
    tabBody: {
      flex: 1,
      width: '100%',
      overflow: 'hidden',
    },
    tabSafeArea: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.cream,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0,
    },
    bottomBarSafe: {
      width: '100%',
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 6,
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      paddingTop: 8,
      paddingBottom: 8,
      paddingHorizontal: 12,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    tabIconPill: {
      paddingHorizontal: 16,
      paddingVertical: 5,
      borderRadius: THEME.radius.full,
    },
    tabIconPillActive: {
      backgroundColor: colors.coralLight,
    },
    tabLabel: {
      fontFamily: THEME.fonts.medium,
      fontSize: 11,
      color: colors.muted,
    },
    tabLabelActive: {
      fontFamily: THEME.fonts.semibold,
      color: colors.coral,
    },
  });
