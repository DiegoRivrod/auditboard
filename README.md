<h1 align="center">AuditBoard</h1>

<p align="center">
  <a href="https://auditboard.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-auditboard.vercel.app-black?style=for-the-badge&logo=vercel" alt="Live Demo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-2-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Chart.js-4-FF6384?style=flat-square&logo=chartdotjs&logoColor=white" />
</p>

<p align="center">
  A production-grade <strong>audit observation management system</strong> built with React and Supabase — featuring a Kanban workflow, analytics dashboard, role-based access control, and an immutable audit trail.
</p>

---

## Overview

AuditBoard digitizes the audit observation lifecycle in manufacturing environments. Quality auditors create non-conformities and findings; responsible area teams track their progress; quality supervisors verify closure — all in one place, with a full tamper-proof change history.

| Capability | Details |
|---|---|
| Kanban Workflow | 5-stage pipeline from open to closed |
| Analytics | Charts by severity, type, area, and status |
| Access Control | Area-based permissions (Quality team vs. others) |
| Audit Trail | Every change is recorded as an immutable log entry |
| Demo Mode | Live demo with pre-loaded data, no writes persisted |

---

## Live Demo

**URL:** [auditboard.vercel.app](https://auditboard.vercel.app)

```
Email:    demo@auditboard.app
Password: demo2026
```

> Demo credentials provide read-only access with pre-loaded fictional data. No real data is stored or modified.

---

## Features

### Kanban Board
The main interface shows all active audit observations across five workflow stages:

```
Sin Fecha  →  Fecha Comprometida  →  En Ejecución  →  En Verificación  →  Levantada
 (Open)          (Scheduled)           (In Progress)      (Under Review)      (Closed)
```

- Create observations with auto-generated codes (`OBS-YYYY-NNN`)
- Filter by free text and responsible area
- Slide-in detail panel for inline editing
- Cascading area → sub-area dropdowns

### Analytics Dashboard
- **Observations by severity** — Critical / Major / Minor breakdown
- **By type** — Structure, machinery, product, documentation, safety, housekeeping
- **By area** — Color-coded department breakdown
- **Status distribution** — Progress across the five Kanban stages

### Role-Based Access Control
| Action | Quality (CALIDAD) | Other Areas |
|---|---|---|
| Edit title, description, required action | ✅ | ❌ |
| Edit severity, type, location | ✅ | ❌ |
| Assign responsible area | ✅ | ❌ |
| Update status & progress | ✅ | ✅ |
| Add comments | ✅ | ✅ |
| Set commitment dates | ✅ | ✅ |
| Delete observations | ✅ | ❌ |

### Immutable Audit Trail
Every state change, comment, date update, and progress increment is recorded to an `actualizaciones` table. This log is append-only, surfaced inside the detail panel, and cannot be edited.

---

## Tech Stack

| Category | Technology |
|---|---|
| UI Framework | React 19, TypeScript 5.9 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4.x |
| Backend & Auth | Supabase (PostgreSQL + Row-Level Security) |
| Charts | Chart.js 4 + react-chartjs-2 |
| Notifications | React Toastify |
| Build Tool | Vite 7 |
| Deployment | Vercel |

---

## Architecture

```
Browser
  └── React SPA (Vite)
        ├── /login         → Supabase Auth (email/password)
        ├── /tablero       → Kanban board — reads/writes observaciones & actualizaciones
        └── /dashboard     → Analytics — aggregates from observaciones

Supabase (PostgreSQL)
  ├── perfiles             User profiles with role and area
  ├── areas                Departments (Quality, Production, Warehouse, Maintenance)
  ├── subareas             Sub-divisions within each area
  ├── auditorias           Audit sessions (one active at a time)
  ├── observaciones        Core entity — audit findings and non-conformities
  └── actualizaciones      Append-only change log for every observation
```

There is no API layer — components query Supabase directly through the JS client. Row-Level Security policies enforce data access at the database level.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema below

### Installation

```bash
git clone https://github.com/DiegoRivrod/auditboard.git
cd auditboard
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: enable demo mode (pre-fills login, shows banner)
VITE_DEMO_MODE=true
```

### Run Locally

```bash
npm run dev       # http://localhost:5173
npm run build     # Production build (type-checks first)
npm run preview   # Serve the production build locally
```

---

## Database Schema

The application requires the following Supabase tables. See [`supabase_rls_policies.sql`](./supabase_rls_policies.sql) for the full schema and RLS policies.

| Table | Description |
|---|---|
| `perfiles` | User profiles — name, role (`jefe/supervisor/tecnico/auditor`), area |
| `areas` | Departments with name, code, and display color |
| `subareas` | Sub-areas linked to a parent area |
| `auditorias` | Audit sessions; only one may be active at a time |
| `observaciones` | Audit observations with workflow state, severity, type, progress, and dates |
| `actualizaciones` | Append-only log entry for every change made to an observation |

---

## Observation Workflow

```
Estado field drives the Kanban column:

sin_fecha            No commitment date set yet
fecha_comprometida   Team has committed to a start date
en_ejecucion         Corrective action is underway
en_verificacion      Quality team is verifying closure
levantada            Observation is formally closed
```

**Severity levels:**

| Code | Label | Meaning |
|---|---|---|
| `critica` | No Conformidad | Critical finding, must be closed before next audit |
| `mayor` | Observación | Significant gap requiring formal corrective action |
| `menor` | Oportunidad de Mejora | Minor improvement opportunity |

---

## Project Structure

```
src/
├── pages/
│   ├── Login.tsx              # Auth page (Supabase email/password)
│   ├── Tablero.tsx            # Kanban board — main interface
│   └── Dashboard.tsx          # Analytics and charts
├── components/
│   ├── detail/
│   │   └── DetailPanel.tsx    # Slide-in observation editor
│   ├── modals/
│   │   └── NuevaObsModal.tsx  # Create new observation form
│   └── ui/
│       └── DemoBanner.tsx     # Demo mode notification banner
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── demoData.ts            # Static mock data for demo mode
│   └── demoSupabase.ts        # Demo-mode data layer (no writes)
├── types/
│   └── index.ts               # Domain model types (Observacion, Actualizacion, etc.)
├── constants.ts               # Shared UI constants (colors, styles)
└── App.tsx                    # Router and protected route logic
```

---

## Deployment

The app is deployed to Vercel. All routes are rewritten to `index.html` via `vercel.json` for SPA client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Push to `main` — Vercel deploys automatically.

---

## License

MIT
