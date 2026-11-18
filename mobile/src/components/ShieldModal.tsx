import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { THEME } from '../theme/colors';
import { Habit } from '../types/habit';

interface ShieldModalProps {
  visible: boolean;
  habit: Habit | null;
  onConfirm: () => void;
  onReject: () => void;
  onClose: () => void;
}

export const ShieldModal: React.FC<ShieldModalProps> = ({
  visible,
  habit,
  onConfirm,
  onReject,
  onClose,
}) => {
  if (!habit) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.centerHeader}>
            <Text style={styles.shieldIcon}>🛡️</Text>
            <Text style={styles.title}>A veces la vida se interpone</Text>
            <Text style={styles.subtitle}>
              Ayer no registraste <Text style={styles.boldText}>{habit.name}</Text>.{'\n'}
              ¿Querés activar un escudo para cuidar tu racha de {habit.currentStreak} días?
            </Text>
          </View>

          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Escudos restantes si lo usás:</Text>
            <Text style={styles.statusValue}>
              {Math.max(0, habit.shieldsAvailable - 1)} de 3
            </Text>
          </View>

          <View style={styles.buttonStack}>
            <TouchableOpacity style={styles.primaryButton} onPress={onConfirm}>
              <Text style={styles.primaryButtonText}>Sí, usar escudo 🛡️</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.textButton} onPress={onReject}>
              <Text style={styles.textButtonText}>No, empezar racha de nuevo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Decidir más tarde</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: THEME.colors.white,
    borderTopLeftRadius: THEME.radius.lg,
    borderTopRightRadius: THEME.radius.lg,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: THEME.colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  centerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  shieldIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.muted,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  boldText: {
    fontWeight: '700',
    color: THEME.colors.dark,
  },
  statusBox: {
    backgroundColor: THEME.colors.lightGray,
    padding: 14,
    borderRadius: THEME.radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusLabel: {
    fontSize: 12,
    color: THEME.colors.muted,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.dark,
  },
  buttonStack: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: THEME.colors.dark,
    paddingVertical: 16,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: THEME.colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  textButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: 13,
    color: THEME.colors.muted,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 11,
    color: THEME.colors.muted,
  },
});
