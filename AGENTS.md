# Directivas del Proyecto — Apliando Ando

Este archivo define las directivas globales del repositorio `apliando-ando`. Complementa a [`mobile/AGENTS.md`](./mobile/AGENTS.md) (específico de Expo/React Native).

## 1. Idioma y Tono

- **Idioma del proyecto y comunicación:** Español Latinoamericano (es-419). Evitar modismos de España.
- **Tono de la UI y copy:** Cálido, amable, realista y **sin culpa**. Nunca mostrar mensajes de castigo o fracaso ante días no completados; reforzar la constancia y la resiliencia.

## 2. Reglas de Negocio Invariables

Antes de modificar lógica de hábitos, rachas, escudos o pantallas, respetar los principios definidos en [`CONCEPTO.md`](./CONCEPTO.md) y [`ARQUITECTURA.md`](./ARQUITECTURA.md):

1. **Un solo hábito activo a la vez (`status: 'active'`):** No permitir crear un nuevo hábito en construcción mientras exista uno activo.
2. **Ciclo de vida del hábito:** `'active'` (🌱 en construcción) → `'maintenance'` (🌿 consolidado, a partir de 21 días) → `'anchor'` (🌳 graduado tras 6 meses en mantenimiento, no tildable). También existen `'paused'` (⏸️) y `'archived'` (📦).
3. **Escudos por hábito:** Cada hábito comienza con `2` escudos y tiene un tope de `3`. Son individuales por hábito (no globales).
4. **Confirmación consciente y vencimiento:** El uso de escudo requiere confirmación explícita del usuario al día siguiente; la ventana de gracia vence a las `23:59` del día siguiente.
5. **Sin registro retroactivo:** No se permite tildar días pasados manualmente (solo proteger ayer mediante escudo si aplica).
6. **Hitos y reposición:** Los hitos de racha (`7, 14, 21, 30, 50, 90, 100...` días) disparan celebración y reponen 1 escudo si el hábito tiene menos de 3.
7. **Frecuencia diaria y offline-first:** Todos los hábitos son diarios y toda la experiencia debe funcionar 100 % sin conexión usando almacenamiento local.

## 3. Estructura del Repositorio

- `/` (raíz):
  - `CONCEPTO.md`: Reglas de negocio, diseño UX y flujos funcionales.
  - `ARQUITECTURA.md`: Especificación técnica, interfaces TypeScript y máquinas de estado.
  - `prototype.html` / `index.html`: Prototipo web interactivo de referencia.
  - `netlify.toml` / `vercel.json`: Reglas de cabeceras HTTP (`Cache-Control`) para despliegue web.
- `/mobile`: Aplicación principal en **Expo (SDK ~58)** + **React Native** + **TypeScript (`strict: true`)**:
  - `App.tsx`: Punto de entrada y navegación actual basada en estado (`onboarding`, `dashboard`, `detail`) y modales. *(Nota: aunque `mobile/AGENTS.md` menciona `expo-router`, actualmente no está instalado; respetar la arquitectura vigente salvo que se solicite migrar).*
  - `public/`: Plantilla web (`index.html`), manifiesto PWA (`manifest.json`), íconos (`icons/icon-192.png`, `icons/icon-512.png`, `icons/apple-touch-icon.png`) y cabeceras (`_headers`) que Expo copia al exportar `dist/`.
  - `vercel.json`: Reglas de cabeceras HTTP cuando el despliegue apunta a `mobile/` como raíz.
  - `src/types/`: Modelos e interfaces (`habit.ts`, `stickers.ts`).
  - `src/store/habitStore.ts`: Store central con **Zustand** y persistencia en **AsyncStorage** (claves `@apliando_*`).
  - `src/screens/`: Pantallas principales (`OnboardingScreen.tsx`, `DashboardScreen.tsx`, `DetailScreen.tsx`).
  - `src/components/`: Modales y componentes de UI (`ShieldModal.tsx`, `AddHabitModal.tsx`, `ConsolidationModal.tsx`, `MilestoneCelebrationModal.tsx`, `MonthlyReviewModal.tsx`, `SettingsModal.tsx`, `StickersModal.tsx`).
  - `src/services/`: Integraciones locales (`notificationService.ts`, `hapticService.ts`).
  - `src/theme/colors.ts`: Paleta cálida y tokens visuales (`THEME`).

## 4. Convenciones de Desarrollo y Verificación

- **TypeScript estricto:** Respetar `"strict": true` en `mobile/tsconfig.json`. Mantener los tipos compartidos en `mobile/src/types/`.
- **Fuente única de verdad:** Toda mutación de hábitos, registros diarios (`DailyLog`), escudos o preferencias (`AppSettings`) debe pasar por `useHabitStore` en `mobile/src/store/habitStore.ts` para garantizar consistencia y persistencia en `AsyncStorage`.
- **Dependencias en Expo:** Usar siempre `npx expo install <paquete>` dentro de `mobile/` para garantizar compatibilidad con el SDK.
- **Verificación antes de finalizar cambios en `mobile/`:**
  ```bash
  cd mobile
  npx tsc --noEmit
  ```
- **Coherencia documental:** Si un cambio modifica reglas de negocio, estados o modelo de datos, actualizar también `CONCEPTO.md` o `ARQUITECTURA.md` según corresponda.

## 5. PWA Web, Pantalla Completa y Política de Caché

- **Instalable en pantalla completa:**
  - `mobile/public/manifest.json` define `display: "standalone"`, `short_name: "Apliando"`, colores del tema (`#FAF7F2`) e íconos PNG de `192x192` y `512x512` (`mobile/public/icons/`).
  - `mobile/public/index.html` incluye `viewport-fit=cover`, `theme-color`, `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `apple-touch-icon` (`180x180`) y `<link rel="manifest" href="/manifest.json" />`.
  - Mantener sincronizada la configuración web en `mobile/app.json` (sin duplicar `themeColor` en `app.json` para que no se inyecte dos veces junto al meta tag de `mobile/public/index.html`).
- **Política estricta contra caché vieja (sin Service Worker por ahora):**
  - **NO agregar ni registrar ningún Service Worker** (`sw.js`, Workbox, `vite-plugin-pwa`, `navigator.serviceWorker.register`, etc.) ni caché offline de assets web hasta que se indique explícitamente. Durante pruebas frecuentes en celular, el navegador no debe retener versiones viejas del HTML o del manifiesto.
  - Servir `/`, `/index.html` y `/manifest.json` con `Cache-Control: no-cache, must-revalidate` (configurado en `mobile/public/_headers`, `netlify.toml`, `mobile/vercel.json` y `vercel.json`).
  - Los bundles JS/CSS con hash en el nombre generados por Expo bajo `/_expo/static/*` sí deben servirse con caché larga inmutable (`Cache-Control: public, max-age=31536000, immutable`).

