import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useHabitStore } from './src/store/habitStore';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { ShieldModal } from './src/components/ShieldModal';
import { AddHabitModal } from './src/components/AddHabitModal';
import { ConsolidationModal } from './src/components/ConsolidationModal';
import { StickersModal } from './src/components/StickersModal';
import { SettingsModal } from './src/components/SettingsModal';
import { MonthlyReviewModal } from './src/components/MonthlyReviewModal';
import {
  MilestoneCelebrationModal,
  MilestoneCelebrationData,
} from './src/components/MilestoneCelebrationModal';
import { Habit } from './src/types/habit';
import { THEME } from './src/theme/colors';
import {
  scheduleDailyReminder,
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

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Programar recordatorio diario y verificar escudos pendientes al abrir
  useEffect(() => {
    if (isLoaded && settings.onboardingCompleted) {
      if (settings.notificationsEnabled) {
        scheduleDailyReminder(settings.reminderTime || '20:00');
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
        <ActivityIndicator size="large" color={THEME.colors.sage} />
      </View>
    );
  }

  // 1. Si no completó el onboarding, mostrar Onboarding
  if (!settings.onboardingCompleted || habits.length === 0) {
    return (
      <>
        <StatusBar barStyle="dark-content" />
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
      <StatusBar barStyle="dark-content" />

      {currentScreen === 'dashboard' ? (
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
          onOpenStickers={() => {
            setHabitForStickers(null);
            setStickersModalVisible(true);
          }}
          onOpenSettings={() => setSettingsModalVisible(true)}
          onOpenMonthlyReview={() => setMonthlyReviewVisible(true)}
          onMilestoneReached={(celebration) => setMilestoneCelebration(celebration)}
          pendingShieldCount={pendingShieldHabits.length}
          onOpenPendingShields={() => {
            setSimulatingShield(false);
            setShieldModalVisible(true);
          }}
        />
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
      <View style={styles.centerLoading}>
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

const styles = StyleSheet.create({
  centerLoading: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
