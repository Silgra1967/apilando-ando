import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Trophy,
  Shield,
  Settings,
  Coffee,
  Anchor,
  Trees,
  Sprout,
  Check,
  Flame,
  Sparkles,
  CornerDownRight,
  ChevronRight,
  Leaf,
} from 'lucide-react-native';
import { THEME } from '../theme/colors';
import { useHabitStore } from '../store/habitStore';
import { Habit, isEligibleForAnchorGraduation } from '../types/habit';
import { triggerSuccessHaptic, triggerLightHaptic } from '../services/hapticService';
import { MilestoneCelebrationData } from '../components/MilestoneCelebrationModal';

interface DashboardScreenProps {
  onOpenDetail: (habit: Habit) => void;
  onSimulateShield: () => void;
  onOpenAddHabit: () => void;
  onPromoteHabit: (habit: Habit) => void;
  onOpenStickers: () => void;
  onOpenSettings: () => void;
  onOpenMonthlyReview: () => void;
  onMilestoneReached?: (celebration: MilestoneCelebrationData) => void;
  pendingShieldCount?: number;
  onOpenPendingShields?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenDetail,
  onSimulateShield,
  onOpenAddHabit,
  onPromoteHabit,
  onOpenStickers,
  onOpenSettings,
  onOpenMonthlyReview,
  onMilestoneReached,
  pendingShieldCount = 0,
  onOpenPendingShields,
}) => {
  const { habits, logs, toggleDayCompletion } = useHabitStore();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const formattedDate = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const activeHabit = habits.find((h) => h.status === 'active');
  const maintenanceHabits = habits.filter((h) => h.status === 'maintenance');
  const anchorHabits = habits.filter((h) => h.status === 'anchor');
  const longPausedHabit = habits.find((h) => {
    if (h.status !== 'paused' || !h.pausedAt) return false;
    const diffDays = Math.floor((Date.now() - new Date(h.pausedAt).getTime()) / 86400000);
    return diffDays >= 14;
  });
  const longPausedDays = longPausedHabit?.pausedAt
    ? Math.floor((Date.now() - new Date(longPausedHabit.pausedAt).getTime()) / 86400000)
    : 0;

  const isCompletedToday = (habitId: string) => {
    return logs[`${habitId}_${todayStr}`]?.status === 'completed';
  };

  const totalCheckable = (activeHabit ? 1 : 0) + maintenanceHabits.length;
  const totalDone =
    (activeHabit && isCompletedToday(activeHabit.id) ? 1 : 0) +
    maintenanceHabits.filter((m) => isCompletedToday(m.id)).length;
  const completionPct = totalCheckable > 0 ? Math.round((totalDone / totalCheckable) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mobileFrame}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* HEADER: LOGO + NOMBRE DE LA APP Y ACCESOS EN UNA FILA LIMPIA */}
          <View style={styles.headerBlock}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerBrandRow}>
                <View style={styles.brandLogoWrap}>
                  <Image
                    source={require('../../assets/icon.png')}
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.appBrandTextCol}>
                  <Text style={styles.appBrandTop}>Apilando</Text>
                  <Text style={styles.appBrandBottom}>Ando</Text>
                </View>
              </View>

              <View style={styles.topActions}>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={onOpenMonthlyReview}>
                  <Calendar size={17} color={THEME.colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={onOpenStickers}>
                  <Trophy size={17} color={THEME.colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={onSimulateShield}>
                  <Shield size={17} color={THEME.colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={onOpenSettings}>
                  <Settings size={17} color={THEME.colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{capitalizedDate}</Text>
              <View style={styles.progressPill}>
                <Leaf size={12} color={THEME.colors.limaDark} />
                <Text style={styles.progressPillText}>
                  {totalDone} de {totalCheckable} hoy ({completionPct}%)
                </Text>
              </View>
            </View>

            <View style={styles.greetingRow}>
              <Text style={styles.greetingTitle}>Tu rutina de hoy</Text>
              <View style={styles.ringBadge}>
                <Text style={styles.ringBadgeText}>
                  {totalDone}/{totalCheckable}
                </Text>
              </View>
            </View>
          </View>

          {/* BANNER SUTIL DE ESCUDOS PENDIENTES (SI SE POSPUSO "DECIDIR MÁS TARDE") */}
          {pendingShieldCount > 0 && (
            <TouchableOpacity
              style={styles.pendingShieldBanner}
              activeOpacity={0.85}
              onPress={onOpenPendingShields}
            >
              <View style={styles.pendingShieldIcon}>
                <Shield size={16} color={THEME.colors.coral} />
              </View>
              <View style={styles.pendingShieldTextCol}>
                <Text style={styles.pendingShieldTitle}>
                  {pendingShieldCount === 1
                    ? 'Tenés 1 hábito de ayer pendiente de escudo'
                    : `Tenés ${pendingShieldCount} hábitos de ayer pendientes de escudo`}
                </Text>
                <Text style={styles.pendingShieldSub}>
                  Tocá para decidir antes de las 23:59
                </Text>
              </View>
              <ChevronRight size={16} color={THEME.colors.coralDark} />
            </TouchableOpacity>
          )}

          {/* AVISO AMABLE DE PAUSA PROLONGADA (>= 14 DÍAS) */}
          {longPausedHabit && (
            <TouchableOpacity
              style={styles.longPausedBanner}
              activeOpacity={0.85}
              onPress={() => onOpenDetail(longPausedHabit)}
            >
              <View style={styles.longPausedIcon}>
                <Text style={styles.longPausedEmoji}>⏸️</Text>
              </View>
              <View style={styles.pendingShieldTextCol}>
                <Text style={styles.longPausedTitle}>
                  "{longPausedHabit.name}" lleva {longPausedDays} días en pausa
                </Text>
                <Text style={styles.pendingShieldSub}>
                  Cuando sientas que es momento, podés reanudarlo o archivarlo con paz.
                </Text>
              </View>
              <ChevronRight size={16} color={THEME.colors.aquaDark} />
            </TouchableOpacity>
          )}

          {/* CONTENEDOR HABIT STACKING CON RIEL VERTICAL */}
          <View style={styles.stackContainer}>
            <View style={styles.verticalRail} />

            {/* 1. ANCLA INICIAL */}
            {activeHabit?.anchorText && (
              <View style={styles.stackRow}>
                <View style={styles.nodeAnchor}>
                  <Coffee size={18} color={THEME.colors.aquaDark} />
                </View>
                <View style={styles.anchorCard}>
                  <View style={styles.anchorHeader}>
                    <Anchor size={12} color={THEME.colors.aquaDark} />
                    <Text style={styles.anchorTagText}>HÁBITO ANCLA</Text>
                  </View>
                  <Text style={styles.anchorTitle}>{activeHabit.anchorText}</Text>
                  <Text style={styles.anchorSub}>Disparador cotidiano establecido</Text>
                </View>
              </View>
            )}

            {/* 2. HÁBITOS GRADUADOS (6 MESES) */}
            {anchorHabits.map((a) => (
              <View key={a.id} style={styles.stackRow}>
                <View style={styles.nodeGraduated}>
                  <Trees size={17} color={THEME.colors.aquaDark} />
                </View>
                <TouchableOpacity
                  style={styles.graduatedCard}
                  activeOpacity={0.85}
                  onPress={() => onOpenDetail(a)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.graduatedPill}>
                      <Text style={styles.graduatedPillText}>🌳 Graduado</Text>
                    </View>
                    <Text style={styles.integratedText}>✦ Integrado</Text>
                  </View>
                  <Text style={styles.habitTitle}>{a.name}</Text>
                  <View style={styles.metaInline}>
                    <Sparkles size={13} color={THEME.colors.aquaDark} />
                    <Text style={styles.graduatedStreak}>
                      {a.currentStreak} días de racha consolidada
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}

            {/* 3. HÁBITOS EN MANTENIMIENTO */}
            {maintenanceHabits.map((m) => {
              const done = isCompletedToday(m.id);
              const readyForAnchor = isEligibleForAnchorGraduation(m, now);
              return (
                <View key={m.id} style={styles.stackRow}>
                  <View style={styles.nodeMaintenance}>
                    <Leaf size={17} color={THEME.colors.aquaDark} />
                  </View>
                  <View style={styles.maintenanceCard}>
                    <TouchableOpacity
                      style={styles.maintenanceInfo}
                      activeOpacity={0.8}
                      onPress={() => onOpenDetail(m)}
                    >
                      <View style={styles.maintenancePillRow}>
                        <View style={styles.maintenancePill}>
                          <Text style={styles.maintenancePillText}>🌿 Mantenimiento</Text>
                        </View>
                        {readyForAnchor && (
                          <View style={styles.anchorReadyPill}>
                            <Text style={styles.anchorReadyPillText}>🌳 ¡6m! Graduar</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.habitTitle} numberOfLines={2}>
                        {m.name}
                      </Text>
                      <View style={styles.metaInline}>
                        <Flame size={13} color={THEME.colors.coral} />
                        <Text style={styles.streakFlame}>{m.currentStreak} días continuos</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.checkboxCircle, done && styles.checkboxCircleDone]}
                      onPress={() => {
                        triggerLightHaptic();
                        toggleDayCompletion(m.id, todayStr);
                      }}
                    >
                      {done && <Check size={19} color={THEME.colors.white} strokeWidth={2.8} />}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* 4. TARJETA PROTAGÓNICA: HÁBITO ACTIVO */}
            {activeHabit && (
              <View style={styles.stackRow}>
                <View style={styles.nodeActive}>
                  <Sprout size={19} color={THEME.colors.limaDark} />
                </View>

                <View style={styles.activeCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>🌱 En construcción</Text>
                    </View>
                    <View style={styles.shieldsPill}>
                      {[0, 1, 2].map((idx) => (
                        <Shield
                          key={idx}
                          size={13}
                          color={
                            idx < activeHabit.shieldsAvailable
                              ? THEME.colors.coral
                              : THEME.colors.outline
                          }
                          fill={
                            idx < activeHabit.shieldsAvailable ? THEME.colors.coral : 'transparent'
                          }
                        />
                      ))}
                      <Text style={styles.shieldsCount}>{activeHabit.shieldsAvailable}/3</Text>
                    </View>
                  </View>

                  <TouchableOpacity activeOpacity={0.8} onPress={() => onOpenDetail(activeHabit)}>
                    {activeHabit.anchorText && (
                      <View style={styles.anchorLinkRow}>
                        <CornerDownRight size={13} color={THEME.colors.coral} />
                        <Text style={styles.activeAnchorText} numberOfLines={1}>
                          Anclado a: {activeHabit.anchorText}
                        </Text>
                      </View>
                    )}
                    <View style={styles.titleRow}>
                      <Text style={styles.activeHabitTitle}>{activeHabit.name}</Text>
                      <View style={styles.seeDetailPill}>
                        <Text style={styles.seeDetailText}>Detalle</Text>
                        <ChevronRight size={14} color={THEME.colors.aquaDark} />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Barra hacia los 21 días */}
                  <View style={styles.targetProgressBox}>
                    <View style={styles.progressRowText}>
                      <Text style={styles.progressSub}>
                        {activeHabit.currentStreak >= 21
                          ? '🎉 ¡21 días completados!'
                          : `Día ${activeHabit.currentStreak} de 21 para consolidar`}
                      </Text>
                      <Text style={styles.progressPercent}>
                        {Math.min(100, Math.round((activeHabit.currentStreak / 21) * 100))}%
                      </Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(
                              100,
                              Math.round((activeHabit.currentStreak / 21) * 100)
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Invitación a consolidar si ya llegó a 21 días */}
                  {activeHabit.currentStreak >= 21 && (
                    <TouchableOpacity
                      style={styles.readyConsolidateBanner}
                      onPress={() => onPromoteHabit(activeHabit)}
                    >
                      <Text style={styles.readyConsolidateTitle}>🌿 Listo para consolidar</Text>
                      <Text style={styles.readyConsolidateSub}>
                        Tocá acá para pasar a Mantenimiento y habilitar tu próximo hábito.
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Botón principal de tildado */}
                  <TouchableOpacity
                    style={[
                      styles.bigCheckButton,
                      isCompletedToday(activeHabit.id) && styles.bigCheckButtonDone,
                    ]}
                    activeOpacity={0.9}
                    onPress={async () => {
                      if (!isCompletedToday(activeHabit.id)) {
                        triggerSuccessHaptic();
                      } else {
                        triggerLightHaptic();
                      }
                      const celebration = await toggleDayCompletion(activeHabit.id, todayStr);
                      if (celebration && onMilestoneReached) {
                        onMilestoneReached(celebration);
                      }
                    }}
                  >
                    <Check
                      size={18}
                      color={
                        isCompletedToday(activeHabit.id)
                          ? THEME.colors.limaDark
                          : THEME.colors.white
                      }
                      strokeWidth={2.6}
                    />
                    <Text
                      style={[
                        styles.bigCheckButtonText,
                        isCompletedToday(activeHabit.id) && styles.bigCheckButtonTextDone,
                      ]}
                    >
                      {isCompletedToday(activeHabit.id)
                        ? '¡Completado con calma!'
                        : 'Marcar como hecho hoy'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.gentleFooterHint}>
                    Sumás 1 día a tu ritmo sin presiones
                  </Text>
                </View>
              </View>
            )}

            {/* 5. SI NO HAY HÁBITO ACTIVO */}
            {!activeHabit && (
              <View style={styles.stackRow}>
                <View style={styles.nodeActive}>
                  <Sprout size={19} color={THEME.colors.limaDark} />
                </View>
                <TouchableOpacity style={styles.addHabitCard} onPress={onOpenAddHabit}>
                  <Text style={styles.addHabitIcon}>🌱</Text>
                  <Text style={styles.addHabitTitle}>Elegir nuevo hábito en foco</Text>
                  <Text style={styles.addHabitSub}>
                    Tus hábitos anteriores ya están en marcha. ¿Qué te gustaría construir ahora?
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* MENSAJE DE CIERRE */}
          <View style={styles.closingBanner}>
            <View style={styles.closingIconCircle}>
              <Sparkles size={16} color={THEME.colors.limaDark} />
            </View>
            <Text style={styles.closingBannerText}>
              {totalCheckable > 0 && totalDone === totalCheckable
                ? 'Rutina completa por hoy. Gran constancia, buen descanso.'
                : 'Hacer una sola cosa bien transforma todo el año. Sin apuro.'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: THEME.colors.cream,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  headerBlock: {
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerBrandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: THEME.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  appBrandTextCol: {
    justifyContent: 'center',
  },
  appBrandTop: {
    fontFamily: THEME.fonts.bold,
    fontSize: 20,
    lineHeight: 22,
    color: THEME.colors.dark,
    letterSpacing: -0.5,
  },
  appBrandBottom: {
    fontFamily: THEME.fonts.bold,
    fontSize: 20,
    lineHeight: 22,
    color: THEME.colors.coral,
    letterSpacing: -0.5,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dateText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 25,
    color: THEME.colors.dark,
    letterSpacing: -0.4,
  },
  ringBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.white,
    borderWidth: 2,
    borderColor: THEME.colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBadgeText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.coral,
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.limaLight,
    borderWidth: 1,
    borderColor: THEME.colors.lima,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
  },
  progressPillText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.limaDark,
  },
  pendingShieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.colors.coralLight,
    borderWidth: 1,
    borderColor: '#F5C4BC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  pendingShieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingShieldTextCol: {
    flex: 1,
  },
  pendingShieldTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: THEME.colors.coralDark,
  },
  pendingShieldSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 1,
  },
  longPausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.colors.aquaLight,
    borderWidth: 1,
    borderColor: THEME.colors.aqua,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  longPausedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  longPausedEmoji: {
    fontSize: 14,
  },
  longPausedTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: THEME.colors.aquaDark,
  },
  stackContainer: {
    position: 'relative',
    gap: 12,
  },
  verticalRail: {
    position: 'absolute',
    left: 19,
    top: 22,
    bottom: 36,
    width: 2,
    backgroundColor: THEME.colors.aqua,
    opacity: 0.65,
  },
  stackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  nodeAnchor: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.aquaLight,
    borderWidth: 1,
    borderColor: THEME.colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeGraduated: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeMaintenance: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActive: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.lima,
    borderWidth: 2,
    borderColor: THEME.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorCard: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 18,
    padding: 13,
  },
  anchorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  anchorTagText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: THEME.colors.aquaDark,
    letterSpacing: 0.7,
  },
  anchorTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 15,
    color: THEME.colors.dark,
  },
  anchorSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 1,
  },
  graduatedCard: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 18,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  graduatedPill: {
    backgroundColor: THEME.colors.surfaceLow,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
  },
  graduatedPillText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.muted,
  },
  integratedText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.aquaDark,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  graduatedStreak: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.muted,
  },
  maintenanceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  maintenanceInfo: {
    flex: 1,
  },
  maintenancePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 5,
  },
  maintenancePill: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.aquaLight,
    borderWidth: 1,
    borderColor: '#BCE6E4',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: THEME.radius.full,
  },
  anchorReadyPill: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.limaLight,
    borderWidth: 1,
    borderColor: THEME.colors.lima,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: THEME.radius.full,
  },
  anchorReadyPillText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: THEME.colors.limaDark,
  },
  maintenancePillText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: THEME.colors.aquaDark,
  },
  habitTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 15,
    color: THEME.colors.dark,
  },
  streakFlame: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.coral,
  },
  checkboxCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: THEME.colors.aqua,
    backgroundColor: THEME.colors.aquaLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleDone: {
    backgroundColor: THEME.colors.aquaDark,
    borderColor: THEME.colors.aquaDark,
  },
  activeCard: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    borderRadius: 22,
    padding: 15,
    borderWidth: 1.5,
    borderColor: THEME.colors.lima,
  },
  activePill: {
    backgroundColor: THEME.colors.limaLight,
    borderWidth: 1,
    borderColor: THEME.colors.lima,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
  },
  activePillText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.limaDark,
  },
  shieldsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: THEME.colors.coralLight,
    borderWidth: 1,
    borderColor: '#F5C4BC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
  },
  shieldsCount: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.coralDark,
    marginLeft: 2,
  },
  anchorLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    marginBottom: 4,
  },
  activeAnchorText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.muted,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activeHabitTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 21,
    color: THEME.colors.dark,
    flex: 1,
    lineHeight: 27,
  },
  seeDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: THEME.colors.surfaceLow,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
  },
  seeDetailText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.aquaDark,
  },
  targetProgressBox: {
    marginBottom: 12,
  },
  progressRowText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.muted,
  },
  progressPercent: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: THEME.colors.coral,
  },
  progressBarTrack: {
    height: 9,
    backgroundColor: THEME.colors.surfaceLow,
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.lima,
    borderRadius: 99,
  },
  readyConsolidateBanner: {
    backgroundColor: THEME.colors.limaLight,
    borderWidth: 1,
    borderColor: THEME.colors.lima,
    borderRadius: 14,
    padding: 11,
    marginBottom: 12,
  },
  readyConsolidateTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 13,
    color: THEME.colors.limaDark,
    marginBottom: 2,
  },
  readyConsolidateSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.dark,
    lineHeight: 16,
  },
  bigCheckButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: THEME.colors.coral,
    paddingVertical: 14,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCheckButtonDone: {
    backgroundColor: THEME.colors.lima,
  },
  bigCheckButtonText: {
    fontFamily: THEME.fonts.semibold,
    color: THEME.colors.white,
    fontSize: 15,
  },
  bigCheckButtonTextDone: {
    color: THEME.colors.limaDark,
  },
  gentleFooterHint: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.outline,
    textAlign: 'center',
    marginTop: 8,
  },
  addHabitCard: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.aqua,
    borderStyle: 'dashed',
  },
  addHabitIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  addHabitTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 15,
    color: THEME.colors.dark,
    marginBottom: 4,
    textAlign: 'center',
  },
  addHabitSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  closingBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 18,
    padding: 12,
  },
  closingIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.limaLight,
    borderWidth: 1,
    borderColor: THEME.colors.lima,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closingBannerText: {
    fontFamily: THEME.fonts.regular,
    flex: 1,
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 18,
  },
});
