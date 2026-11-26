import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { THEME, ThemeColors } from '../theme/colors';
import { useAppTheme } from '../theme/useAppTheme';
import { useTranslation, formatText } from '../i18n/translations';
import {
  CONSOLIDATION_DAYS,
  Habit,
  DailyLog,
  isReadyForMaintenancePromotion,
  parseLocalDateStr,
  toLocalDateStr,
} from '../types/habit';

interface MonthlyReviewContentProps {
  habits: Habit[];
  logs: Record<string, DailyLog>;
  currentDateKey?: string;
  onPromoteAndAddHabit: (habit: Habit) => void;
  embedded?: boolean;
  onClose?: () => void;
  onContinueFocus?: () => void;
}

interface MonthlyReviewModalProps extends MonthlyReviewContentProps {
  visible: boolean;
  onClose: () => void;
}

export const MonthlyReviewContent: React.FC<MonthlyReviewContentProps> = ({
  habits,
  logs,
  currentDateKey,
  onPromoteAndAddHabit,
  embedded = false,
  onClose,
  onContinueFocus,
}) => {
  const { colors, shadows } = useAppTheme();
  const { t, locale } = useTranslation();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const now = currentDateKey ? parseLocalDateStr(currentDateKey) : new Date();
  // El día 1 del mes, el ritual de cierre muestra el balance del mes que acaba de terminar
  const reviewDate =
    now.getDate() === 1
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = reviewDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const targetMonthPrefix = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLogs = Object.values(logs).filter((l) => l.date.startsWith(targetMonthPrefix));

  const daysCompletedSet = new Set<string>();
  const daysShieldedSet = new Set<string>();

  monthLogs.forEach((l) => {
    if (l.status === 'completed') daysCompletedSet.add(l.date);
    if (l.status === 'shielded') daysShieldedSet.add(l.date);
  });

  const totalActiveDays = daysCompletedSet.size;
  const totalShieldedDays = daysShieldedSet.size;

  const activeHabit = habits.find((h) => h.status === 'active');
  const maintenanceCount = habits.filter((h) => h.status === 'maintenance').length;
  const anchorCount = habits.filter((h) => h.status === 'anchor').length;

  const todayStr = currentDateKey || toLocalDateStr(now);
  const canPromote = activeHabit
    ? isReadyForMaintenancePromotion(activeHabit, logs, todayStr)
    : false;
  const completed21Today = Boolean(
    activeHabit && activeHabit.currentStreak >= CONSOLIDATION_DAYS && !canPromote
  );

  const handleContinue = () => {
    if (onContinueFocus) {
      onContinueFocus();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <View style={embedded ? styles.embeddedContainer : undefined}>
      <View style={styles.header}>
        <View>
          <Text style={styles.badgeText}>{t.monthly.kicker}</Text>
          <Text style={styles.title}>
            {formatText(t.monthly.title, { month: capitalizedMonth })}
          </Text>
        </View>
        {!embedded && onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* BALANCE VISUAL DE CONSTANCIA */}
        <View style={styles.statsCard}>
          <Text style={styles.statsGreeting}>{t.monthly.greeting}</Text>
          <Text style={styles.statsDescription}>{t.monthly.description}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricNumber}>{totalActiveDays}</Text>
              <Text style={styles.metricLabel}>{t.monthly.activeDays}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricNumber}>{totalShieldedDays}</Text>
              <Text style={styles.metricLabel}>{t.monthly.shieldedDays}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricNumber}>{maintenanceCount + anchorCount}</Text>
              <Text style={styles.metricLabel}>{t.monthly.consolidated}</Text>
            </View>
          </View>
        </View>

        {/* SITUACIÓN DEL HÁBITO ACTIVO */}
        {activeHabit ? (
          <View style={styles.activeReviewBox}>
            <View style={styles.activeHeaderRow}>
              <Text style={styles.activeTag}>{t.monthly.focusTag}</Text>
              <Text style={styles.activeStreakText}>
                {formatText(t.monthly.streakDays, { count: activeHabit.currentStreak })}
              </Text>
            </View>
            <Text style={styles.activeName}>{activeHabit.name}</Text>
            {activeHabit.anchorText && (
              <Text style={styles.activeAnchor}>↳ {activeHabit.anchorText}</Text>
            )}

            {/* DECISIÓN SEGÚN LOS 21 DÍAS */}
            {canPromote ? (
              <View style={styles.decisionPass}>
                <Text style={styles.decisionTitle}>{t.monthly.readyTitle}</Text>
                <Text style={styles.decisionText}>{t.monthly.readyText}</Text>

                <TouchableOpacity
                  style={styles.promoteBtn}
                  onPress={() => {
                    onClose?.();
                    onPromoteAndAddHabit(activeHabit);
                  }}
                >
                  <Text style={styles.promoteBtnText}>{t.monthly.promoteBtn}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.decisionPedagogy}>
                <Text style={styles.pedagogyTitle}>
                  {completed21Today ? t.monthly.completed21WaitTitle : t.monthly.pedagogyTitle}
                </Text>
                <Text style={styles.pedagogyText}>
                  {formatText(
                    completed21Today ? t.monthly.completed21WaitText : t.monthly.pedagogyText,
                    {
                      count: activeHabit.currentStreak,
                      name: activeHabit.name,
                    }
                  )}
                </Text>
                <TouchableOpacity style={styles.pedagogyBtn} onPress={handleContinue}>
                  <Text style={styles.pedagogyBtnText}>{t.monthly.continueBtn}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.activeReviewBox}>
            <Text style={styles.activeTag}>{t.monthly.allConsolidatedTag}</Text>
            <Text style={styles.activeName}>{t.monthly.allConsolidatedTitle}</Text>
            <Text style={styles.pedagogyText}>{t.monthly.allConsolidatedSub}</Text>
            <TouchableOpacity style={styles.pedagogyBtn} onPress={handleContinue}>
              <Text style={styles.pedagogyBtnText}>
                {embedded ? t.detail.backToToday : t.dashboard.understood}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export const MonthlyReviewModal: React.FC<MonthlyReviewModalProps> = ({
  visible,
  onClose,
  habits,
  logs,
  currentDateKey,
  onPromoteAndAddHabit,
}) => {
  const { colors, shadows } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <MonthlyReviewContent
            habits={habits}
            logs={logs}
            currentDateKey={currentDateKey}
            onPromoteAndAddHabit={onPromoteAndAddHabit}
            onClose={onClose}
          />
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
      backgroundColor: 'rgba(18, 30, 28, 0.55)',
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
    content: {
      paddingBottom: 24,
    },
    statsCard: {
      backgroundColor: colors.white,
      borderRadius: THEME.radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      ...shadows.card,
    },
    statsGreeting: {
      fontFamily: THEME.fonts.medium,
      fontSize: 15,
      color: colors.dark,
      marginBottom: 6,
    },
    statsDescription: {
      fontFamily: THEME.fonts.regular,
      fontSize: 12,
      color: colors.muted,
      lineHeight: 16,
      marginBottom: 14,
    },
    metricsRow: {
      flexDirection: 'row',
      backgroundColor: colors.sandLight,
      borderRadius: THEME.radius.md,
      paddingVertical: 12,
    },
    metricBox: {
      flex: 1,
      alignItems: 'center',
    },
    metricNumber: {
      fontFamily: THEME.fonts.medium,
      fontSize: 19,
      color: colors.dark,
    },
    metricLabel: {
      fontFamily: THEME.fonts.medium,
      fontSize: 10,
      color: colors.muted,
      marginTop: 2,
    },
    metricDivider: {
      width: 1,
      backgroundColor: colors.border,
      height: '60%',
      alignSelf: 'center',
    },
    activeReviewBox: {
      backgroundColor: colors.white,
      borderRadius: THEME.radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    activeHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    activeTag: {
      fontFamily: THEME.fonts.semibold,
      fontSize: 10,
      color: colors.sage,
      textTransform: 'uppercase',
    },
    activeStreakText: {
      fontFamily: THEME.fonts.semibold,
      fontSize: 12,
      color: colors.dark,
    },
    activeName: {
      fontFamily: THEME.fonts.medium,
      fontSize: 18,
      color: colors.dark,
    },
    activeAnchor: {
      fontFamily: THEME.fonts.regular,
      fontSize: 12,
      color: colors.muted,
      marginTop: 6,
      marginBottom: 16,
    },
    decisionPass: {
      backgroundColor: colors.sageLight,
      padding: 14,
      borderRadius: THEME.radius.md,
      marginTop: 10,
    },
    decisionTitle: {
      fontFamily: THEME.fonts.semibold,
      fontSize: 13,
      color: colors.dark,
      marginBottom: 8,
    },
    decisionText: {
      fontFamily: THEME.fonts.regular,
      fontSize: 12,
      color: colors.dark,
      lineHeight: 17,
      marginBottom: 12,
    },
    promoteBtn: {
      backgroundColor: colors.coral,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: THEME.radius.full,
      alignItems: 'center',
    },
    promoteBtnText: {
      fontFamily: THEME.fonts.semibold,
      color: '#FFFFFF',
      fontSize: 13,
      textAlign: 'center',
    },
    decisionPedagogy: {
      backgroundColor: colors.lightGray,
      padding: 14,
      borderRadius: THEME.radius.md,
      marginTop: 10,
    },
    pedagogyTitle: {
      fontFamily: THEME.fonts.semibold,
      fontSize: 13,
      color: colors.dark,
      marginBottom: 8,
    },
    pedagogyText: {
      fontFamily: THEME.fonts.regular,
      fontSize: 12,
      color: colors.dark,
      lineHeight: 17,
      marginBottom: 12,
    },
    pedagogyBtn: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      borderRadius: THEME.radius.full,
      alignItems: 'center',
    },
    pedagogyBtnText: {
      fontFamily: THEME.fonts.medium,
      fontSize: 12,
      color: colors.dark,
    },
  });
