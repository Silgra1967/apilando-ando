import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Platform,
  AppState,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { Sprout, Trophy, Calendar } from 'lucide-react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  useHabitStore,
  areTodayCheckableHabitsCompleted,
  toLocalDateStr,
} from './src/store/habitStore';
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

function getMonthlyReviewKey(now: Date): string {
  const target =
    now.getDate() === 1
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : now;
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
}

function AppContent() {
  const {
    isLoaded,
    loadFromStorage,
    settings,
    habits,
    logs,
    resolveShieldDecisions,
    promoteToMaintenance,
    addNewActiveHabit,
    updateSettings,
    checkPendingShieldsAndExpiration,
  } = useHabitStore();
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'detail'>('dashboard');
  const [activeTab, setActiveTab] = useState<'today' | 'album' | 'month'>('today');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [shieldModalVisible, setShieldModalVisible] = useState<boolean>(false);
  const [addHabitModalVisible, setAddHabitModalVisible] = useState<boolean>(false);
  const [consolidationModalVisible, setConsolidationModalVisible] = useState<boolean>(false);
  const [habitToConsolidate, setHabitToConsolidate] = useState<Habit | null>(null);
  const [stickersModalVisible, setStickersModalVisible] = useState<boolean>(false);
  const [habitForStickersId, setHabitForStickersId] = useState<string | null>(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  const [monthlyReviewVisible, setMonthlyReviewVisible] = useState<boolean>(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState<MilestoneCelebrationData | null>(null);
  const [pendingShieldDate, setPendingShieldDate] = useState<string | null>(null);
  const [pendingShieldHabits, setPendingShieldHabits] = useState<Habit[]>([]);
  const [currentDateKey, setCurrentDateKey] = useState<string>(() => toLocalDateStr(new Date()));
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Detectar cambio de día al volver de segundo plano (móvil/web) o al cruzar medianoche
  useEffect(() => {
    const syncCurrentDate = () => {
      const latestDate = toLocalDateStr(new Date());
      setCurrentDateKey((prev) => (prev !== latestDate ? latestDate : prev));
    };

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncCurrentDate();
      }
    });

    const handleWebVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncCurrentDate();
      }
    };

    if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleWebVisibility);
      window.addEventListener('focus', syncCurrentDate);
    }

    // Programar actualización exacta 2 segundos después de medianoche
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      2,
      0
    );
    const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());
    const midnightTimer = setTimeout(syncCurrentDate, msUntilMidnight);

    return () => {
      appStateSub.remove();
      clearTimeout(midnightTimer);
      if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleWebVisibility);
        window.removeEventListener('focus', syncCurrentDate);
      }
    };
  }, [currentDateKey]);

  // Programar recordatorio diario y verificar escudos pendientes al abrir o al cambiar de día
  useEffect(() => {
    if (isLoaded && settings.onboardingCompleted) {
      const activeLang = settings.language || 'es';
      if (settings.notificationsEnabled) {
        const { habits: currentHabits, logs: currentLogs } = useHabitStore.getState();
        const allTodayDone = areTodayCheckableHabitsCompleted(currentHabits, currentLogs);
        scheduleDailyReminder(settings.reminderTime || '20:00', allTodayDone, activeLang);
      } else {
        cancelDailyReminders();
      }

      // Comprobar automáticamente si ayer faltó tildar y hay escudos (activo + mantenimiento)
      checkPendingShieldsAndExpiration().then((pending) => {
        if (pending && pending.pendingHabits.length > 0) {
          setPendingShieldHabits(pending.pendingHabits);
          setPendingShieldDate(pending.missedDate);
          setShieldModalVisible(true);
          if (settings.notificationsEnabled) {
            scheduleShieldAlert(
              pending.pendingHabits.map((h) => h.name),
              activeLang
            );
          }
        } else {
          setPendingShieldHabits([]);
          setPendingShieldDate(null);
          cancelShieldAlerts();

          // Disparo automático de Revisión Mensual (día 1 o últimos 2 días del mes, una sola vez por mes)
          const now = new Date();
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const isReviewWindow = now.getDate() === 1 || now.getDate() >= daysInMonth - 1;
          const reviewKey = getMonthlyReviewKey(now);
          if (isReviewWindow && settings.lastMonthlyReviewDismissed !== reviewKey) {
            setMonthlyReviewVisible(true);
          }
        }
      });
    }
  }, [
    isLoaded,
    settings.onboardingCompleted,
    settings.reminderTime,
    settings.notificationsEnabled,
    settings.language,
    currentDateKey,
  ]);

  const checkableHabits = useMemo(
    () =>
      habits
        .filter((h) => h.status === 'active' || h.status === 'maintenance')
        .sort((a, b) => (a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0)),
    [habits]
  );

  const livePendingShieldHabits = useMemo(() => {
    if (!pendingShieldDate) return [];
    return pendingShieldHabits.filter((pending) => {
      const current = habits.find((h) => h.id === pending.id);
      if (!current) return false;
      if (current.status !== 'active' && current.status !== 'maintenance') return false;
      if (current.shieldsAvailable <= 0) return false;
      return !logs[`${current.id}_${pendingShieldDate}`];
    });
  }, [pendingShieldHabits, pendingShieldDate, habits, logs]);

  if (!isLoaded) {
    return <BrandSplash colors={colors} />;
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

  const isShieldInfoOnly = livePendingShieldHabits.length === 0;
  const modalShieldHabits = isShieldInfoOnly ? checkableHabits : livePendingShieldHabits;
  const hasActiveHabit = habits.some((h) => h.status === 'active');
  const selectedHabit = selectedHabitId
    ? habits.find((h) => h.id === selectedHabitId) || null
    : null;
  const habitForStickers = habitForStickersId
    ? habits.find((h) => h.id === habitForStickersId) || null
    : null;

  const openAddHabitIfAllowed = () => {
    const currentHasActive = useHabitStore
      .getState()
      .habits.some((h) => h.status === 'active');
    if (!currentHasActive) {
      setAddHabitModalVisible(true);
    }
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {currentScreen === 'dashboard' || !selectedHabit ? (
        <View style={styles.mainShell}>
          <View style={styles.tabBody}>
            {activeTab === 'today' && (
              <DashboardScreen
                currentDateKey={currentDateKey}
                onOpenDetail={(habit) => {
                  setSelectedHabitId(habit.id);
                  setCurrentScreen('detail');
                }}
                onOpenShieldStatus={() => setShieldModalVisible(true)}
                onOpenAddHabit={openAddHabitIfAllowed}
                onPromoteHabit={(habit) => {
                  setHabitToConsolidate(habit);
                  setConsolidationModalVisible(true);
                }}
                onOpenSettings={() => setSettingsModalVisible(true)}
                onMilestoneReached={(celebration) => setMilestoneCelebration(celebration)}
                pendingShieldCount={livePendingShieldHabits.length}
                onOpenPendingShields={() => setShieldModalVisible(true)}
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
                  logs={logs}
                  currentDateKey={currentDateKey}
                  onPromoteAndAddHabit={async (habit) => {
                    await promoteToMaintenance(habit.id);
                    openAddHabitIfAllowed();
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
        <DetailScreen
          habit={selectedHabit}
          currentDateKey={currentDateKey}
          onBack={() => {
            setSelectedHabitId(null);
            setCurrentScreen('dashboard');
          }}
          onOpenAddHabit={openAddHabitIfAllowed}
          onOpenStickers={() => {
            setHabitForStickersId(selectedHabit.id);
            setStickersModalVisible(true);
          }}
        />
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
          openAddHabitIfAllowed();
        }}
        onKeepActive={() => setConsolidationModalVisible(false)}
      />

      {/* Modal para Sumar Nuevo Hábito Activo */}
      <AddHabitModal
        visible={addHabitModalVisible}
        onClose={() => setAddHabitModalVisible(false)}
        availableAnchors={habits.filter((h) => h.status === 'maintenance' || h.status === 'anchor')}
        hasActiveHabit={hasActiveHabit}
        onAddHabit={async (name, color, anchorText) => {
          return await addNewActiveHabit(name, color, anchorText);
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
          setSelectedHabitId(null);
          setHabitForStickersId(null);
          setActiveTab('today');
          setCurrentScreen('dashboard');
        }}
        onOpenHabitDetail={(habit) => {
          setSelectedHabitId(habit.id);
          setCurrentScreen('detail');
        }}
      />

      {/* Modal de Revisión y Balance Mensual */}
      <MonthlyReviewModal
        visible={monthlyReviewVisible}
        onClose={() => {
          const reviewKey = getMonthlyReviewKey(new Date());
          updateSettings({ lastMonthlyReviewDismissed: reviewKey });
          setMonthlyReviewVisible(false);
        }}
        habits={habits}
        logs={logs}
        currentDateKey={currentDateKey}
        onPromoteAndAddHabit={async (habit) => {
          await promoteToMaintenance(habit.id);
          openAddHabitIfAllowed();
        }}
      />

      {/* Modal interactivo de confirmación de escudo (o estado informativo si no hay pendientes) */}
      <ShieldModal
        visible={shieldModalVisible}
        habits={modalShieldHabits}
        infoOnly={isShieldInfoOnly}
        onConfirmSingle={async (habit) => {
          if (!pendingShieldDate) return;
          await resolveShieldDecisions(pendingShieldDate, [habit.id], []);
          setPendingShieldHabits([]);
          setPendingShieldDate(null);
          setShieldModalVisible(false);
          cancelShieldAlerts();
        }}
        onRejectSingle={async (habit) => {
          if (!pendingShieldDate) return;
          await resolveShieldDecisions(pendingShieldDate, [], [habit.id]);
          setPendingShieldHabits([]);
          setPendingShieldDate(null);
          setShieldModalVisible(false);
          cancelShieldAlerts();
        }}
        onConfirmGrouped={async (protectedIds, resetIds) => {
          if (!pendingShieldDate) return;
          await resolveShieldDecisions(pendingShieldDate, protectedIds, resetIds);
          setPendingShieldHabits([]);
          setPendingShieldDate(null);
          setShieldModalVisible(false);
          cancelShieldAlerts();
        }}
        onClose={() => {
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

function BrandSplash({ colors, fontLoaded = true }: { colors: ThemeColors; fontLoaded?: boolean }) {
  return (
    <View style={[loadingStyles.centerLoading, { backgroundColor: colors.cream }]}>
      <Image
        source={require('./assets/logo.png')}
        style={loadingStyles.logo}
        resizeMode="contain"
      />
      <Text
        style={[
          loadingStyles.brandTitle,
          { color: colors.dark },
          fontLoaded && { fontFamily: THEME.fonts.bold },
        ]}
      >
        Apilando <Text style={{ color: colors.coral }}>Ando</Text>
      </Text>
      <ActivityIndicator size="small" color={colors.coral} style={loadingStyles.spinner} />
    </View>
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
    return <BrandSplash colors={THEME.colors} fontLoaded={false} />;
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
    paddingHorizontal: 24,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
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
