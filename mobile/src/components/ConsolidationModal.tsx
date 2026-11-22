import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { THEME } from '../theme/colors';
import { Habit } from '../types/habit';

interface ConsolidationModalProps {
  visible: boolean;
  habit: Habit | null;
  onConfirmPromote: () => void;
  onKeepActive: () => void;
}

export const ConsolidationModal: React.FC<ConsolidationModalProps> = ({
  visible,
  habit,
  onConfirmPromote,
  onKeepActive,
}) => {
  if (!habit) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepActive}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.celebrationEmoji}>🎉 🌿</Text>
          <Text style={styles.badge}>¡Hito de 21 Días Alcanzado!</Text>
          <Text style={styles.title}>Este hábito ya empieza a ser parte de vos</Text>

          <Text style={styles.description}>
            Lograste <Text style={styles.bold}>{habit.currentStreak} días seguidos</Text> con{' '}
            <Text style={styles.bold}>"{habit.name}"</Text>.{'\n\n'}
            Podés consolidarlo en <Text style={styles.bold}>Mantenimiento</Text> para seguir
            tildándolo con calma y abrir espacio para{' '}
            <Text style={styles.bold}>construir tu siguiente hábito activo 🌱</Text>.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={onConfirmPromote}>
            <Text style={styles.primaryBtnText}>Consolidar y sumar nuevo hábito 🌿</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onKeepActive}>
            <Text style={styles.secondaryBtnText}>Seguir solo con este un tiempo más</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 46, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrationEmoji: {
    fontSize: 42,
    marginBottom: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: THEME.colors.dark,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  bold: {
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  primaryBtn: {
    backgroundColor: THEME.colors.sage,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: THEME.radius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: THEME.colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
