# Tiny Experiments — Project Overview

A self-experimentation tracking application based on Anne-Laure Le Cunff's "Tiny Experiments" framework. Users design small, time-boxed behavioral commitments called **PACTs** (Personal, Actionable, Consistent, Time-boxed), log daily observations during the **ACT** phase, and reflect with the **REACT** framework (Plus/Minus/Next) to decide whether to persist, pause, or pivot.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI** | React 18 | Component-based UI library |
| **Build** | Vite 5 | Dev server and production bundler |
| **Styling** | Vanilla CSS | Custom CSS with CSS custom properties (variables) |
| **Backend** | Supabase | BaaS — PostgreSQL database, authentication, and Row-Level Security |
| **Auth** | Supabase Auth | Email/password and Google OAuth with PKCE flow |
| **Database** | PostgreSQL (via Supabase) | Relational data with RLS policies |
| **Icons/Fonts** | Google Fonts (Bebas Neue, Inter) | Typography |

**Dependencies** (production): `react`, `react-dom`, `@supabase/supabase-js`\
**Dev dependencies**: `vite`, `@vitejs/plugin-react`

---

## Architecture

```
index.html → src/main.jsx → App.jsx
                              ├── AuthProvider (context)
                              │   └── AuthGate
                              │       ├── Login / Register (unauthenticated)
                              │       └── ExperimentProvider (context)
                              │           └── AppShell
                              │               ├── NavBar (fixed top)
                              │               ├── Circle CTA (floating action button)
                              │               ├── Dashboard
                              │               ├── CreatePACT
                              │               │   ├── From Scratch (3-step wizard)
                              │               │   └── Templates (12 pre-built)
                              │               ├── Experiments
                              │               │   └── ExperimentCard
                              │               ├── Timeline
                              │               ├── LogModal
                              │               ├── ReflectionModal
                              │               ├── ExperimentDetailModal
                              │               └── Onboarding
```

The app is a **Single Page Application** with four sections (Dashboard, Design PACT, Experiments, Timeline) controlled by a `currentSection` state. Sections are conditionally rendered — only the active section mounts.

---

## Directory Structure

```
src/
├── main.jsx                       # ReactDOM entry point
├── App.jsx                        # Root component with AppShell
├── App.css                        # All styles (1369 lines)
├── context/
│   ├── AuthContext.jsx            # Auth state, sign in/out, Google OAuth
│   └── ExperimentContext.jsx      # Experiment CRUD, logs, reflections state
├── lib/
│   ├── supabase.js                # Supabase client initialization
│   └── experimentService.js       # Supabase data access layer
├── components/
│   ├── AuthGate.jsx               # Route guard — login or app
│   ├── UserNav.jsx                # User avatar dropdown with sign out
│   ├── Dashboard.jsx              # Stats overview + active PACTs
│   ├── CreatePACT.jsx             # PACT creation wizard + template picker
│   ├── Experiments.jsx            # PACT list grouped by status
│   ├── Timeline.jsx               # Chronological activity feed
│   ├── LogModal.jsx               # Daily logging modal
│   ├── ReflectionModal.jsx        # Plus/Minus/Next reflection modal
│   ├── ExperimentDetailModal.jsx  # Single PACT detail view
│   └── Onboarding.jsx             # 4-step intro walkthrough
├── pages/
│   ├── Login.jsx                  # Email/password + Google sign in
│   └── Register.jsx               # Email/password + Google sign up
└── utils/
    └── helpers.js                 # Constants, formatting, calculations
```

---

## Key Features

### 1. PACT Design (CreatePACT)

Users create experiments via a **3-step wizard**:

1. **Basic Info** — Title, hypothesis, category (8 options), duration (1-90 days)
2. **Triple Check** — Validates Head (specificity), Heart (genuine curiosity), Hand (feasibility)
3. **Review & Commit** — Final preview before saving

Alternatively, 12 pre-built templates from the Tiny Experiments framework are available.

### 2. Daily Logging (LogModal)

Each day users log:
- **Effort level** (low/medium/high)
- **Mood** (1-5)
- **Internal signals** — feelings, energy, resistance
- **External signals** — results, feedback, observable outcomes
- **Free-form notes**

### 3. Reflection (ReflectionModal)

At the end of an experiment's duration (or whenever ready), users complete a **REACT**:
- **Plus** — What worked?
- **Minus** — What didn't?
- **Next** — What will you change?
- **Decision** — Persist, Pause, or Pivot
- **Impact** — Optional shareable summary

### 4. Dashboard

Shows aggregate stats: active PACTs, completed, total logs, average mood, best streak. Right panel previews the 3 most recent active experiments.

### 5. Timeline

Chronological feed combining all events (PACT created, daily logs, reflections) sorted by date.

### 6. Undo Deletion

Deleting an experiment shows a toast with "Undo" for 5 seconds before permanent removal.

---

## Authentication Flow

### AuthProvider (context/AuthContext.jsx)

