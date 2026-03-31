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
- `/dashboard` — Analytics and charts

### Data Flow
All database access goes through the Supabase client at `src/lib/supabase.ts`. There is no API layer — components query Supabase directly. TanStack Query is installed but not yet used; data fetching is done with `useEffect` + `useState`.

### Core Domain Types (`src/types/index.ts`)
- `Observacion` — the central entity; has estado, severidad, tipo, progress %, dates, area/subarea, and links to the active audit
- `Actualizacion` — immutable audit log rows written on every change (state transitions, comments, progress updates)
- `EstadoObservacion` enum drives column order: `sin_fecha → fecha_comprometida → en_ejecucion → en_verificacion → levantada`

### Key Components
| File | Responsibility |
|------|----------------|
| `src/pages/Tablero.tsx` | Kanban board; drag-and-drop via @dnd-kit; fetches observations, areas, active audit |
| `src/pages/Dashboard.tsx` | Analytics using Chart.js / react-chartjs-2 and Recharts; custom stacked-bar plugins |
| `src/components/DetailPanel.tsx` | Slide-in panel for viewing/editing an observation; writes to both `observaciones` and `actualizaciones` tables |
| `src/components/NuevaObsModal.tsx` | Create-observation modal; auto-generates code `OBS-YYYY-NNN`; cascading area → subarea dropdowns |

### Permissions
Users with `area.codigo === 'CALIDAD'` have full edit rights. Other areas can update estado/progress/dates/comments only. Role field (`jefe | supervisor | tecnico | auditor`) exists on `Perfil` but is secondary to the area check.

### Supabase Tables
`perfiles`, `areas`, `subareas`, `auditorias`, `observaciones`, `actualizaciones`

### Styling
Tailwind CSS 4.x with four custom area colors defined in `tailwind.config.js`: `calidad` (#c0392b), `produccion` (#1a6fb5), `almacen` (#d97706), `mantenimiento` (#16a34a). Most pages also use some inline styles.

### Deployment
Deployed to Vercel. `vercel.json` rewrites all routes to `index.html` for SPA support.

### Environment Variables
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in `.env.local` (not committed).
