import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { THEME, ThemeColors } from '../theme/colors';
import { useAppTheme } from '../theme/useAppTheme';
import { useTranslation, formatText } from '../i18n/translations';
import { Habit } from '../types/habit';
import { MILESTONE_STICKERS, MilestoneSticker } from '../types/stickers';

interface StickersContentProps {
  habit?: Habit | null;
  allHabits: Habit[];
  embedded?: boolean;
  onClose?: () => void;
}

interface StickersModalProps extends StickersContentProps {
  visible: boolean;
  onClose: () => void;
}

export const StickersContent: React.FC<StickersContentProps> = ({
  habit,
  allHabits,
  embedded = false,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'streak' | 'special'>('all');
  const [activeStickerDetail, setActiveStickerDetail] = useState<MilestoneSticker | null>(null);
  const { colors, shadows } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const unlockedNames = new Set<string>();
  if (habit) {
    habit.stickersUnlocked.forEach((s) => unlockedNames.add(s));
  } else {
    allHabits.forEach((h) => {
      h.stickersUnlocked.forEach((s) => unlockedNames.add(s));
    });
  }

  const isUnlocked = (st: MilestoneSticker) => {
    return Array.from(unlockedNames).some(
      (unlocked) =>
        unlocked.includes(st.name) ||
        unlocked.includes(st.emoji) ||
        (st.id === 'first_step' && unlocked.includes('Primer Paso')) ||
        (st.id === 'streak_7' && unlocked.includes('7 Días')) ||
        (st.id === 'streak_14' && unlocked.includes('14 Días')) ||
        (st.id === 'streak_21' && (unlocked.includes('21 Días') || unlocked.includes('Consolidado'))) ||
        (st.id === 'anchor_graduated' && unlocked.includes('Ancla'))
    );
  };

  const getStickerCopy = (st: MilestoneSticker) => {
    const key = st.id as keyof typeof t.stickers.items;
    return t.stickers.items[key] || { name: st.name, description: st.description, lore: st.lore };
  };

  const filteredStickers = MILESTONE_STICKERS.filter((s) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'streak') return s.category === 'streak';
    return s.category === 'special' || s.category === 'lifecycle';
  });

  const totalUnlocked = MILESTONE_STICKERS.filter(isUnlocked).length;

  return (
    <View style={embedded ? styles.embeddedContainer : undefined}>
      {/* ENCABEZADO */}
      <View style={styles.header}>
        <View>
          <Text style={styles.badgeText}>{t.stickers.kicker}</Text>
          <Text style={styles.title}>
            {habit ? formatText(t.stickers.habitTitle, { name: habit.name }) : t.stickers.mainTitle}
          </Text>
          <Text style={styles.countText}>
            {formatText(t.stickers.countText, {
              unlocked: totalUnlocked,
              total: MILESTONE_STICKERS.length,
            })}
          </Text>
        </View>
        {!embedded && onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
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
            {t.stickers.filterAll}
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
            {t.stickers.filterStreak}
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
            {t.stickers.filterSpecial}
          </Text>
        </TouchableOpacity>
      </View>

      {/* REJILLA DE STICKERS */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
        <View style={styles.stickersGrid}>
          {filteredStickers.map((st) => {
            const unlocked = isUnlocked(st);
            const copy = getStickerCopy(st);
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
                  {unlocked ? (
                    <Image source={st.image} style={styles.stickerImage} resizeMode="contain" />
                  ) : (
                    <Text style={[styles.stickerEmoji, styles.stickerEmojiLocked]}>🔒</Text>
                  )}
                </View>
                <Text
                  style={[styles.stickerName, !unlocked && styles.stickerNameLocked]}
                  numberOfLines={1}
                >
                  {copy.name}
                </Text>
                <Text style={styles.stickerMeta}>
                  {st.minStreak
                    ? formatText(t.stickers.daysLabel, { count: st.minStreak })
                    : t.stickers.specialMilestone}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DETALLE DEL STICKER SELECCIONADO */}
        {activeStickerDetail && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              {isUnlocked(activeStickerDetail) ? (
                <Image
                  source={activeStickerDetail.image}
                  style={styles.detailImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.detailEmoji}>🔒</Text>
              )}
              <View style={styles.detailTitleCol}>
                <Text style={styles.detailTitle}>{getStickerCopy(activeStickerDetail).name}</Text>
                <Text style={styles.detailStatus}>
                  {isUnlocked(activeStickerDetail)
                    ? t.stickers.unlockedStatus
                    : formatText(t.stickers.lockedStatus, {
                        desc: getStickerCopy(activeStickerDetail).description,
                      })}
                </Text>
              </View>
            </View>
            <Text style={styles.detailLore}>"{getStickerCopy(activeStickerDetail).lore}"</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export const StickersModal: React.FC<StickersModalProps> = ({
  visible,
  onClose,
  habit,
  allHabits,
}) => {
  const { colors, shadows } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <StickersContent habit={habit} allHabits={allHabits} onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ReturnType<typeof useAppTheme>['shadows']) =>
  StyleSheet.create({
    embeddedContainer: {
      flex: 1,
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      backgroundColor: colors.cream,
      paddingTop: THEME.spacing.md,
      paddingHorizontal: THEME.spacing.md,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(18, 30, 28, 0.5)',
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
      maxHeight: '92%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    badgeText: {
      fontFamily: THEME.fonts.semibold,
      fontSize: 11,
      color: colors.terracotta,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    title: {
      fontFamily: THEME.fonts.medium,
      fontSize: 21,
      color: colors.dark,
    },
    countText: {
      fontFamily: THEME.fonts.regular,
      fontSize: 12,
      color: colors.muted,
      marginTop: 6,
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
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    filterChip: {
      backgroundColor: colors.white,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: THEME.radius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.dark,
      borderColor: colors.dark,
    },
    filterChipText: {
      fontFamily: THEME.fonts.medium,
      fontSize: 11,
      color: colors.dark,
    },
    filterChipTextActive: {
      color: colors.cream,
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
      backgroundColor: colors.white,
      borderRadius: THEME.radius.md,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    stickerCardLocked: {
      backgroundColor: colors.lightGray,
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
      backgroundColor: colors.sandLight,
    },
    emojiCircleLocked: {
      backgroundColor: colors.surfaceContainer,
    },
    stickerEmoji: {
      fontSize: 24,
    },
    stickerImage: {
      width: 34,
      height: 34,
    },
    stickerEmojiLocked: {
      fontSize: 18,
    },
    stickerName: {
      fontFamily: THEME.fonts.medium,
      fontSize: 11,
      color: colors.dark,
      textAlign: 'center',
    },
    stickerNameLocked: {
      fontFamily: THEME.fonts.regular,
      color: colors.muted,
    },
    stickerMeta: {
      fontFamily: THEME.fonts.regular,
      fontSize: 9,
      color: colors.muted,
      marginTop: 2,
    },
    detailCard: {
      marginTop: 20,
      backgroundColor: colors.white,
      borderRadius: THEME.radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
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
    detailImage: {
      width: 40,
      height: 40,
    },
    detailTitleCol: {
      flex: 1,
    },
    detailTitle: {
      fontFamily: THEME.fonts.medium,
      fontSize: 15,
      color: colors.dark,
    },
    detailStatus: {
      fontFamily: THEME.fonts.regular,
      fontSize: 11,
      color: colors.sage,
      marginTop: 2,
    },
    detailLore: {
      fontFamily: THEME.fonts.regular,
      fontSize: 12,
      fontStyle: 'italic',
      color: colors.muted,
      lineHeight: 18,
    },
  });
