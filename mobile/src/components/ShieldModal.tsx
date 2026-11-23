import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Shield, ArrowRight, Award, Check } from 'lucide-react-native';
import { THEME } from '../theme/colors';
import { Habit } from '../types/habit';

interface ShieldModalProps {
  visible: boolean;
  habits: Habit[];
  onConfirmSingle: (habit: Habit) => void;
  onRejectSingle: (habit: Habit) => void;
  onConfirmGrouped: (protectedIds: string[], resetIds: string[]) => void;
  onClose: () => void;
}

export const ShieldModal: React.FC<ShieldModalProps> = ({
  visible,
  habits,
  onConfirmSingle,
  onRejectSingle,
  onConfirmGrouped,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setSelectedIds(habits.map((h) => h.id));
    }
  }, [visible, habits]);

  if (!habits || habits.length === 0) return null;

  const isGrouped = habits.length > 1;
  const singleHabit = habits[0];
  const remainingAfterUse = Math.max(0, singleHabit.shieldsAvailable - 1);
  const daysTo21 = Math.max(0, 21 - singleHabit.currentStreak);

  const toggleHabit = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmGrouped = () => {
    const protectedIds = habits.filter((h) => selectedIds.includes(h.id)).map((h) => h.id);
    const resetIds = habits.filter((h) => !selectedIds.includes(h.id)).map((h) => h.id);
    onConfirmGrouped(protectedIds, resetIds);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          {/* Hero Circular con Aura */}
          <View style={styles.heroWrap}>
            <View style={styles.heroOuterAura}>
              <View style={styles.heroInnerCircle}>
                <Shield size={34} color={THEME.colors.coral} />
              </View>
              <View style={styles.floatingBadge}>
                <Text style={styles.floatingBadgeEmoji}>🛡️</Text>
              </View>
            </View>
          </View>

          {!isGrouped ? (
            <>
              <View style={styles.centerHeader}>
                <View style={styles.empathyPill}>
                  <Text style={styles.empathyPillText}>🌿 Pausa Comprensiva</Text>
                </View>
                <Text style={styles.title}>¿Querés usar un escudo para ayer?</Text>
                <Text style={styles.subtitle}>
                  A veces la vida se interpone y está bien. Ayer no registraste{' '}
                  <Text style={styles.boldText}>{singleHabit.name}</Text>. Tu racha de{' '}
                  <Text style={styles.boldText}>{singleHabit.currentStreak} días</Text> sigue viva si
                  querés cuidarla hoy.
                </Text>
              </View>

              <View style={styles.statusBox}>
                <View style={styles.statusTopRow}>
                  <Text style={styles.statusLabel}>Tus escudos de gracia</Text>
                  <View style={styles.shieldsCompareRow}>
                    <Text style={styles.shieldEmojis}>
                      {'🛡️'.repeat(Math.max(0, singleHabit.shieldsAvailable))}
                    </Text>
                    <ArrowRight size={14} color={THEME.colors.outline} />
                    <Text style={styles.shieldEmojis}>
                      {'🛡️'.repeat(remainingAfterUse)}
                      {'⚪'.repeat(Math.max(0, 3 - remainingAfterUse))}
                    </Text>
                  </View>
                </View>
                <Text style={styles.statusSub}>
                  Te quedarían <Text style={styles.boldText}>{remainingAfterUse} de 3</Text>{' '}
                  disponibles. Podés recuperar otro al alcanzar un nuevo hito.
                </Text>
              </View>

              <View style={styles.buttonStack}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => onConfirmSingle(singleHabit)}
                >
                  <Text style={styles.primaryButtonText}>
                    Sí, proteger mi racha con 1 escudo 🛡️
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => onRejectSingle(singleHabit)}
                >
                  <Text style={styles.secondaryButtonText}>
                    No, empezar racha de nuevo con calma
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Decidir más tarde</Text>
                </TouchableOpacity>
              </View>

              {singleHabit.status === 'active' && daysTo21 > 0 && (
                <View style={styles.milestonePreviewBox}>
                  <View style={styles.milestoneIconBox}>
                    <Award size={20} color={THEME.colors.aquaDark} />
                  </View>
                  <View style={styles.milestoneTextCol}>
                    <Text style={styles.milestoneTag}>HITO DE 21 DÍAS 🌿</Text>
                    <Text style={styles.milestoneCopy}>
                      Estás a solo <Text style={styles.boldText}>{daysTo21} días</Text> de pasar este
                      hábito a Mantenimiento y habilitar uno nuevo.
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.centerHeader}>
                <View style={styles.empathyPill}>
                  <Text style={styles.empathyPillText}>🌿 Resumen de Ayer</Text>
                </View>
                <Text style={styles.title}>
                  Ayer quedaron {habits.length} hábitos sin marcar
                </Text>
                <Text style={styles.subtitle}>
                  Elegí cuáles querés proteger hoy con su escudo. Los que queden sin tildar
                  reiniciarán su racha con calma.
                </Text>
              </View>

              <ScrollView
                style={styles.groupedScroll}
                contentContainerStyle={styles.groupedList}
                showsVerticalScrollIndicator={false}
              >
                {habits.map((h) => {
                  const checked = selectedIds.includes(h.id);
                  return (
                    <TouchableOpacity
                      key={h.id}
                      style={[styles.groupedRow, checked && styles.groupedRowChecked]}
                      activeOpacity={0.85}
                      onPress={() => toggleHabit(h.id)}
                    >
                      <View style={[styles.groupedCheck, checked && styles.groupedCheckActive]}>
                        {checked && (
                          <Check size={15} color={THEME.colors.white} strokeWidth={2.8} />
                        )}
                      </View>
                      <View style={styles.groupedInfo}>
                        <Text style={styles.groupedName} numberOfLines={1}>
                          {h.name}
                        </Text>
                        <Text style={styles.groupedMeta}>
                          {h.status === 'active' ? '🌱 En construcción' : '🌿 Mantenimiento'} ·{' '}
                          {h.currentStreak}d racha · {h.shieldsAvailable}/3 🛡️
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.buttonStack}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmGrouped}>
                  <Text style={styles.primaryButtonText}>
                    {selectedIds.length > 0
                      ? `Confirmar protección (${selectedIds.length})`
                      : 'Reiniciar rachas pendientes'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Decidir más tarde</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 30, 28, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: THEME.colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: THEME.colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  heroOuterAura: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: THEME.colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: THEME.colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.lima,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.white,
  },
  floatingBadgeEmoji: {
    fontSize: 14,
  },
  centerHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  empathyPill: {
    backgroundColor: THEME.colors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
    marginBottom: 8,
  },
  empathyPillText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.aquaDark,
  },
  title: {
    fontFamily: THEME.fonts.medium,
    fontSize: 20,
    color: THEME.colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13,
    color: THEME.colors.muted,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  boldText: {
    fontFamily: THEME.fonts.semibold,
    color: THEME.colors.dark,
  },
  statusBox: {
    backgroundColor: THEME.colors.surfaceLow,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
    gap: 6,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.muted,
  },
  shieldsCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shieldEmojis: {
    fontSize: 14,
  },
  statusSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.outline,
    lineHeight: 16,
  },
  groupedScroll: {
    maxHeight: 210,
    marginBottom: 14,
  },
  groupedList: {
    gap: 8,
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.colors.surfaceLow,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 12,
  },
  groupedRowChecked: {
    backgroundColor: THEME.colors.coralLight,
    borderColor: '#F5C4BC',
  },
  groupedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.outline,
    backgroundColor: THEME.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupedCheckActive: {
    backgroundColor: THEME.colors.coral,
    borderColor: THEME.colors.coral,
  },
  groupedInfo: {
    flex: 1,
  },
  groupedName: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.dark,
  },
  groupedMeta: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  buttonStack: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: THEME.colors.coral,
    paddingVertical: 15,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: THEME.fonts.semibold,
    color: THEME.colors.white,
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: THEME.colors.surfaceContainer,
    paddingVertical: 13,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: THEME.colors.coralDark,
  },
  closeButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.outline,
  },
  milestonePreviewBox: {
    marginTop: 14,
    backgroundColor: THEME.colors.surfaceLow,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  milestoneIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: THEME.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneTextCol: {
    flex: 1,
  },
  milestoneTag: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: THEME.colors.coral,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  milestoneCopy: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.dark,
    lineHeight: 17,
  },
});
