import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { THEME } from '../theme/colors';
import { Habit } from '../types/habit';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAddHabit: (name: string, color: string, anchorText?: string) => void;
  availableAnchors: Habit[]; // Hábitos existentes para usar como ancla opcional
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  visible,
  onClose,
  onAddHabit,
  availableAnchors,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(THEME.palette[0].hex);
  const [anchorText, setAnchorText] = useState('');

  const suggestions = [
    'Leer 10 minutos',
    'Caminar 15 minutos',
    'Tomar 2L de agua',
    'Meditar 5 minutos',
    'Escribir 3 gratitudes',
    'Estirar la espalda',
  ];

  const handleSave = () => {
    if (!name.trim()) return;
    onAddHabit(name.trim(), color, anchorText.trim() || undefined);
    setName('');
    setAnchorText('');
    setColor(THEME.palette[0].hex);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.badgeText}>🌱 NUEVO HÁBITO EN FOCO</Text>
              <Text style={styles.title}>¿Qué vas a construir ahora?</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.inputLabel}>Nombre del hábito</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Meditar 5 minutos..."
              placeholderTextColor={THEME.colors.muted}
              value={name}
              onChangeText={setName}
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
            <Text style={styles.inputLabel}>Color suave</Text>
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
            <Text style={styles.inputLabel}>Vincular a un ancla (opcional)</Text>
            <Text style={styles.helperText}>
              ¿Después de qué acción o rutina que ya hacés vas a realizar este hábito?
            </Text>

            {/* Si hay hábitos en mantenimiento o graduados, ofrecerlos como sugerencia */}
            {availableAnchors.length > 0 && (
              <View style={styles.anchorChipsRow}>
                {availableAnchors.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={styles.anchorChip}
                    onPress={() => setAnchorText(`Después de ${h.name.toLowerCase()}`)}
                  >
                    <Text style={styles.anchorChipText}>↳ Después de {h.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Ej. Después del café mañanero, al cepillarme los dientes..."
              placeholderTextColor={THEME.colors.muted}
              value={anchorText}
              onChangeText={setAnchorText}
            />

            {/* Botón Guardar */}
            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Text style={styles.saveBtnText}>Comenzar este hábito 🌱</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 46, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: THEME.colors.cream,
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
    color: THEME.colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: THEME.fonts.medium,
    fontSize: 21,
    color: THEME.colors.dark,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  closeBtnText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.muted,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputLabel: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.dark,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  helperText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.muted,
    marginBottom: 8,
    lineHeight: 16,
  },
  input: {
    fontFamily: THEME.fonts.regular,
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.colors.dark,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.dark,
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
    borderColor: THEME.colors.dark,
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
    backgroundColor: THEME.colors.sageLight,
    borderWidth: 1,
    borderColor: THEME.colors.sage,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
  },
  anchorChipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.dark,
  },
  saveBtn: {
    backgroundColor: THEME.colors.coral,
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
});
