# Apilando Ando — Especificación Técnica y Modelo de Datos

> [!NOTE]
> Este documento traduce las reglas de negocio y flujos acordados en [apliando-ando-concepto.md](file:///C:\Users\Jesus\.gemini\antigravity\brain\9fb9bce2-53ec-4f4d-a9a9-64470ca24844\apliando-ando-concepto.md) a una estructura de datos robusta, tipos de TypeScript y lógica determinística.

---

## 1. Stack Tecnológico Recomendado

Dado que se trata de una app enfocada en la experiencia diaria, offline-first y mobile-friendly:
- **Frontend:** React + TypeScript (o React Native / Expo si es puramente móvil).
- **Estilos:** Tailwind CSS (diseño limpio, paletas suaves y animaciones sutiles).
- **Almacenamiento Local (Offline-first):** IndexedDB con Dexie.js o SQLite / AsyncStorage (para garantizar funcionamiento total sin internet).
- **Manejo de Estados:** Zustand (ligero, determinista, excelente para persistencia local).

---

## 2. Modelo de Entidades (TypeScript Interfaces)

### A. Entidad `Habit` (Hábito)

```typescript
export type HabitStatus = 
  | 'active'        // 🌱 En construcción (máximo 1 simultáneo)
  | 'maintenance'   // 🌿 Consolidado, en seguimiento activo
  | 'anchor'        // 🌳 Graduado (sin checkbox, solo contexto)
  | 'paused'        // ⏸️ Congelado temporalmente
  | 'archived';     // 📦 Cerrado definitivamente

export interface Habit {
  id: string;                      // UUID único
  name: string;                    // Ej: "Caminar 20 minutos"
  color: string;                   // Hex o token de color suave
  anchorText?: string;             // Ej: "Después del café mañanero"
  status: HabitStatus;             // Estado del ciclo de vida
  
  // Contadores y Rachas
  currentStreak: number;           // Días consecutivos actuales
  bestStreak: number;              // Récord histórico personal
  totalCompletedDays: number;      // Total absoluto de días cumplidos
  
  // Escudos
  shieldsAvailable: number;        // Reserva actual (inicia en 2, tope 3)
  
  // Fechas y Transiciones del Ciclo de Vida
  createdAt: string;               // ISO 8601 (ej: 2026-11-17T00:00:00Z)
  promotedToMaintenanceAt?: string;// Cuándo pasó a mantenimiento (para medir 6 meses)
  graduatedToAnchorAt?: string;    // Cuándo se graduó a ancla
  pausedAt?: string;               // Cuándo se pausó (para recordatorio a los 14 días)
  archivedAt?: string;             // Cuándo se archivó
  
  // Recompensas
  stickersUnlocked: string[];      // IDs de stickers desbloqueados en hitos
}
```

---

### B. Entidad `DailyLog` (Registro Diario)

El historial granular por día y por hábito. Permite reconstruir calendarios y verificar estados sin ambigüedad.

```typescript
export type DayStatus = 
  | 'completed'    // ✅ El usuario tildó el hábito
  | 'shielded'     // 🛡️ No lo tildó pero confirmó uso de escudo
  | 'missed'       // ❌ No lo tildó y no se protegió (racha rota)
  | 'paused';      // ⏸️ El hábito estaba en pausa ese día

export interface DailyLog {
  id: string;                      // `${habitId}_${date}`
  habitId: string;                 // Referencia a Habit
  date: string;                    // Formato YYYY-MM-DD
  status: DayStatus;
  loggedAt?: string;               // Timestamp exacto de cuando se tildó
}
```

---

### C. Entidad `ShieldConfirmationPending` (Confirmaciones Pendientes)

Controla la ventana de gracia entre medianoche y las 23:59 del día siguiente.

```typescript
export interface ShieldConfirmationPending {
  habitId: string;
  targetDate: string;              // Fecha del día que no se cumplió (YYYY-MM-DD)
  expiresAt: string;               // Timestamp ISO de las 23:59:59 del día siguiente
}
```

---

### D. Entidad `AppSettings` (Preferencias Globales)

```typescript
export interface AppSettings {
  reminderTime: string;            // Formato "HH:mm" (por defecto "20:00")
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  theme: 'warm-light' | 'warm-dark';
  lastMonthlyReviewDismissed?: string; // Formato YYYY-MM (para no repetir en el mes)
}
```

---

## 3. Máquinas de Estado y Reglas Determinísticas

### A. Regla de Oro: Solo 1 Hábito `active`
```typescript
function canCreateNewHabit(habits: Habit[]): boolean {
  const activeHabit = habits.find(h => h.status === 'active');
  return !activeHabit; // Solo se puede crear si NO hay ninguno activo
}
```

### B. Hito de los 21 Días y Graduación Mensual
```typescript
function isEligibleForNewHabit(activeHabit: Habit): boolean {
  return activeHabit.totalCompletedDays >= 21;
}
```

### C. Graduación a Ancla (6 Meses)
```typescript
function isEligibleForAnchorGraduation(habit: Habit, currentDate: Date): boolean {
  if (habit.status !== 'maintenance' || !habit.promotedToMaintenanceAt) return false;
  
  const promotedDate = new Date(habit.promotedToMaintenanceAt);
  const diffInMonths = (currentDate.getFullYear() - promotedDate.getFullYear()) * 12 + 
                       (currentDate.getMonth() - promotedDate.getMonth());
                       
  return diffInMonths >= 6;
}
```

---

## 4. Próximos Pasos de Implementación
1. Inicializar la estructura del proyecto en `c:\proyecto\apliando-ando`.
2. Crear la capa de base de datos local y stores (Zustand + LocalStorage / Dexie).
3. Construir los componentes de UI:
   - Onboarding (5 pasos secuenciales).
   - "Mi Día" con lista vertical de hábitos (`🌳`, `🌿`, `🌱`).
   - Modal bottom-sheet de confirmación de escudo.
