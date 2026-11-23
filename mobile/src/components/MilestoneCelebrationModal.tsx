import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { THEME, ThemeColors } from '../theme/colors';
import { useAppTheme } from '../theme/useAppTheme';
import { useTranslation, formatText } from '../i18n/translations';
import { findMilestoneSticker } from '../types/stickers';

export interface MilestoneCelebrationData {
  habitName: string;
  streak: number;
  stickerName: string;
  stickerEmoji: string;
  shieldReplenished: boolean;
  totalShields: number;
}

interface MilestoneCelebrationModalProps {
  visible: boolean;
  data: MilestoneCelebrationData | null;
  onClose: () => void;
}

export const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  visible,
  data,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!data) return null;

  const matchedSticker = findMilestoneSticker(data.stickerName) || findMilestoneSticker(data.stickerEmoji);
  const stickerKey = matchedSticker?.id as keyof typeof t.stickers.items | undefined;
  const localizedStickerName =
    stickerKey && t.stickers.items[stickerKey]
      ? t.stickers.items[stickerKey].name
      : data.stickerName;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emojiBurst}>🎉 ✨ 🏆</Text>
          <Text style={styles.badge}>{t.modals.milestoneBadge}</Text>
          <Text style={styles.streakNumber}>
            {formatText(t.modals.milestoneDays, { count: data.streak })}
          </Text>
          <Text style={styles.habitTitle}>{data.habitName}</Text>

          <View style={styles.stickerBox}>
            {matchedSticker ? (
              <Image source={matchedSticker.image} style={styles.stickerImage} resizeMode="contain" />
            ) : (
              <Text style={styles.stickerEmoji}>{data.stickerEmoji}</Text>
            )}
            <View style={styles.stickerInfo}>
              <Text style={styles.stickerUnlockedTag}>{t.modals.milestoneUnlockedTag}</Text>
              <Text style={styles.stickerName}>{localizedStickerName}</Text>
            </View>
          </View>

          {data.shieldReplenished ? (
            <View style={styles.shieldReplenishBox}>
              <Text style={styles.shieldReplenishIcon}>🛡️</Text>
              <View style={styles.shieldReplenishTextCol}>
                <Text style={styles.shieldReplenishTitle}>{t.modals.milestoneShieldGainTitle}</Text>
                <Text style={styles.shieldReplenishSub}>
                  {formatText(t.modals.milestoneShieldGainSub, { count: data.totalShields })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.shieldFullBox}>
              <Text style={styles.shieldFullText}>
                {formatText(t.modals.milestoneShieldFull, { count: data.totalShields })}
              </Text>
            </View>
          )}

          <Text style={styles.friendlyQuote}>{t.modals.milestoneQuote}</Text>

          <TouchableOpacity style={styles.continueBtn} onPress={onClose}>
            <Text style={styles.continueBtnText}>{t.modals.milestoneContinue}</Text>
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
    backgroundColor: 'rgba(45, 49, 46, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  emojiBurst: {
    fontSize: 32,
    marginBottom: 6,
  },
  badge: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: colors.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  streakNumber: {
    fontFamily: THEME.fonts.medium,
    fontSize: 32,
    color: colors.dark,
    marginVertical: 2,
  },
  habitTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 16,
    color: colors.muted,
    marginBottom: 16,
    textAlign: 'center',
  },
  stickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sandLight,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: THEME.radius.md,
    padding: 12,
    width: '100%',
    marginBottom: 12,
    gap: 12,
  },
  stickerEmoji: {
    fontSize: 32,
  },
  stickerImage: {
    width: 42,
    height: 42,
  },
  stickerInfo: {
    flex: 1,
  },
  stickerUnlockedTag: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  stickerName: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: colors.dark,
    marginTop: 2,
  },
  shieldReplenishBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.shieldGoldLight,
    borderWidth: 1,
    borderColor: '#F9E79F',
    borderRadius: THEME.radius.md,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    gap: 10,
  },
  shieldReplenishIcon: {
    fontSize: 24,
  },
  shieldReplenishTextCol: {
    flex: 1,
  },
  shieldReplenishTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 13,
    color: '#7D6608',
  },
  shieldReplenishSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: '#7D6608',
    marginTop: 2,
    lineHeight: 15,
  },
  shieldFullBox: {
    backgroundColor: colors.lightGray,
    borderRadius: THEME.radius.md,
    padding: 10,
    width: '100%',
    marginBottom: 16,
  },
  shieldFullText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  friendlyQuote: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 18,
  },
  continueBtn: {
    backgroundColor: colors.coral,
    paddingVertical: 14,
    borderRadius: THEME.radius.full,
    width: '100%',
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: THEME.fonts.semibold,
    color: colors.white,
    fontSize: 14,
  },
});
