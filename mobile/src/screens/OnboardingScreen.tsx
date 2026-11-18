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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/colors';
import { useHabitStore } from '../store/habitStore';

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* PASO 1: BIENVENIDA */}
        {step === 1 && (
          <View style={styles.contentBetween}>
            <View style={styles.centerHero}>
              <Text style={styles.emojiHero}>🌱</Text>
              <Text style={styles.title}>Apliando Ando</Text>
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
              <Text style={styles.badgeStep}>Paso 1 de 4</Text>
              <Text style={styles.heading}>¿Qué hábito querés empezar a construir?</Text>
              <Text style={styles.subheading}>Elegí una acción pequeña y posible todos los días.</Text>

              <TextInput
                style={styles.input}
                placeholder="Ej. Leer 10 minutos, Tomar agua..."
                placeholderTextColor={THEME.colors.muted}
                value={habitName}
                onChangeText={setHabitName}
              />

              <View style={styles.chipRow}>
                {['Leer 10 min', 'Caminar 15 min', 'Beber agua', 'Meditar 5 min'].map((sug) => (
                  <TouchableOpacity
                    key={sug}
                    style={styles.chip}
                    onPress={() => setHabitName(sug)}
                  >
                    <Text style={styles.chipText}>{sug}</Text>
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
                    {selectedColor === c.hex && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                ))}
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
              <Text style={styles.badgeStep}>Paso 2 de 4</Text>
              <Text style={styles.heading}>¿A qué momento de tu día lo podés enganchar?</Text>
              <Text style={styles.subheading}>
                Los hábitos nuevos se instalan mejor cuando los atás a algo que ya hacés en automático.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ej. Después del café, antes de dormir..."
                placeholderTextColor={THEME.colors.muted}
                value={anchorText}
                onChangeText={setAnchorText}
              />

              <View style={styles.chipRow}>
                {['Después del desayuno', 'Con el mate', 'Antes de dormir', 'Al volver del trabajo'].map(
                  (a) => (
                    <TouchableOpacity key={a} style={styles.chip} onPress={() => setAnchorText(a)}>
                      <Text style={styles.chipText}>{a}</Text>
                    </TouchableOpacity>
                  )
                )}
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

        {/* PASO 4: RECORDATORIO */}
        {step === 4 && (
          <View style={styles.contentBetween}>
            <View>
              <Text style={styles.badgeStep}>Paso 3 de 4</Text>
              <Text style={styles.heading}>¿A qué hora querés que te recordemos?</Text>
              <Text style={styles.subheading}>
                Una notificación simple para cerrar tu día con tranquilidad. Cero spam.
              </Text>

              <View style={styles.timePickerContainer}>
                <TextInput
                  style={styles.timeInput}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(5)}>
              <Text style={styles.primaryButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PASO 5: LA REVELACIÓN (SECUENCIAL) */}
        {step === 5 && (
          <View style={styles.contentBetween}>
            {revelationStep === 1 && (
              <View style={styles.centerHero}>
                <Text style={styles.emojiHero}>🌱</Text>
                <Text style={styles.revelationBadge}>Regla 1 de 3</Text>
                <Text style={styles.headingCenter}>Un hábito a la vez</Text>
                <Text style={styles.paragraphCenter}>
                  Esta app solo te deja tener <Text style={styles.boldText}>un hábito activo a la vez</Text>.
                  No es un límite: es para asegurar que{' '}
                  <Text style={styles.boldText}>{habitName || 'tu hábito'}</Text> realmente se instale en tu vida.
                </Text>
              </View>
            )}

            {revelationStep === 2 && (
              <View style={styles.centerHero}>
                <Text style={styles.emojiHero}>🛡️</Text>
                <Text style={styles.revelationBadge}>Regla 2 de 3</Text>
                <Text style={styles.headingCenter}>Tus escudos de protección</Text>
                <Text style={styles.paragraphCenter}>
                  Empezás con <Text style={styles.boldText}>2 escudos</Text>. Si un día no podés, la racha no se cae:
                  al día siguiente decidís conscientemente si usar tu escudo. La constancia importa más que la perfección.
                </Text>
              </View>
            )}

            {revelationStep === 3 && (
              <View style={styles.centerHero}>
                <Text style={styles.emojiHero}>📅</Text>
                <Text style={styles.revelationBadge}>Regla 3 de 3</Text>
                <Text style={styles.headingCenter}>La meta de 21 días</Text>
                <Text style={styles.paragraphCenter}>
                  Cuando llegues a los <Text style={styles.boldText}>21 días cumplidos</Text>, recién ahí abriremos
                  la puerta para sumar el siguiente hábito. Hasta entonces, este es tu único foco.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                revelationStep === 3 && { backgroundColor: THEME.colors.sage },
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
                {revelationStep === 1 ? 'Entendido' : revelationStep === 2 ? 'Siguiente' : '¡Empecemos!'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
  },
  contentBetween: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: THEME.spacing.md,
  },
  centerHero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  emojiHero: {
    fontSize: 54,
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: THEME.spacing.md,
    letterSpacing: -0.5,
  },
  paragraph: {
    fontSize: 16,
    color: THEME.colors.muted,
    lineHeight: 24,
    textAlign: 'center',
  },
  paragraphCenter: {
    fontSize: 15,
    color: THEME.colors.muted,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  boldText: {
    fontWeight: '700',
    color: THEME.colors.dark,
  },
  badgeStep: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: THEME.spacing.xs,
  },
  revelationBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: THEME.spacing.xs,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: THEME.spacing.xs,
    lineHeight: 30,
  },
  headingCenter: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: THEME.spacing.md,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: THEME.colors.muted,
    lineHeight: 20,
    marginBottom: THEME.spacing.lg,
  },
  input: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: THEME.colors.dark,
    marginBottom: THEME.spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: THEME.spacing.xl,
  },
  chip: {
    backgroundColor: THEME.colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.full,
  },
  chipText: {
    fontSize: 12,
    color: THEME.colors.dark,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: THEME.spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 16,
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
  checkMark: {
    color: THEME.colors.white,
    fontWeight: '900',
  },
  timePickerContainer: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  timeInput: {
    fontSize: 48,
    fontWeight: '900',
    color: THEME.colors.dark,
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.lg,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  primaryButton: {
    backgroundColor: THEME.colors.dark,
    paddingVertical: 18,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: THEME.colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  textButton: {
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
    marginTop: THEME.spacing.xs,
  },
  textButtonText: {
    fontSize: 12,
    color: THEME.colors.muted,
    fontWeight: '600',
  },
});
