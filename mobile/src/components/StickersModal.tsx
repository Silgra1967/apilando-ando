import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { THEME } from '../theme/colors';
import { Habit } from '../types/habit';
import { MILESTONE_STICKERS, MilestoneSticker } from '../types/stickers';

interface StickersModalProps {
  visible: boolean;
  onClose: () => void;
  habit?: Habit | null; // Si se abre desde un hábito específico, o global si no viene
  allHabits: Habit[];
}

export const StickersModal: React.FC<StickersModalProps> = ({
  visible,
  onClose,
  habit,
  allHabits,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'streak' | 'special'>('all');
  const [activeStickerDetail, setActiveStickerDetail] = useState<MilestoneSticker | null>(null);

  // Reunir stickers desbloqueados
  // Si viene habit, revisamos los de ese habit. Si no, acumulamos los de todos los hábitos
  const unlockedNames = new Set<string>();
  if (habit) {
    habit.stickersUnlocked.forEach((s) => unlockedNames.add(s));
  } else {
    allHabits.forEach((h) => {
      h.stickersUnlocked.forEach((s) => unlockedNames.add(s));
    });
  }

  const isUnlocked = (st: MilestoneSticker) => {
    // Coincidencia por nombre o emoji en la lista de desbloqueados
    return Array.from(unlockedNames).some(
      (unlocked) =>
        unlocked.includes(st.name) ||
        unlocked.includes(st.emoji) ||
        (st.id === 'first_step' && (unlocked.includes('Primer Paso') || unlocked.includes('Nuevo Comienzo'))) ||
        (st.id === 'streak_7' && unlocked.includes('7 Días')) ||
        (st.id === 'streak_14' && unlocked.includes('14 Días')) ||
        (st.id === 'streak_21' && (unlocked.includes('21 Días') || unlocked.includes('Consolidado'))) ||
        (st.id === 'anchor_graduated' && unlocked.includes('Ancla'))
    );
  };

  const filteredStickers = MILESTONE_STICKERS.filter((s) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'streak') return s.category === 'streak';
    return s.category === 'special' || s.category === 'lifecycle';
  });

  const totalUnlocked = MILESTONE_STICKERS.filter(isUnlocked).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* ENCABEZADO */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badgeText}>ÁLBUM DE CONSTANCIA</Text>
              <Text style={styles.title}>
                {habit ? `Logros de ${habit.name}` : 'Mi Colección de Stickers'}
              </Text>
              <Text style={styles.countText}>
                {totalUnlocked} de {MILESTONE_STICKERS.length} insignias descubiertas ✨
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* FILTROS DE CATEGORÍA */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'all' && styles.filterChipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === 'streak' && styles.filterChipActive]}
              onPress={() => setSelectedCategory('streak')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'streak' && styles.filterChipTextActive,
                ]}
              >
                Por Racha 🔥
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === 'special' && styles.filterChipActive]}
              onPress={() => setSelectedCategory('special')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'special' && styles.filterChipTextActive,
                ]}
              >
                Especiales 🌱
              </Text>
            </TouchableOpacity>
          </View>

          {/* REJILLA DE STICKERS */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
          >
            <View style={styles.stickersGrid}>
              {filteredStickers.map((st) => {
                const unlocked = isUnlocked(st);
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.stickerCard, !unlocked && styles.stickerCardLocked]}
                    onPress={() => setActiveStickerDetail(st)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.emojiCircle,
                        unlocked ? styles.emojiCircleUnlocked : styles.emojiCircleLocked,
                      ]}
                    >
                      <Text style={[styles.stickerEmoji, !unlocked && styles.stickerEmojiLocked]}>
                        {unlocked ? st.emoji : '🔒'}
                      </Text>
                    </View>
                    <Text
                      style={[styles.stickerName, !unlocked && styles.stickerNameLocked]}
                      numberOfLines={1}
                    >
                      {st.name}
                    </Text>
                    <Text style={styles.stickerMeta}>
                      {st.minStreak ? `${st.minStreak} días` : 'Hito especial'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* DETALLE DEL STICKER SELECCIONADO */}
            {activeStickerDetail && (
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailEmoji}>{activeStickerDetail.emoji}</Text>
                  <View style={styles.detailTitleCol}>
                    <Text style={styles.detailTitle}>{activeStickerDetail.name}</Text>
                    <Text style={styles.detailStatus}>
                      {isUnlocked(activeStickerDetail)
                        ? '✨ Desbloqueado y en tu colección'
                        : `🔒 Bloqueado · Requiere ${activeStickerDetail.description}`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.detailLore}>"{activeStickerDetail.lore}"</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 46, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: THEME.colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.dark,
  },
  countText: {
    fontSize: 12,
    color: THEME.colors.muted,
    fontWeight: '600',
    marginTop: 3,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.muted,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: THEME.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.dark,
    borderColor: THEME.colors.dark,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.dark,
  },
  filterChipTextActive: {
    color: THEME.colors.white,
  },
  gridContent: {
    paddingBottom: 24,
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  stickerCard: {
    width: '30.5%',
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stickerCardLocked: {
    backgroundColor: THEME.colors.lightGray,
    borderColor: 'transparent',
    opacity: 0.75,
  },
  emojiCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emojiCircleUnlocked: {
    backgroundColor: THEME.colors.sandLight,
  },
  emojiCircleLocked: {
    backgroundColor: '#E5E0D8',
  },
  stickerEmoji: {
    fontSize: 24,
  },
  stickerEmojiLocked: {
    fontSize: 18,
  },
  stickerName: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.dark,
    textAlign: 'center',
  },
  stickerNameLocked: {
    color: THEME.colors.muted,
    fontWeight: '600',
  },
  stickerMeta: {
    fontSize: 9,
    color: THEME.colors.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  detailCard: {
    marginTop: 20,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  detailEmoji: {
    fontSize: 32,
  },
  detailTitleCol: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  detailStatus: {
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 2,
    fontWeight: '600',
  },
  detailLore: {
    fontSize: 12,
    fontStyle: 'italic',
    color: THEME.colors.dark,
    lineHeight: 18,
  },
});
