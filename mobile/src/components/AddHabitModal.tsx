import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { THEME, ThemeColors } from '../theme/colors';
import { useAppTheme } from '../theme/useAppTheme';
import { useTranslation } from '../i18n/translations';
import { Habit } from '../types/habit';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAddHabit: (name: string, color: string, anchorText?: string) => Promise<boolean | void> | void;
  availableAnchors: Habit[]; // Hábitos existentes para usar como ancla opcional
  hasActiveHabit?: boolean;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  visible,
  onClose,
  onAddHabit,
  availableAnchors,
  hasActiveHabit = false,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(THEME.palette[0].hex);
  const [anchorText, setAnchorText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [blockedError, setBlockedError] = useState(false);
  const submittingRef = useRef(false);
  const { colors } = useAppTheme();
  const { t, language } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const suggestions = t.onboarding.step2Suggestions;

  useEffect(() => {
    if (visible) {
      setBlockedError(false);
      setIsSaving(false);
      submittingRef.current = false;
    }
  }, [visible]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || submittingRef.current || isSaving) return;
    if (hasActiveHabit) {
      setBlockedError(true);
      return;
    }

    submittingRef.current = true;
    setIsSaving(true);
    setBlockedError(false);

    try {
      const result = await onAddHabit(trimmedName, color, anchorText.trim() || undefined);
      if (result === false) {
        setBlockedError(true);
        return;
      }
      setName('');
      setAnchorText('');
      setColor(THEME.palette[0].hex);
      onClose();
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.badgeText}>{t.modals.addTitle}</Text>
              <Text style={styles.title}>{t.modals.addSub}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.inputLabel}>{t.modals.addTitle}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.modals.addNamePlaceholder}
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              maxLength={60}
            />

            {/* Sugerencias rápidas */}
            <View style={styles.chipsRow}>
              {suggestions.map((sug) => (
                <TouchableOpacity
                  key={sug}
                  style={styles.chip}
                  onPress={() => setName(sug)}
                >
                  <Text style={styles.chipText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color */}
            <Text style={styles.inputLabel}>{t.onboarding.step2ColorLabel}</Text>
            <View style={styles.colorRow}>
              {THEME.palette.map((c) => (
                <TouchableOpacity
                  key={c.hex}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c.hex },
                    color === c.hex && styles.colorCircleSelected,
                  ]}
                  onPress={() => setColor(c.hex)}
                >
                  {color === c.hex && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Ancla de rutina (Habit Stacking) */}
            <Text style={styles.inputLabel}>{t.modals.addAnchorLabel}</Text>

            {/* Si hay hábitos en mantenimiento o graduados, ofrecerlos como sugerencia */}
            {availableAnchors.length > 0 && (
              <View style={styles.anchorChipsRow}>
                {availableAnchors.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={styles.anchorChip}
                    onPress={() =>
                      setAnchorText(
                        language === 'en'
                          ? `After ${h.name.toLowerCase()}`
                          : `Después de ${h.name.toLowerCase()}`
                      )
                    }
                  >
                    <Text style={styles.anchorChipText}>
                      ↳ {language === 'en' ? `After ${h.name}` : `Después de ${h.name}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={t.modals.addAnchorPlaceholder}
              placeholderTextColor={colors.muted}
              value={anchorText}
              onChangeText={setAnchorText}
              maxLength={80}
            />

            {(blockedError || hasActiveHabit) && (
              <View style={styles.blockedBox}>
                <Text style={styles.blockedText}>{t.modals.addBlockedActive}</Text>
              </View>
            )}

            {/* Botón Guardar */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!name.trim() || isSaving || hasActiveHabit) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={!name.trim() || isSaving || hasActiveHabit}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>{t.modals.addBtn}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 46, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: THEME.fonts.medium,
    fontSize: 21,
    color: colors.dark,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: colors.white,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: colors.muted,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputLabel: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: colors.dark,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  helperText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
    lineHeight: 16,
  },
  input: {
    fontFamily: THEME.fonts.regular,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.dark,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: THEME.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.dark,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: colors.dark,
  },
  checkMark: {
    fontFamily: THEME.fonts.semibold,
    color: '#FFF',
    fontSize: 14,
  },
  anchorChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  anchorChip: {
    backgroundColor: colors.sageLight,
    borderWidth: 1,
    borderColor: colors.sage,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
  },
  anchorChipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.dark,
  },
  saveBtn: {
    backgroundColor: colors.coral,
    paddingVertical: 14,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: THEME.fonts.semibold,
    color: '#FFF',
    fontSize: 15,
  },
  blockedBox: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    backgroundColor: colors.coralLight,
    borderWidth: 1,
    borderColor: colors.coral,
  },
  blockedText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: colors.coralDark,
    lineHeight: 17,
  },
});
