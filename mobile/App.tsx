import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useHabitStore } from './src/store/habitStore';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { ShieldModal } from './src/components/ShieldModal';
import { AddHabitModal } from './src/components/AddHabitModal';
import { ConsolidationModal } from './src/components/ConsolidationModal';
import { StickersModal } from './src/components/StickersModal';
import { Habit } from './src/types/habit';
import { THEME } from './src/theme/colors';
import { scheduleDailyReminder } from './src/services/notificationService';

export default function App() {
  const {
    isLoaded,
    loadFromStorage,
    settings,
    habits,
    useShield,
    resetStreak,
    promoteToMaintenance,
    addNewActiveHabit,
  } = useHabitStore();
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [shieldModalVisible, setShieldModalVisible] = useState<boolean>(false);
  const [addHabitModalVisible, setAddHabitModalVisible] = useState<boolean>(false);
  const [consolidationModalVisible, setConsolidationModalVisible] = useState<boolean>(false);
  const [habitToConsolidate, setHabitToConsolidate] = useState<Habit | null>(null);
  const [stickersModalVisible, setStickersModalVisible] = useState<boolean>(false);
  const [habitForStickers, setHabitForStickers] = useState<Habit | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Programar recordatorio diario una vez cargada la configuración
  useEffect(() => {
    if (isLoaded && settings.onboardingCompleted) {
      scheduleDailyReminder(settings.reminderTime || '20:00');
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

      {/* Modal interactivo de confirmación de escudo */}
      <ShieldModal
        visible={shieldModalVisible}
        habit={activeHabit}
        onConfirm={() => {
          if (activeHabit) {
            useShield(activeHabit.id, yesterdayStr);
          }
          setShieldModalVisible(false);
        }}
        onReject={() => {
          if (activeHabit) {
            resetStreak(activeHabit.id);
          }
          setShieldModalVisible(false);
        }}
        onClose={() => setShieldModalVisible(false)}
      />
    </>
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
