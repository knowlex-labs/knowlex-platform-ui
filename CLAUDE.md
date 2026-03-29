# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # TypeScript compile + Vite production build
npm run lint      # ESLint — fails on any warning (--max-warnings 0)
npm run preview   # Preview production build
```

No test framework is configured — there are no unit or integration tests.

## Domain

Legal tech SaaS platform. The core feature is a **case workspace** where lawyers manage cases, upload documents, and use AI to generate legal drafts (20+ Indian legal document templates: notices, affidavits, bail applications, writ petitions, plaints, etc.). The draft pipeline: template selection → form submission → AI generation → live preview → chat-based refinement.

## Architecture

**Stack:** React 18 + TypeScript 5.3 + Vite 5 + Tailwind CSS 3.4 + React Router 7 + Radix UI / shadcn/ui

**Path alias:** `@/*` maps to `src/*` — always use `@/` imports, never relative paths.

### State Management

Five React Contexts (no external state library):

| Context | Responsibility |
|---|---|
| `AuthContext` | JWT auth, login/logout, session restore from localStorage |
| `AdminAuthContext` | Separate auth for admin dashboard (distinct from user auth) |
| `NavigationContext` | Active tab, selected case/client, sidebar state (persisted) |
| `ThemeContext` | Dark/light mode |
| `UIContext` | Toast notifications |

Provider nesting order in `main.tsx`: `ThemeProvider → AuthProvider → AdminAuthProvider → UIStateProvider → RouterProvider`.

### API Layer (`src/services/api/`)

- `api-client.ts` — base HTTP client: injects `Authorization: Bearer {token}` and `x-user-id` headers, emits `auth:session-expired` event on 401
- Individual service files per domain: `auth-api.ts`, `case-api.ts`, `client-api.ts`, `workspace-api.ts`, `drafts-api.ts`, `draft-chat-api.ts`, `judgments-api.ts`, `research-api.ts`, `case-sources.ts`, `summary-api.ts`, `cause-list-api.ts`, `blog-api.ts`, `subscription-api.ts`, `user-api.ts`, `dashboard-api.ts`
- Base URL from `src/config/env.ts` → `VITE_API_BASE_URL` (fallback: `http://localhost:8080`)

**Backend ↔ Frontend convention:** Backend uses `UPPER_CASE` enum values; `src/services/mappers/` converts them to lowercase for frontend use.

### Environment & Feature Flags (`src/config/env.ts`)

- `VITE_API_BASE_URL` — backend API base (default `http://localhost:8080`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth
- `VITE_ENABLE_PAYMENT` — gates subscription/billing features (string `'true'` to enable)

### Custom Hooks (`src/hooks/`)

Standard return shape: `{ data, isLoading, error, refresh, ...domainMethods }`.

**Polling pattern** (used in `use-drafts.ts` and `use-case-sources.ts`):
- Use refs (`pollingIdsRef`, `pollingIntervalRef`) to track state without re-renders
- `startPolling(id)` adds to Set, starts interval only if not already running
- Poll function removes terminal IDs, clears interval when Set is empty
- Clean up via `useEffect` return

### Case Workspace (`src/components/cases/case-workspace/`)

The most complex feature area (~34 components) with an IDE-like interface:

- `case-workspace.tsx` — main container managing modes, panels, resizable chat
- `left-sidebar.tsx` — navigation between documents, sources, notes
- `center-panel.tsx` — main content area with tab system (`workspace-tab-bar.tsx`, managed by `use-workspace-tabs.ts`)
- `draft-chat-panel.tsx` — right-side resizable AI assistant panel
- `draft-creation-wizard.tsx` — multi-step form for creating legal documents from templates
- `draft-preview-tab.tsx` — preview and editing of generated drafts with formatting toolbar
- `template-form-modal.tsx` — form for template-based document generation

### Draft System

- Create: `POST /api/v1/cases/{caseId}/drafts` → returns `{ id, job_id }` — use `id` for all subsequent requests
- Placeholder pattern: insert `pending-${Date.now()}` entry immediately, replace with real `id` after POST responds
- Status: `'pending' | 'completed' | 'failed'` (normalized from backend's `'processing'`)
- Batch autosave: dirty draft IDs tracked in a ref, flushed every 30 seconds

### Document Upload Flow

1. `POST /api/v1/documents/upload-url` → presigned S3 URL
2. PUT to S3 directly (no auth header)
3. `POST /api/v1/documents` — register document
4. Poll `GET /api/v1/documents/{id}/indexing-status` every 3 s until `INDEXED` or `INDEXING_FAILED`

### Routing (`src/router.tsx`)

All routes except `/`, `/login`, `/signup`, `/blogs`, and `/admin/*` are wrapped in `ProtectedLayout` (auth guard + `DashboardLayout`). Unauthenticated access redirects to `/login`. Admin routes use a separate `AdminAuthContext`.

Key protected routes: `/home` (dashboard), `/cases/:caseId` (workspace), `/ai-research`, `/clients/:clientId`, `/judgments/:judgmentId`, `/cause-lists`, `/settings/*`.

### Styling

Custom design tokens defined as CSS variables and surfaced through Tailwind:
- `ledger-*` — neutral scale
- `kx-primary-*` — brand colors (50–950)
- `kx-accent-*` — accent colors
- `kx-surface`, `kx-card`, `kx-text-primary/secondary`

Dark mode is class-based (`darkMode: 'class'`). Font families: Inter (sans), Playfair Display (serif), JetBrains Mono (mono).

### localStorage Keys

`auth_token`, `auth_refresh_token`, `auth_user_id`, `knowlex_sidebar_collapsed`, `knowlex_navigation_state`
