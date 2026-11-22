import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Servicio de feedback háptico sutil y amable.
 * Protegido con try/catch para plataformas o entornos que no lo soporten.
 */
export async function triggerLightHaptic(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silencioso si no está disponible
  }
}

export async function triggerSuccessHaptic(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silencioso
  }
}

export async function triggerSelectionHaptic(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    await Haptics.selectionAsync();
  } catch {
    // Silencioso
  }
}
