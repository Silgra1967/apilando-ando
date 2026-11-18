import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useHabitStore } from './src/store/habitStore';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { ShieldModal } from './src/components/ShieldModal';
import { Habit } from './src/types/habit';
import { THEME } from './src/theme/colors';
import { scheduleDailyReminder } from './src/services/notificationService';

export default function App() {
  const { isLoaded, loadFromStorage, settings, habits, useShield, resetStreak } = useHabitStore();
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [shieldModalVisible, setShieldModalVisible] = useState<boolean>(false);

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
        />
      ) : (
        selectedHabit && (
          <DetailScreen
            habit={selectedHabit}
            onBack={() => {
              setSelectedHabit(null);
              setCurrentScreen('dashboard');
            }}
          />
        )
      )}

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
