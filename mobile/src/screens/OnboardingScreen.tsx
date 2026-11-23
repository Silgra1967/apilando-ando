import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sprout,
  Shield,
  Calendar,
  Bell,
  ChevronUp,
  ChevronDown,
  Coffee,
  Leaf,
  Moon,
  Check,
} from 'lucide-react-native';
import { THEME } from '../theme/colors';
import { useHabitStore } from '../store/habitStore';

const TIME_PRESETS = [
  {
    time: '08:30',
    title: 'Con el desayuno',
    sub: 'Ideal para arrancar en calma',
    bg: THEME.colors.lima,
    iconColor: THEME.colors.limaDark,
    icon: 'coffee' as const,
  },
  {
    time: '18:00',
    title: 'Tarde tranquila',
    sub: 'Para cerrar la jornada',
    bg: THEME.colors.aqua,
    iconColor: THEME.colors.aquaDark,
    icon: 'leaf' as const,
  },
  {
    time: '21:30',
    title: 'Antes de dormir',
    sub: 'Momento de desconexión',
    bg: THEME.colors.coralLight,
    iconColor: THEME.colors.coralDark,
    icon: 'moon' as const,
  },
];

export const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [habitName, setHabitName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(THEME.palette[0].hex);
  const [anchorText, setAnchorText] = useState<string>('');
  const [reminderTime, setReminderTime] = useState<string>('20:00');
  const [revelationStep, setRevelationStep] = useState<number>(1);

  const { createInitialHabit } = useHabitStore();

  const handleFinish = async () => {
    const finalName = habitName.trim() || 'Caminar 15 min';
    await createInitialHabit(finalName, selectedColor, anchorText, reminderTime);
  };

  const adjustHour = (delta: number) => {
    const parts = reminderTime.split(':');
    const parsedHour = parseInt(parts[0], 10);
    const parsedMin = parseInt(parts[1], 10);
    const currentH = Number.isNaN(parsedHour) ? 20 : parsedHour;
    const currentM = Number.isNaN(parsedMin) ? 0 : parsedMin;
    const nextH = (currentH + delta + 24) % 24;
    setReminderTime(`${String(nextH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);
  };

  const progressWidth =
    step === 2 ? '25%' : step === 3 ? '50%' : step === 4 ? '75%' : '100%';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.innerContent}>
          {/* BARRA DE PROGRESO PARA PASOS 2 A 4 */}
          {step >= 2 && step <= 4 && (
            <View style={styles.progressHeader}>
              <View style={styles.progressTopRow}>
                <View style={styles.stepLabelRow}>
                  <Sprout size={15} color={THEME.colors.coral} />
                  <Text style={styles.badgeStep}>Paso {step - 1} de 4</Text>
                </View>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>
                    {step === 4 ? 'Casi listos' : 'Tu ritmo'}
                  </Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </View>
          )}

          {/* PASO 1: BIENVENIDA */}
          {step === 1 && (
            <View style={styles.contentBetween}>
              <View style={styles.centerHero}>
                <View style={styles.heroBubble}>
                  <Image
                    source={require('../../assets/icon.png')}
                    style={styles.heroLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.brandTag}>
                  <Text style={styles.brandTagText}>APILANDO ANDO</Text>
                </View>
                <Text style={styles.title}>Construí constancia sin presiones</Text>
                <Text style={styles.paragraph}>
                  Los hábitos no se construyen de golpe.{'\n'}
                  Se construyen de a uno, despacio, sin prisa.{'\n\n'}
                  <Text style={styles.boldText}>Acá vas a empezar por el primero.</Text>
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
                <Text style={styles.primaryButtonText}>Empezar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 2: ELEGIR HÁBITO Y COLOR */}
          {step === 2 && (
            <View style={styles.contentBetween}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.heading}>¿Qué hábito querés empezar a construir?</Text>
                <Text style={styles.subheading}>
                  Elegí una acción pequeña y posible todos los días.
                </Text>

                <View style={styles.cardBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Leer 10 minutos, Tomar agua..."
                    placeholderTextColor={THEME.colors.outline}
                    value={habitName}
                    onChangeText={setHabitName}
                  />

                  <View style={styles.chipRow}>
                    {['Leer 10 min', 'Caminar 15 min', 'Beber agua', 'Meditar 5 min'].map((sug) => (
                      <TouchableOpacity
                        key={sug}
                        style={[styles.chip, habitName === sug && styles.chipActive]}
                        onPress={() => setHabitName(sug)}
                      >
                        <Text
                          style={[styles.chipText, habitName === sug && styles.chipTextActive]}
                        >
                          {sug}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Color identificatorio</Text>
                  <View style={styles.colorRow}>
                    {THEME.palette.map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c.hex },
                          selectedColor === c.hex && styles.colorCircleSelected,
                        ]}
                        onPress={() => setSelectedColor(c.hex)}
                      >
                        {selectedColor === c.hex && (
                          <Check size={18} color={THEME.colors.dark} strokeWidth={3} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(3)}>
                <Text style={styles.primaryButtonText}>Este es</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 3: ANCLA */}
          {step === 3 && (
            <View style={styles.contentBetween}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.heading}>¿A qué momento de tu día lo podés enganchar?</Text>
                <Text style={styles.subheading}>
                  Los hábitos nuevos se instalan mejor cuando los atás a algo que ya hacés en
                  automático.
                </Text>

                <View style={styles.cardBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Después del café, antes de dormir..."
                    placeholderTextColor={THEME.colors.outline}
                    value={anchorText}
                    onChangeText={setAnchorText}
                  />

                  <View style={styles.chipRow}>
                    {[
                      'Después del desayuno',
                      'Con el mate',
                      'Antes de dormir',
                      'Al volver del trabajo',
                    ].map((a) => (
                      <TouchableOpacity
                        key={a}
                        style={[styles.chip, anchorText === a && styles.chipActive]}
                        onPress={() => setAnchorText(a)}
                      >
                        <Text style={[styles.chipText, anchorText === a && styles.chipTextActive]}>
                          {a}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(4)}>
                  <Text style={styles.primaryButtonText}>Perfecto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.textButton}
                  onPress={() => {
                    setAnchorText('');
                    setStep(4);
                  }}
                >
                  <Text style={styles.textButtonText}>Prefiero no anclar por ahora</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* PASO 4: RECORDATORIO (PASO 3 DE 4 VISUAL) */}
          {step === 4 && (
            <View style={styles.contentBetween}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.heading}>¿A qué hora te viene mejor?</Text>
                <Text style={styles.subheading}>
                  Te mandamos un recordatorio sutil. Cero spam, cero alertas agresivas.
                </Text>

                <View style={styles.cardBox}>
                  {/* Caja Hora Elegida */}
                  <View style={styles.timeDisplayCard}>
                    <Text style={styles.timeOverline}>HORA ELEGIDA</Text>
                    <View style={styles.timeAdjustRow}>
                      <TouchableOpacity
                        style={styles.timeStepBtn}
                        onPress={() => adjustHour(-1)}
                      >
                        <ChevronDown size={20} color={THEME.colors.dark} />
                      </TouchableOpacity>

                      <TextInput
                        style={styles.timeInput}
                        value={reminderTime}
                        onChangeText={setReminderTime}
                        maxLength={5}
                        keyboardType="numbers-and-punctuation"
                      />

                      <TouchableOpacity
                        style={styles.timeStepBtn}
                        onPress={() => adjustHour(1)}
                      >
                        <ChevronUp size={20} color={THEME.colors.dark} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.reminderStatusPill}>
                      <Bell size={13} color={THEME.colors.coral} />
                      <Text style={styles.reminderStatusText}>Recordatorio diario activado</Text>
                    </View>
                  </View>

                  <Text style={styles.presetsLabel}>O elegí según tu momento ancla:</Text>
                  <View style={styles.presetsList}>
                    {TIME_PRESETS.map((preset) => {
                      const selected = reminderTime === preset.time;
                      return (
                        <TouchableOpacity
                          key={preset.time}
                          style={[styles.presetRow, selected && styles.presetRowSelected]}
                          onPress={() => setReminderTime(preset.time)}
                        >
                          <View style={styles.presetLeft}>
                            <View style={[styles.presetIconCircle, { backgroundColor: preset.bg }]}>
                              {preset.icon === 'coffee' && (
                                <Coffee size={16} color={preset.iconColor} />
                              )}
                              {preset.icon === 'leaf' && (
                                <Leaf size={16} color={preset.iconColor} />
                              )}
                              {preset.icon === 'moon' && (
                                <Moon size={16} color={preset.iconColor} />
                              )}
                            </View>
                            <View>
                              <Text style={styles.presetTitle}>{preset.title}</Text>
                              <Text style={styles.presetSub}>{preset.sub}</Text>
                            </View>
                          </View>
                          <View style={styles.presetTimePill}>
                            <Text style={styles.presetTimeText}>{preset.time}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(5)}>
                <Text style={styles.primaryButtonText}>Listo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 5: LA REVELACIÓN (SECUENCIAL DE LAS 3 REGLAS) */}
          {step === 5 && (
            <View style={styles.contentBetween}>
              <View style={styles.centerHero}>
                {revelationStep === 1 && (
                  <View style={[styles.ruleCard, styles.ruleCardLima]}>
                    <View style={[styles.ruleIconCircle, { backgroundColor: THEME.colors.lima }]}>
                      <Sprout size={28} color={THEME.colors.limaDark} />
                    </View>
                    <View style={[styles.ruleBadgePill, { backgroundColor: THEME.colors.lima }]}>
                      <Text style={[styles.ruleBadgeText, { color: THEME.colors.limaDark }]}>
                        REGLA 1 DE 3 · 🌱 FOCO PLENO
                      </Text>
                    </View>
                    <Text style={styles.headingCenter}>Un hábito a la vez</Text>
                    <Text style={styles.paragraphCenter}>
                      Esta app solo te deja tener{' '}
                      <Text style={styles.boldText}>un hábito activo a la vez</Text>. No es un
                      límite: es para asegurar que{' '}
                      <Text style={styles.boldText}>{habitName || 'tu hábito'}</Text> realmente
                      eche raíces en tu vida.
                    </Text>
                  </View>
                )}

                {revelationStep === 2 && (
                  <View style={[styles.ruleCard, styles.ruleCardCoral]}>
                    <View
                      style={[styles.ruleIconCircle, { backgroundColor: THEME.colors.coralLight }]}
                    >
                      <Shield size={28} color={THEME.colors.coral} />
                    </View>
                    <View style={[styles.ruleBadgePill, { backgroundColor: THEME.colors.coral }]}>
                      <Text style={[styles.ruleBadgeText, { color: THEME.colors.white }]}>
                        REGLA 2 DE 3 · 🛡️ 2 DISPONIBLES
                      </Text>
                    </View>
                    <Text style={styles.headingCenter}>Tus escudos de protección</Text>
                    <Text style={styles.paragraphCenter}>
                      Empezás con <Text style={styles.boldText}>2 escudos</Text>. Si un día no
                      podés, la racha no se cae: al día siguiente decidís conscientemente si usar
                      tu escudo. La constancia importa más que la perfección.
                    </Text>
                  </View>
                )}

                {revelationStep === 3 && (
                  <View style={[styles.ruleCard, styles.ruleCardAqua]}>
                    <View style={[styles.ruleIconCircle, { backgroundColor: THEME.colors.aqua }]}>
                      <Calendar size={28} color={THEME.colors.aquaDark} />
                    </View>
                    <View style={[styles.ruleBadgePill, { backgroundColor: THEME.colors.aqua }]}>
                      <Text style={[styles.ruleBadgeText, { color: THEME.colors.aquaDark }]}>
                        REGLA 3 DE 3 · 🌿 MANTENIMIENTO
                      </Text>
                    </View>
                    <Text style={styles.headingCenter}>La meta de 21 días</Text>
                    <Text style={styles.paragraphCenter}>
                      Cuando llegues a los <Text style={styles.boldText}>21 días cumplidos</Text>,
                      recién ahí abriremos la puerta para sumar el siguiente hábito. Hasta
                      entonces, este es tu único foco.
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  revelationStep === 3 && { backgroundColor: THEME.colors.coral },
                ]}
                onPress={() => {
                  if (revelationStep < 3) {
                    setRevelationStep(revelationStep + 1);
                  } else {
                    handleFinish();
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {revelationStep === 1
                    ? 'Entendido'
                    : revelationStep === 2
                    ? 'Siguiente'
                    : '¡Entendido, empecemos! 🌱'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 0,
  },
  container: {
    flex: 1,
    paddingTop: THEME.spacing.md,
    paddingHorizontal: 16,
    paddingBottom: THEME.spacing.md,
  },
  innerContent: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  progressHeader: {
    marginBottom: 18,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeStep: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.coral,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusChip: {
    backgroundColor: THEME.colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
  },
  statusChipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.muted,
  },
  progressTrack: {
    height: 6,
    backgroundColor: THEME.colors.surfaceHigh,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.coral,
    borderRadius: 99,
  },
  contentBetween: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: THEME.spacing.sm,
  },
  centerHero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBubble: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: THEME.colors.limaLight,
    borderWidth: 2,
    borderColor: THEME.colors.lima,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emojiHero: {
    fontSize: 44,
  },
  heroLogo: {
    width: 68,
    height: 68,
    borderRadius: 20,
  },
  brandTag: {
    backgroundColor: THEME.colors.aquaLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: THEME.radius.full,
    marginBottom: 10,
  },
  brandTagText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.aquaDark,
    letterSpacing: 1,
  },
  title: {
    fontFamily: THEME.fonts.medium,
    fontSize: 28,
    color: THEME.colors.dark,
    marginBottom: THEME.spacing.md,
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 35,
  },
  paragraph: {
    fontFamily: THEME.fonts.regular,
    fontSize: 15,
    color: THEME.colors.muted,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  paragraphCenter: {
    fontFamily: THEME.fonts.regular,
    fontSize: 14,
    color: THEME.colors.muted,
    lineHeight: 22,
    textAlign: 'center',
  },
  boldText: {
    fontFamily: THEME.fonts.semibold,
    color: THEME.colors.dark,
  },
  heading: {
    fontFamily: THEME.fonts.medium,
    fontSize: 26,
    color: THEME.colors.dark,
    marginBottom: 6,
    lineHeight: 33,
    letterSpacing: -0.3,
  },
  headingCenter: {
    fontFamily: THEME.fonts.medium,
    fontSize: 22,
    color: THEME.colors.dark,
    marginBottom: 10,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: THEME.fonts.regular,
    fontSize: 14,
    color: THEME.colors.muted,
    lineHeight: 20,
    marginBottom: 18,
  },
  cardBox: {
    backgroundColor: THEME.colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  input: {
    fontFamily: THEME.fonts.regular,
    backgroundColor: THEME.colors.surfaceLow,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: THEME.colors.dark,
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    backgroundColor: THEME.colors.surfaceLow,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: THEME.radius.full,
  },
  chipActive: {
    backgroundColor: THEME.colors.lima,
    borderColor: THEME.colors.lima,
  },
  chipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.dark,
  },
  chipTextActive: {
    fontFamily: THEME.fonts.semibold,
    color: THEME.colors.limaDark,
  },
  sectionLabel: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    color: THEME.colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 14,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: THEME.colors.dark,
  },
  timeDisplayCard: {
    backgroundColor: THEME.colors.surfaceLow,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  timeOverline: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 10,
    color: THEME.colors.outline,
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  timeAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  timeStepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInput: {
    fontFamily: THEME.fonts.semibold,
    width: 150,
    maxWidth: '100%',
    textAlign: 'center',
    fontSize: 40,
    color: THEME.colors.coral,
    paddingVertical: 4,
  },
  reminderStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.aquaLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
    marginTop: 8,
  },
  reminderStatusText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.aquaDark,
  },
  presetsLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.muted,
    marginBottom: 10,
  },
  presetsList: {
    gap: 8,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceLow,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetRowSelected: {
    borderColor: THEME.colors.coral,
    backgroundColor: THEME.colors.surfaceContainer,
  },
  presetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  presetIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.dark,
  },
  presetSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.muted,
  },
  presetTimePill: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
  },
  presetTimeText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 12,
    color: THEME.colors.coral,
  },
  ruleCard: {
    width: '100%',
    backgroundColor: THEME.colors.white,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
  },
  ruleCardLima: {
    borderColor: THEME.colors.lima,
  },
  ruleCardCoral: {
    borderColor: '#F5C4BC',
  },
  ruleCardAqua: {
    borderColor: THEME.colors.aqua,
  },
  ruleIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  ruleBadgePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
    marginBottom: 12,
  },
  ruleBadgeText: {
    fontFamily: THEME.fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  primaryButton: {
    backgroundColor: THEME.colors.coral,
    paddingVertical: 16,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
    shadowColor: THEME.colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontFamily: THEME.fonts.semibold,
    color: THEME.colors.white,
    fontSize: 16,
  },
  textButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  textButtonText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.muted,
  },
});
