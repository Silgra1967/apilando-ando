import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Platform, StyleSheet, View } from 'react-native';
import { THEME } from '../theme/colors';

interface ConfettiBurstProps {
  triggerKey: number;
}

interface ParticleSpec {
  id: number;
  color: string;
  size: number;
  isCircle: boolean;
  startX: number;
  startY: number;
  peakX: number;
  peakY: number;
  endX: number;
  endY: number;
  rotation: number;
  delay: number;
}

const CONFETTI_COLORS = [
  THEME.colors.coral,
  THEME.colors.lima,
  THEME.colors.aqua,
  THEME.colors.aquaDark,
  '#F59E0B',
];

const PARTICLE_COUNT = 28;

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ triggerKey }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  const particles = useMemo<ParticleSpec[]>(() => {
    const { width, height } = Dimensions.get('window');
    const originX = Math.min(width, 430) * 0.5;
    const originY = height * 0.56;

    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (-Math.PI * (0.15 + 0.7 * (i / (PARTICLE_COUNT - 1)))) + (Math.random() - 0.5) * 0.25;
      const speed = 130 + Math.random() * 170;
      const peakX = originX + Math.cos(angle) * speed;
      const peakY = originY + Math.sin(angle) * speed - 40;
      const driftX = (Math.random() - 0.5) * 80;
      const fallY = 180 + Math.random() * 140;

      return {
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 7 + Math.round(Math.random() * 5),
        isCircle: i % 4 === 0,
        startX: originX + (Math.random() - 0.5) * 28,
        startY: originY,
        peakX,
        peakY,
        endX: peakX + driftX,
        endY: peakY + fallY,
        rotation: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 240),
        delay: (i % 5) * 0.02,
      };
    });
  }, [triggerKey]);

  useEffect(() => {
    if (triggerKey <= 0) return;

    setVisible(true);
    progress.setValue(0);

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 1250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });

    anim.start(({ finished }) => {
      if (finished) {
        setVisible(false);
      }
    });

    return () => {
      anim.stop();
    };
  }, [triggerKey, progress]);

  if (triggerKey <= 0 || !visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.stage}>
        {particles.map((p) => {
          const tMid = Math.min(0.45, 0.32 + p.delay);
          const translateX = progress.interpolate({
            inputRange: [0, tMid, 1],
            outputRange: [p.startX, p.peakX, p.endX],
          });
          const translateY = progress.interpolate({
            inputRange: [0, tMid, 1],
            outputRange: [p.startY, p.peakY, p.endY],
          });
          const rotate = progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${p.rotation}deg`],
          });
          const opacity = progress.interpolate({
            inputRange: [0, 0.1, 0.72, 1],
            outputRange: [0, 1, 1, 0],
          });
          const scale = progress.interpolate({
            inputRange: [0, 0.15, 0.85, 1],
            outputRange: [0.4, 1.05, 0.95, 0.6],
          });

          return (
            <Animated.View
              key={`${triggerKey}-${p.id}`}
              style={[
                styles.particle,
                {
                  width: p.size,
                  height: p.isCircle ? p.size : p.size * 1.45,
                  borderRadius: p.isCircle ? p.size / 2 : 2.5,
                  backgroundColor: p.color,
                  opacity,
                  transform: [{ translateX }, { translateY }, { rotate }, { scale }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
    alignItems: 'center',
    overflow: 'hidden',
  },
  stage: {
    width: '100%',
    maxWidth: 430,
    flex: 1,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
