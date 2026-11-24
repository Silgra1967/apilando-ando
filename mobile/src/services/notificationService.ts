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
  try {
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
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Recordatorios de Hábitos',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8FA89B',
        });
      } catch (channelError) {
        // En Expo Go o dispositivos con restricciones de canales, evitar que la app crashee
        console.warn('No se pudo inicializar canal de notificaciones en Android:', channelError);
      }
    }

    return true;
  } catch (error) {
    console.warn('Error solicitando permisos de notificación en este entorno:', error);
    return false;
  }
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Cancela todos los recordatorios diarios programados
 */
export async function cancelDailyReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'daily_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (err) {
    console.warn('Error cancelando recordatorios diarios:', err);
  }
}

/**
 * Programa el recordatorio diario a la hora fijada por el usuario (ej. "20:00")
 * para los próximos 14 días. Si `skipToday` es true (ej. ya tildó el hábito hoy),
 * omite la notificación de hoy para no molestar innecesariamente.
 */
export async function scheduleDailyReminder(
  timeStr: string = '20:00',
  skipToday: boolean = false
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Cancelar recordatorios diarios previos (incluido el de hoy si ya cumplió)
    await cancelDailyReminders();

    const [hoursStr, minutesStr] = timeStr.split(':');
    const parsedHours = parseInt(hoursStr, 10);
    const parsedMinutes = parseInt(minutesStr, 10);
    const hours = Number.isNaN(parsedHours) ? 20 : parsedHours;
    const minutes = Number.isNaN(parsedMinutes) ? 0 : parsedMinutes;

    const now = new Date();
    const DAYS_AHEAD = 14;

    for (let offset = 0; offset < DAYS_AHEAD; offset++) {
      if (offset === 0 && skipToday) continue;

      const targetDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset,
        hours,
        minutes,
        0,
        0
      );

      if (targetDate.getTime() <= now.getTime()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌱 Momento de tu rutina',
          body: '¿Pudiste avanzar con tus hábitos hoy? Tomate un minuto para registrarlo.',
          data: { type: 'daily_reminder', dateStr: toLocalDateStr(targetDate) },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
        },
      });
    }
  } catch (err) {
    console.warn('Error programando recordatorio diario:', err);
  }
}

/**
 * Cancela cualquier alerta de escudo pendiente programada
 */
export async function cancelShieldAlerts(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'shield_alert') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (err) {
    console.warn('Error cancelando alertas de escudo:', err);
  }
}

/**
 * Programa la alerta matutina (09:00) de escudo si el día anterior quedó pendiente
 */
export async function scheduleShieldAlert(habitNames: string | string[]): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await cancelShieldAlerts();

    const names = Array.isArray(habitNames) ? habitNames : [habitNames];
    if (names.length === 0) return;

    const body =
      names.length === 1
        ? `Ayer no registraste "${names[0]}". Podés usar tu escudo para proteger tu racha hoy.`
        : `Ayer quedaron ${names.length} hábitos sin registrar. Podés usar tus escudos hoy antes de las 23:59.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛡️ Tenés escudos disponibles',
        body,
        data: { type: 'shield_alert' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  } catch (err) {
    console.warn('Error programando alerta de escudo:', err);
  }
}

/**
 * Envía una notificación de prueba inmediata (para que el usuario compruebe que funciona)
 */
export async function sendInstantTestNotification(): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Apilando Ando',
        body: '¡Las notificaciones están funcionando perfectamente en tu celular!',
      },
      trigger: null, // Inmediata
    });
  } catch (err) {
    console.warn('Error enviando notificación de prueba:', err);
  }
}
