import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { THEME, ThemeColors } from '../theme/colors';
import { useAppTheme } from '../theme/useAppTheme';
import { useTranslation, formatText } from '../i18n/translations';
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
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!habit) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepActive}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.celebrationEmoji}>🎉 🌿</Text>
          <Text style={styles.badge}>{t.modals.consolidateKicker}</Text>
          <Text style={styles.title}>
            {formatText(t.modals.consolidateTitle, { name: habit.name })}
          </Text>

          <Text style={styles.description}>{t.modals.consolidateText}</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={onConfirmPromote}>
            <Text style={styles.primaryBtnText}>{t.modals.consolidateConfirm}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onKeepActive}>
            <Text style={styles.secondaryBtnText}>{t.modals.consolidateKeep}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 46, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
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
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontFamily: THEME.fonts.medium,
    fontSize: 19,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13,
    color: colors.dark,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  bold: {
    fontFamily: THEME.fonts.semibold,
    color: colors.dark,
  },
  primaryBtn: {
    backgroundColor: colors.coral,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: THEME.radius.full,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    fontFamily: THEME.fonts.semibold,
    color: '#FFF',
    fontSize: 14,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: THEME.fonts.medium,
    color: colors.muted,
    fontSize: 13,
  },
});
