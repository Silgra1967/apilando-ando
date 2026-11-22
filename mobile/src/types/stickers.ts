export interface MilestoneSticker {
  id: string;
  name: string;
  emoji: string;
  minStreak?: number;
  category: 'streak' | 'lifecycle' | 'special';
  description: string;
  lore: string;
}

export const MILESTONE_STICKERS: MilestoneSticker[] = [
  {
    id: 'first_step',
    name: 'Primer Paso',
    emoji: '🌱',
    minStreak: 1,
    category: 'special',
    description: 'Comenzaste un nuevo camino con intención.',
    lore: 'El viaje más largo empieza con una pequeña acción hoy.',
  },
  {
    id: 'streak_7',
    name: 'Semana Firme',
    emoji: '🔥',
    minStreak: 7,
    category: 'streak',
    description: '7 días continuos de constancia.',
    lore: 'Superaste la resistencia del comienzo y armaste ritmo.',
  },
  {
    id: 'streak_14',
    name: 'Ritmo Vivo',
    emoji: '⚡',
    minStreak: 14,
    category: 'streak',
    description: '14 días de práctica sostenida.',
    lore: 'Dos semanas donde demostraste que hay lugar para este hábito.',
  },
  {
    id: 'streak_21',
    name: 'Hábito Consolidado',
    emoji: '🌿',
    minStreak: 21,
    category: 'streak',
    description: '21 días seguidos. Tu hábito echó raíces.',
    lore: 'El umbral clásico de la neuroplasticidad. Ya no es esfuerzo ajeno.',
  },
  {
    id: 'streak_30',
    name: 'Mes Imparable',
    emoji: '🌙',
    minStreak: 30,
    category: 'streak',
    description: '30 días de presencia constante.',
    lore: 'Cruzaste todo un ciclo mensual cuidando tu compromiso.',
  },
  {
    id: 'streak_50',
    name: 'Mitad de Cien',
    emoji: '⭐',
    minStreak: 50,
    category: 'streak',
    description: '50 días acumulados.',
    lore: 'La constancia tranquila se convirtió en tu estándar.',
  },
  {
    id: 'streak_100',
    name: 'Centenario Dorado',
    emoji: '👑',
    minStreak: 100,
    category: 'streak',
    description: '100 días ininterrumpidos.',
    lore: 'Un monumento personal a tu paciencia y resiliencia.',
  },
  {
    id: 'shield_resilient',
    name: 'Guardián Resiliente',
    emoji: '🛡️',
    category: 'special',
    description: 'Cuidaste tu camino usando un escudo con consciencia.',
    lore: 'Caerse y levantarse con amabilidad es la verdadera maestría.',
  },
  {
    id: 'anchor_graduated',
    name: 'Ancla Eterna',
    emoji: '🌳',
    category: 'lifecycle',
    description: 'Graduado después de meses de práctica.',
    lore: 'Ya no necesitás tildarlo: es parte inseparable de quién sos.',
  },
];
