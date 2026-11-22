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
  if (!data) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emojiBurst}>🎉 ✨ 🏆</Text>
          <Text style={styles.badge}>¡NUEVO HITO DE CONSTANCIA!</Text>
          <Text style={styles.streakNumber}>{data.streak} DÍAS</Text>
          <Text style={styles.habitTitle}>{data.habitName}</Text>

          <View style={styles.stickerBox}>
            <Text style={styles.stickerEmoji}>{data.stickerEmoji}</Text>
            <View style={styles.stickerInfo}>
              <Text style={styles.stickerUnlockedTag}>Insignia desbloqueada</Text>
              <Text style={styles.stickerName}>{data.stickerName}</Text>
            </View>
          </View>

          {data.shieldReplenished ? (
            <View style={styles.shieldReplenishBox}>
              <Text style={styles.shieldReplenishIcon}>🛡️</Text>
              <View style={styles.shieldReplenishTextCol}>
                <Text style={styles.shieldReplenishTitle}>+1 Escudo recuperado</Text>
                <Text style={styles.shieldReplenishSub}>
                  Tu esfuerzo te hace más fuerte. Ahora tenés {data.totalShields}/3 escudos disponibles.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.shieldFullBox}>
              <Text style={styles.shieldFullText}>
                🛡️ Mantenés tu protección completa ({data.totalShields}/3 escudos). ¡Imparable!
              </Text>
            </View>
          )}

          <Text style={styles.friendlyQuote}>
            "Cada día que sumás es tuyo para siempre."
          </Text>

          <TouchableOpacity style={styles.continueBtn} onPress={onClose}>
            <Text style={styles.continueBtnText}>¡A seguir construyendo! 🌱</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 46, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: THEME.colors.white,
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
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.colors.dark,
    marginVertical: 2,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.muted,
    marginBottom: 16,
    textAlign: 'center',
  },
  stickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.sandLight,
    borderWidth: 1,
    borderColor: THEME.colors.sand,
    borderRadius: THEME.radius.md,
    padding: 12,
    width: '100%',
    marginBottom: 12,
    gap: 12,
  },
  stickerEmoji: {
    fontSize: 32,
  },
  stickerInfo: {
    flex: 1,
  },
  stickerUnlockedTag: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.muted,
    textTransform: 'uppercase',
  },
  stickerName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginTop: 2,
  },
  shieldReplenishBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.shieldGoldLight,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#7D6608',
  },
  shieldReplenishSub: {
    fontSize: 11,
    color: '#7D6608',
    marginTop: 2,
    lineHeight: 15,
  },
  shieldFullBox: {
    backgroundColor: THEME.colors.lightGray,
    borderRadius: THEME.radius.md,
    padding: 10,
    width: '100%',
    marginBottom: 16,
  },
  shieldFullText: {
    fontSize: 11,
    color: THEME.colors.muted,
    textAlign: 'center',
    fontWeight: '700',
  },
  friendlyQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: THEME.colors.dark,
    textAlign: 'center',
    marginBottom: 18,
  },
  continueBtn: {
    backgroundColor: THEME.colors.sage,
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    width: '100%',
    alignItems: 'center',
  },
  continueBtnText: {
    color: THEME.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
