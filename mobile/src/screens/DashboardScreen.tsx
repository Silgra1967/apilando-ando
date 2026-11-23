import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield,
  Settings,
  Anchor,
  HelpCircle,
  Trees,
  Sprout,
  Check,
  Flame,
  Sparkles,
  ChevronRight,
  Leaf,
} from 'lucide-react-native';
import { THEME, ThemeColors } from '../theme/colors';
import { useAppTheme } from '../theme/useAppTheme';
import { useTranslation, formatText } from '../i18n/translations';
import { useHabitStore } from '../store/habitStore';
import { Habit, isEligibleForAnchorGraduation } from '../types/habit';
import { triggerSuccessHaptic, triggerLightHaptic } from '../services/hapticService';
import { MilestoneCelebrationData } from '../components/MilestoneCelebrationModal';
import { ConfettiBurst } from '../components/ConfettiBurst';

interface DashboardScreenProps {
  onOpenDetail: (habit: Habit) => void;
  onSimulateShield: () => void;
  onOpenAddHabit: () => void;
  onPromoteHabit: (habit: Habit) => void;
  onOpenSettings: () => void;
  onMilestoneReached?: (celebration: MilestoneCelebrationData) => void;
  pendingShieldCount?: number;
  onOpenPendingShields?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenDetail,
  onSimulateShield,
  onOpenAddHabit,
  onPromoteHabit,
  onOpenSettings,
  onMilestoneReached,
  pendingShieldCount = 0,
  onOpenPendingShields,
}) => {
  const { habits, logs, settings, toggleDayCompletion } = useHabitStore();
  const { colors, shadows } = useAppTheme();
  const { t, locale } = useTranslation();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [helpTopic, setHelpTopic] = useState<'anchor' | 'construction' | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);

  const helpContent =
    helpTopic === 'anchor'
      ? {
          icon: <Anchor size={20} color={colors.aquaDark} />,
          iconBg: colors.aquaLight,
          iconBorder: colors.aqua,
          title: t.dashboard.anchorHelpTitle,
          paragraphs: [t.dashboard.anchorHelpBody1, t.dashboard.anchorHelpBody2],
        }
      : helpTopic === 'construction'
      ? {
          icon: <Sprout size={20} color={colors.limaDark} />,
          iconBg: colors.limaLight,
          iconBorder: colors.lima,
          title: t.dashboard.why21Title,
          paragraphs: [t.dashboard.why21Body1, t.dashboard.why21Body2],
        }
      : null;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const formattedDate = now.toLocaleDateString(locale, {
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.mobileFrame}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* HEADER: LOGO + NOMBRE DE LA APP Y ACCESOS EN UNA FILA LIMPIA */}
          <View style={styles.headerBlock}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerBrandRow}>
                <View style={styles.brandLogoWrap}>
                  <Image
                    source={require('../../assets/logo.png')}
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
                <TouchableOpacity style={styles.iconCircleBtn} onPress={onSimulateShield}>
                  <Shield size={17} color={colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircleBtn} onPress={onOpenSettings}>
                  <Settings size={17} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{capitalizedDate}</Text>
            </View>

            <View style={styles.greetingRow}>
              <Text style={styles.greetingTitle}>
                {settings.userName
                  ? formatText(t.dashboard.routineTitleNamed, { name: settings.userName })
                  : t.dashboard.routineTitle}
              </Text>
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
                <Shield size={16} color={colors.coral} />
              </View>
              <View style={styles.pendingShieldTextCol}>
                <Text style={styles.pendingShieldTitle}>
                  {pendingShieldCount === 1
                    ? t.dashboard.pendingShieldSingle
                    : formatText(t.dashboard.pendingShieldMulti, { count: pendingShieldCount })}
                </Text>
                <Text style={styles.pendingShieldSub}>{t.dashboard.pendingShieldSub}</Text>
              </View>
              <ChevronRight size={16} color={colors.coralDark} />
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
              <ChevronRight size={16} color={colors.aquaDark} />
            </TouchableOpacity>
          )}

          {/* CONTENEDOR HABIT STACKING CON RIEL VERTICAL */}
          <View style={styles.stackContainer}>
            <View style={styles.verticalRail} />

            {/* 1. ANCLA INICIAL */}
            {activeHabit?.anchorText && (
              <View style={styles.stackRow}>
                <View style={styles.nodeAnchor}>
                  <Anchor size={18} color={colors.aquaDark} />
                </View>
                <View style={styles.anchorCard}>
                  <View style={styles.anchorHeader}>
                    <View style={styles.anchorPill}>
                      <Text style={styles.anchorPillText}>{t.dashboard.anchorPill}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.anchorHelpBtn}
                      onPress={() => setHelpTopic('anchor')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Qué es un hábito ancla"
                    >
                      <HelpCircle size={18} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.anchorTitle}>{activeHabit.anchorText}</Text>
                </View>
              </View>
            )}

            {/* 2. HÁBITOS GRADUADOS (6 MESES) */}
            {anchorHabits.map((a) => (
              <View key={a.id} style={styles.stackRow}>
                <View style={styles.nodeGraduated}>
                  <Trees size={17} color={colors.aquaDark} />
                </View>
                <TouchableOpacity
                  style={styles.graduatedCard}
                  activeOpacity={0.85}
                  onPress={() => onOpenDetail(a)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.graduatedPill}>
                      <Text style={styles.graduatedPillText}>{t.dashboard.graduatedPill}</Text>
                    </View>
                    <Text style={styles.integratedText}>{t.dashboard.integrated}</Text>
                  </View>
                  <Text style={styles.habitTitle}>{a.name}</Text>
                  <View style={styles.metaInline}>
                    <Sparkles size={13} color={colors.aquaDark} />
                    <Text style={styles.graduatedStreak}>
                      {formatText(t.dashboard.consolidatedStreak, { count: a.currentStreak })}
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
                    <Leaf size={17} color={colors.aquaDark} />
                  </View>
                  <View style={styles.maintenanceCard}>
                    <TouchableOpacity
                      style={styles.maintenanceInfo}
                      activeOpacity={0.8}
                      onPress={() => onOpenDetail(m)}
                    >
                      <View style={styles.maintenancePillRow}>
                        <View style={styles.maintenancePill}>
                          <Text style={styles.maintenancePillText}>{t.dashboard.maintenancePill}</Text>
                        </View>
                        {readyForAnchor && (
                          <View style={styles.anchorReadyPill}>
                            <Text style={styles.anchorReadyPillText}>{t.dashboard.graduate6m}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.habitTitle} numberOfLines={2}>
                        {m.name}
                      </Text>
                      <View style={styles.metaInline}>
                        <Flame size={13} color={colors.coral} />
                        <Text style={styles.streakFlame}>
                          {formatText(t.dashboard.continuousDays, { count: m.currentStreak })}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.checkboxCircle, done && styles.checkboxCircleDone]}
                      onPress={() => {
                        if (!done) {
                          setConfettiKey((k) => k + 1);
                        }
                        triggerLightHaptic();
                        toggleDayCompletion(m.id, todayStr);
                      }}
                    >
                      {done && <Check size={19} color={colors.white} strokeWidth={2.8} />}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* 4. TARJETA PROTAGÓNICA: HÁBITO ACTIVO */}
            {activeHabit && (
              <View style={styles.stackRow}>
                <View style={styles.nodeActive}>
                  <Sprout size={19} color={colors.limaDark} />
                </View>

                <View style={styles.activeCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>{t.dashboard.constructionPill}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.anchorHelpBtn}
                      onPress={() => setHelpTopic('construction')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={t.dashboard.why21Title}
                    >
                      <HelpCircle size={18} color={colors.muted} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity activeOpacity={0.8} onPress={() => onOpenDetail(activeHabit)}>
                    <View style={styles.titleRow}>
                      <Text style={styles.activeHabitTitle}>{activeHabit.name}</Text>
                      <View style={styles.seeDetailPill}>
                        <Text style={styles.seeDetailText}>{t.dashboard.seeDetail}</Text>
                        <ChevronRight size={14} color={colors.aquaDark} />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Barra hacia los 21 días */}
                  <View style={styles.targetProgressBox}>
                    <View style={styles.progressRowText}>
                      <Text style={styles.progressSub}>
                        {activeHabit.currentStreak >= 21
                          ? t.dashboard.completed21
                          : formatText(t.dashboard.daysToConsolidate, {
                              count: activeHabit.currentStreak,
                            })}
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
                      <Text style={styles.readyConsolidateTitle}>
                        {t.dashboard.readyConsolidateTitle}
                      </Text>
                      <Text style={styles.readyConsolidateSub}>
                        {t.dashboard.readyConsolidateSub}
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
                        setConfettiKey((k) => k + 1);
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
                    {isCompletedToday(activeHabit.id) && (
                      <Check
                        size={18}
                        color={colors.limaDark}
                        strokeWidth={2.6}
                      />
                    )}
                    <Text
                      style={[
                        styles.bigCheckButtonText,
                        isCompletedToday(activeHabit.id) && styles.bigCheckButtonTextDone,
                      ]}
                    >
                      {isCompletedToday(activeHabit.id)
                        ? t.dashboard.doneCelebration
                        : t.dashboard.doneQuestion}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 5. SI NO HAY HÁBITO ACTIVO */}
            {!activeHabit && (
              <View style={styles.stackRow}>
                <View style={styles.nodeActive}>
                  <Sprout size={19} color={colors.limaDark} />
                </View>
                <TouchableOpacity style={styles.addHabitCard} onPress={onOpenAddHabit}>
                  <Text style={styles.addHabitIcon}>🌱</Text>
                  <Text style={styles.addHabitTitle}>{t.dashboard.addHabitTitle}</Text>
                  <Text style={styles.addHabitSub}>{t.dashboard.addHabitSub}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* MENSAJE DE CIERRE */}
          <View style={styles.closingBanner}>
            <View style={styles.closingIconCircle}>
              <Sparkles size={16} color={colors.limaDark} />
            </View>
            <Text style={styles.closingBannerText}>
              {totalCheckable > 0 && totalDone === totalCheckable
                ? t.dashboard.closingDone
                : t.dashboard.closingPending}
            </Text>
          </View>
        </ScrollView>
      </View>

      <ConfettiBurst triggerKey={confettiKey} />

      <Modal
        visible={helpContent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpTopic(null)}
      >
        <TouchableOpacity
          style={styles.helpOverlay}
          activeOpacity={1}
          onPress={() => setHelpTopic(null)}
        >
          <TouchableOpacity
            style={styles.helpDialog}
            activeOpacity={1}
            onPress={() => {}}
          >
            {helpContent && (
              <>
                <View
                  style={[
                    styles.helpIconWrap,
                    {
                      backgroundColor: helpContent.iconBg,
                      borderColor: helpContent.iconBorder,
                    },
                  ]}
                >
                  {helpContent.icon}
                </View>
                <Text style={styles.helpTitle}>{helpContent.title}</Text>
                {helpContent.paragraphs.map((text, idx) => (
                  <Text key={idx} style={styles.helpBody}>
                    {text}
                  </Text>
                ))}
                <TouchableOpacity
                  style={styles.helpCloseBtn}
                  onPress={() => setHelpTopic(null)}
                >
                  <Text style={styles.helpCloseBtnText}>{t.dashboard.understood}</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, shadows: ReturnType<typeof useAppTheme>['shadows']) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: colors.cream,
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
    marginBottom: 22,
  },
  headerBrandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogoWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 56,
    height: 56,
  },
  appBrandTextCol: {
    justifyContent: 'center',
  },
  appBrandTop: {
    fontFamily: THEME.fonts.bold,
    fontSize: 24,
    lineHeight: 26,
    color: colors.dark,
    letterSpacing: -0.5,
  },
  appBrandBottom: {
    fontFamily: THEME.fonts.bold,
    fontSize: 24,
    lineHeight: 26,
    color: colors.coral,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.muted,
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
    color: colors.dark,
    letterSpacing: -0.4,
  },
  pendingShieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.coralLight,
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
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingShieldTextCol: {
    flex: 1,
  },
  pendingShieldTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: colors.coralDark,
  },
  pendingShieldSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  longPausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.aquaLight,
    borderWidth: 1,
    borderColor: colors.aqua,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  longPausedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  longPausedEmoji: {
    fontSize: 14,
  },
  longPausedTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: colors.aquaDark,
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
    backgroundColor: colors.aqua,
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
    backgroundColor: colors.aquaLight,
    borderWidth: 1,
    borderColor: colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeGraduated: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeMaintenance: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActive: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.lima,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.aqua,
    borderRadius: 22,
    padding: 18,
    ...shadows.card,
  },
  anchorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  anchorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.aquaLight,
    borderWidth: 1,
    borderColor: colors.aqua,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
  },
  anchorPillText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: colors.aquaDark,
  },
  anchorHelpBtn: {
    padding: 4,
    borderRadius: THEME.radius.full,
  },
  anchorTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 20,
    lineHeight: 26,
    color: colors.dark,
  },
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 30, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  helpDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  helpIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.aquaLight,
    borderWidth: 1,
    borderColor: colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  helpTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 18,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  helpBody: {
    fontFamily: THEME.fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    marginBottom: 10,
  },
  helpCloseBtn: {
    marginTop: 6,
    backgroundColor: colors.coral,
    borderRadius: THEME.radius.full,
    paddingVertical: 11,
    alignItems: 'center',
  },
  helpCloseBtnText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  graduatedCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  graduatedPill: {
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
  },
  graduatedPillText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.muted,
  },
  integratedText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: colors.aquaDark,
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
    color: colors.muted,
  },
  maintenanceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    ...shadows.card,
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
    backgroundColor: colors.aquaLight,
    borderWidth: 1,
    borderColor: '#BCE6E4',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: THEME.radius.full,
  },
  anchorReadyPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.limaLight,
    borderWidth: 1,
    borderColor: colors.lima,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: THEME.radius.full,
  },
  anchorReadyPillText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: colors.limaDark,
  },
  maintenancePillText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: colors.aquaDark,
  },
  habitTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 15,
    color: colors.dark,
  },
  streakFlame: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: colors.coral,
  },
  checkboxCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.aqua,
    backgroundColor: colors.aquaLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleDone: {
    backgroundColor: colors.aquaDark,
    borderColor: colors.aquaDark,
  },
  activeCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.lima,
    ...shadows.card,
  },
  activePill: {
    backgroundColor: colors.limaLight,
    borderWidth: 1,
    borderColor: colors.lima,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
  },
  activePillText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: colors.limaDark,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  activeHabitTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 21,
    color: colors.dark,
    flex: 1,
    lineHeight: 27,
  },
  seeDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
  },
  seeDetailText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: colors.aquaDark,
  },
  targetProgressBox: {
    marginBottom: 16,
  },
  progressRowText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  progressPercent: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: colors.coral,
  },
  progressBarTrack: {
    height: 9,
    backgroundColor: colors.surfaceLow,
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.lima,
    borderRadius: 99,
  },
  readyConsolidateBanner: {
    backgroundColor: colors.limaLight,
    borderWidth: 1,
    borderColor: colors.lima,
    borderRadius: 14,
    padding: 11,
    marginBottom: 12,
  },
  readyConsolidateTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 13,
    color: colors.limaDark,
    marginBottom: 2,
  },
  readyConsolidateSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: colors.dark,
    lineHeight: 16,
  },
  bigCheckButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.coral,
    paddingVertical: 14,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCheckButtonDone: {
    backgroundColor: colors.lima,
  },
  bigCheckButtonText: {
    fontFamily: THEME.fonts.semibold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  bigCheckButtonTextDone: {
    color: colors.limaDark,
  },
  addHabitCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.aqua,
    borderStyle: 'dashed',
    ...shadows.card,
  },
  addHabitIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  addHabitTitle: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 15,
    color: colors.dark,
    marginBottom: 4,
    textAlign: 'center',
  },
  addHabitSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  closingBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 12,
    ...shadows.card,
  },
  closingIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.limaLight,
    borderWidth: 1,
    borderColor: colors.lima,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closingBannerText: {
    fontFamily: THEME.fonts.regular,
    flex: 1,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
});
