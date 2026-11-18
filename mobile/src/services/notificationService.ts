import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuración de cómo se comporta la notificación si la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Solicita permisos de notificación al sistema operativo (Android/iOS)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Recordatorios de Hábitos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8FA89B',
    });
  }

  return true;
}

/**
 * Programa el recordatorio diario a la hora fijada por el usuario (ej. "20:00")
 */
export async function scheduleDailyReminder(timeStr: string = '20:00'): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Cancelar recordatorios diarios previos para no duplicar
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'daily_reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10) || 20;
  const minutes = parseInt(minutesStr, 10) || 0;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌱 Momento de tu rutina',
      body: '¿Pudiste avanzar con tus hábitos hoy? Tomate un minuto para registrarlo.',
      data: { type: 'daily_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

/**
 * Programa la alerta matutina de escudo si el día anterior quedó pendiente
 */
export async function scheduleShieldAlert(habitName: string): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Cancelar alertas de escudo previas
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'shield_alert') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  // Notificar a las 9:00 AM del día actual
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🛡️ Tenés un escudo disponible',
      body: `Ayer no registraste "${habitName}". Podés usar tu escudo para proteger tu racha hoy.`,
      data: { type: 'shield_alert' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

/**
 * Envía una notificación de prueba inmediata (para que el usuario compruebe que funciona)
 */
export async function sendInstantTestNotification(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌱 Apliando Ando',
      body: '¡Las notificaciones están funcionando perfectamente en tu celular!',
    },
    trigger: null, // Inmediata
  });
}
