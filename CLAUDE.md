# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Type-check with tsc -b, then bundle with Vite
npm run lint       # Run ESLint across all source files
npm run preview    # Serve the production build locally
```

## Architecture

**AuditBoard** is a React + TypeScript SPA for managing audit observations (non-conformities, findings) through a Kanban-style workflow. Backend is Supabase (Postgres + Auth).

### Routing (`src/App.tsx`)
- `/login` — Email/password auth via Supabase
- `/tablero` — Main Kanban board (default after login)
- `/dashboard` — Analytics and charts (gated by `auditorias.activa = true`)

A global `AuthListener` subscribes to `supabase.auth.onAuthStateChange` and forces a redirect to `/login` on `SIGNED_OUT`.

### Data Flow
All database access goes through the Supabase client at `src/lib/supabase.ts`. Components query Supabase directly with `useEffect` + `useState`; there is no API layer and no client cache library.

### Demo Mode
Set `VITE_DEMO_MODE=true` in `.env.local` to swap the real Supabase client for the mock at `src/lib/demoSupabase.ts`. The mock returns fixtures from `src/lib/demoData.ts` (30 observations across 4 areas). Demo mode hides the "Nueva Observación" button and destructive actions.

### Core Domain Types (`src/types/index.ts`)
- `Observacion` — the central entity; has estado, severidad, tipo, progress %, dates, area/subarea, and links to the active audit
- `Actualizacion` — immutable audit log; the `tipo` field is computed in DetailPanel based on what actually changed (`cierre | cambio_estado | avance | comentario | fecha_comprometida`)
- `EstadoObservacion` enum drives column order: `sin_fecha → fecha_comprometida → en_ejecucion → en_verificacion → levantada`

### Key Components
| File | Responsibility |
|------|----------------|
| `src/pages/Tablero.tsx` | Kanban board (no drag-and-drop; state changes via DetailPanel). Fetches observations, areas, active audit |
| `src/pages/Dashboard.tsx` | Analytics using Chart.js / react-chartjs-2; custom stacked-bar plugins. Filters by active audit. All datasets memoized |
| `src/components/detail/DetailPanel.tsx` | Slide-in panel for viewing/editing an observation; writes to `observaciones` and `actualizaciones` |
| `src/components/modals/NuevaObsModal.tsx` | Create-observation modal; uses RPC `generar_codigo_observacion` (atomic) and cascading area → subarea dropdowns |

### Permissions
Users with `area.codigo === 'CALIDAD'` have full edit rights. Other areas can update estado/progress/dates/comments only. RLS at the DB level mirrors this contract (see `supabase_rls_policies.sql`).

**Known gap**: the UPDATE RLS for `observaciones` is at the row level, not per-column. A non-Calidad user with the same `area_responsable_id` could technically update any column via direct API. The UI is the only enforcement of the column subset. Tighten with a BEFORE UPDATE trigger if exposed beyond trusted internal users.

### Supabase Tables and RPCs
- Tables: `perfiles`, `areas`, `subareas`, `auditorias`, `observaciones`, `actualizaciones`
- RPC `generar_codigo_observacion()`: atomic generator for `OBS-YYYY-NNN` codes (uses advisory lock). Defined in `supabase_rls_policies.sql`.

### Styling
All inline styles. No CSS framework. The four "area colors" are constants in `src/constants.ts` (`COLORES_AREA`).
- Tablero uses a light theme
- Dashboard uses a dark theme with custom Chart.js plugins for stacked-bar totals/percentages
- Toasts via `react-toastify`; the `ToastContainer` is mounted globally in `App.tsx`

### Deployment
Deployed to Vercel. `vercel.json` rewrites all routes to `index.html` for SPA support.

### Environment Variables
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in `.env.local` (not committed). Optional: `VITE_DEMO_MODE=true` to use fixtures instead of Supabase. Centralized in `src/lib/env.ts`.

### Notifications (pending)
The original modal hardcoded an email and called a `rapid-task` Edge Function. That code was removed during the QC audit fix. Notifying area leads on new observations is a TODO — requires either an `email` column on `perfiles` or an RPC reading `auth.users`.
