import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
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
import { scheduleDailyReminder } from './src/services/notificationService';

function AppContent() {
  const {
    isLoaded,
    loadFromStorage,
    settings,
    habits,
    useShield,
    resetStreak,
    promoteToMaintenance,
    addNewActiveHabit,
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

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Programar recordatorio diario y verificar escudos pendientes al abrir
  useEffect(() => {
    if (isLoaded && settings.onboardingCompleted) {
      scheduleDailyReminder(settings.reminderTime || '20:00');

      // Comprobar automáticamente si ayer faltó tildar y hay escudos
      checkPendingShieldsAndExpiration().then((pending) => {
        if (pending) {
          setPendingShieldDate(pending.missedDate);
          setShieldModalVisible(true);
        }
      });
    }
  }, [isLoaded, settings.onboardingCompleted, settings.reminderTime]);

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
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return (
    <>
      <StatusBar barStyle="dark-content" />

      {currentScreen === 'dashboard' ? (
        <DashboardScreen
          onOpenDetail={(habit) => {
            setSelectedHabit(habit);
            setCurrentScreen('detail');
          }}
          onSimulateShield={() => setShieldModalVisible(true)}
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
      />

      {/* Modal de Revisión y Balance Mensual */}
      <MonthlyReviewModal
        visible={monthlyReviewVisible}
        onClose={() => setMonthlyReviewVisible(false)}
        habits={habits}
        logs={useHabitStore.getState().logs}
        onPromoteAndAddHabit={async (habit) => {
          await promoteToMaintenance(habit.id);
          setAddHabitModalVisible(true);
        }}
      />

      {/* Modal interactivo de confirmación de escudo */}
      <ShieldModal
        visible={shieldModalVisible}
        habit={activeHabit}
        onConfirm={() => {
          if (activeHabit) {
            useShield(activeHabit.id, pendingShieldDate || yesterdayStr);
          }
          setPendingShieldDate(null);
          setShieldModalVisible(false);
        }}
        onReject={() => {
          if (activeHabit) {
            resetStreak(activeHabit.id);
          }
          setPendingShieldDate(null);
          setShieldModalVisible(false);
        }}
        onClose={() => {
          setPendingShieldDate(null);
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