- **On mount**: calls `supabase.auth.getSession()` to restore existing session, subscribes to `onAuthStateChange`
- **Email/password**: `signIn()` / `signUp()` via Supabase Auth
- **Google OAuth**: `signInWithGoogle()` uses `signInWithOAuth` with `skipBrowserRedirect: true`, then manually sets `window.location.href` to the returned OAuth URL
- **Hash cleanup**: On `SIGNED_IN`, removes OAuth tokens from URL via `window.history.replaceState`
- **signOut**: Calls `supabase.auth.signOut()` which clears local storage and revokes the session server-side, then sets `user` to `null`

### AuthGate (components/AuthGate.jsx)

Conditional rendering: if `loading` → spinner; if no `user` → Login/Register pages; if authenticated → app content.

### RLS Policies

Database-level security ensures users can only CRUD their own experiments/logs/reflections. Public experiments are readable by anyone.

---

## Database Schema (PostgreSQL)

### `profiles`
| Column | Type |
|--------|------|
| id | UUID (PK, references auth.users) |
| email | TEXT |
| display_name | TEXT |
| created_at | TIMESTAMPTZ |

Auto-created by trigger `on_auth_user_created` after signup.

### `experiments`
| Column | Type |
|--------|------|
| id | UUID (PK, default gen_random_uuid()) |
| user_id | UUID (FK → profiles, NOT NULL) |
| title | TEXT (NOT NULL) |
| hypothesis | TEXT |
| duration | INTEGER (1-365) |
| category | TEXT |
| status | TEXT (active/paused/completed) |
| is_public | BOOLEAN |
| created_at, updated_at | TIMESTAMPTZ |

### `experiment_logs`
| Column | Type |
|--------|------|
| id | UUID (PK) |
| experiment_id | UUID (FK → experiments) |
| date | DATE |
| effort | TEXT (low/medium/high) |
| mood | INTEGER (1-5) |
| internal | TEXT |
| external | TEXT |
| note | TEXT |

### `reflections`
| Column | Type |
|--------|------|
| id | UUID (PK) |
| experiment_id | UUID (FK → experiments) |
| plus | TEXT |
| minus | TEXT |
| next_ | TEXT |
| decision | TEXT (persist/pause/pivot) |
| impact | TEXT |
| date | DATE |

---

## Data Flow

### State Management

Uses React Context + `useReducer`:

- **AuthContext** — Simple `useState` for user + loading
- **ExperimentContext** — `useReducer` with localStorage persistence (offline fallback) + Supabase sync

### Experiment Reducer Actions

| Action | Description |
|--------|-------------|
| `SET_EXPERIMENTS` | Replace all experiments (from Supabase or localStorage) |
| `ADD_EXPERIMENT` | Add new experiment |
| `UPDATE_EXPERIMENT` | Update fields (used for status changes) |
| `ADD_LOG` | Append log to experiment's logs array |
| `SET_REFLECTION` | Set reflection on experiment |
| `SOFT_DELETE` | Remove from state + show undo toast |
| `RESTORE_EXPERIMENT` | Undo soft delete |
| `HARD_DELETE` | Expire undo toast after 5s timeout |

### Loading Strategy

1. Authenticated user → fetch from Supabase via `experimentService`
2. No user (offline/anonymous) → load from `localStorage`
3. If Supabase fetch fails → fallback to localStorage

---

## Styling

- **Dark theme** using CSS custom properties (`--bg-dark: #1a1a2e`, `--bg-darker: #0f0f1a`, etc.)
- **Accent system**: lime, mint, coral, gold, purple, blue, orange, pink
- **Two fonts**: Bebas Neue (display/headings) + Inter (body text)
- **Responsive**: `@media (max-width: 768px)` breakpoint with hamburger menu, full-width layouts, stacked navigation
- **Safe areas**: `@supports (padding-top: env(safe-area-inset-top))` for notched devices
- **Touch devices**: `@media (hover: none)` to disable hover states, enable active states

---

## Design Decisions

1. **No routing library** — The app has 4 sections controlled by state, not URL routes. No SPA router needed for this scope.
2. **Vanilla CSS** — No CSS framework or components library. Keeps the bundle small and the dark theme fully custom.
3. **localStorage fallback** — Enables offline use and a seamless experience when Supabase is unavailable.
4. **Optimistic updates** — The UI updates immediately; Supabase syncs in the background.
5. **Undo pattern** — Soft delete with 5s undo window prevents accidental data loss.
6. **PKCE OAuth flow** — More secure than implicit flow; no tokens in URL after `replaceState` cleanup.
7. **`skipBrowserRedirect: true` + manual redirect** — Avoids popup blockers and inconsistent SDK auto-redirect behavior across browsers.

---

## Running the Project

```bash
node scripts/dev.js    # Copies source to /tmp and starts Vite dev server
npm run build          # Production build to dist/
npm run preview        # Preview production build
```

**Required**: `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
