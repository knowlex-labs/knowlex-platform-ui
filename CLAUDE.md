# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install                              # Install all workspace dependencies
pnpm dev                                  # Run dev across all packages via Turborepo
pnpm build                                # TypeScript compile + Vite production build
pnpm lint                                 # ESLint — fails on any warning (--max-warnings 0)
pnpm --filter @knowlex/web dev            # Web (Vite, port 5173)
pnpm --filter @knowlex/mobile dev         # Mobile (Expo dev server)
pnpm --filter @knowlex/mobile ios         # Run iOS build (expo run:ios)
pnpm --filter @knowlex/mobile build:apk   # EAS preview APK build
pnpm --filter @knowlex/core type-check    # Type-check core only
```

No test framework is configured — there are no unit or integration tests.

## Domain

Legal tech SaaS platform. The core feature is a **case workspace** where lawyers manage cases, upload documents, and use AI to generate legal drafts (20+ Indian legal document templates: notices, affidavits, bail applications, writ petitions, plaints, etc.). The draft pipeline: template selection → form submission → AI generation → live preview → chat-based refinement.

## Monorepo Structure

**Tooling:** pnpm workspaces + Turborepo

```
packages/
  core/    — @knowlex/core   — platform-agnostic shared code (types, API, mappers)
  web/     — @knowlex/web    — React web application
  mobile/  — @knowlex/mobile — Expo / React Native application
```

**Stack:**
- Web: React 18 + TypeScript 5.3 + Vite 5 + Tailwind CSS 3.4 + React Router 7 + Radix UI / shadcn/ui
- Mobile: React Native 0.81 + React 19 + Expo 54 + Expo Router 6

### `packages/core` — Shared Platform-Agnostic Code

Contains types, API services, and mappers. Has **zero browser dependencies** — all platform-specific APIs (localStorage, window, document) are abstracted via adapter interfaces.

**Key pattern — Dependency Inversion:**
- `src/api/ports.ts` — defines `StorageAdapter`, `EventBusAdapter`, `EnvironmentConfig`, `FileHandlerAdapter` interfaces
- `src/api/runtime.ts` — `initCore(adapters)` / `getAdapters()` module-scoped singleton
- `src/api/auth-headers.ts` — consolidated auth header helper (single source, uses storage adapter)
- Platform consumers (web, mobile) provide adapter implementations and call `initCore()` at boot

**Directories:**
- `src/types/` — one file per domain, barrel via `index.ts`
- `src/mappers/` — backend-to-frontend data transforms
- `src/api/` — HTTP client + all domain API services

### `packages/web` — React Web Application

**Path alias:** `@/*` maps to `packages/web/src/*` — use `@/` for web-local imports, `@knowlex/core/*` for shared code.

**Adapters:** `src/adapters/` provides browser implementations of core adapter interfaces. `init-core.ts` wires them, called from `main.tsx` before React renders.

### `packages/mobile` — Expo / React Native Application

**Routing:** Expo Router (file-based) under `app/` — `(auth)` group for login/signup, `(tabs)` group for the authenticated shell (cases, documents, drafts, profile, viewer).

**Adapters:** `src/adapters/` provides RN implementations of core ports — `storage.ts` (expo-secure-store / AsyncStorage), `event-bus.ts`, `env-config.ts` (reads from `expo-constants`), `file-handler.ts` (expo-document-picker / expo-file-system), `sse-adapter.ts`. `init-core.ts` wires them at boot.

**Web-only code stays out:** never import `@/` (web alias) from mobile, and keep DOM/browser APIs out of `@knowlex/core`. Shared logic must go through the core ports.

### Import Convention

```typescript
// Shared types, API, mappers — from core
import type { Case } from '@knowlex/core/types'
import { caseApi } from '@knowlex/core/api'
import { mapBackendCase } from '@knowlex/core/mappers'

// Web-local code — from @/
import { SomeComponent } from '@/components/some-component'
```

## Architecture

### State Management

Five React Contexts (no external state library):

| Context | Responsibility |
|---|---|
| `AuthContext` | JWT auth, login/logout, session restore from localStorage |
| `AdminAuthContext` | Separate auth for admin dashboard (distinct from user auth) |
| `NavigationContext` | Active tab, selected case/client, sidebar state (persisted) |
| `ThemeContext` | Dark/light mode |
| `UIContext` | Toast notifications |

Provider nesting order in `main.tsx`: `bootstrapCore() → ThemeProvider → AuthProvider → AdminAuthProvider → UIStateProvider → RouterProvider`.

### API Layer (`packages/core/src/api/`)

- `api-client.ts` — base HTTP client: uses adapters for auth headers, event dispatching (401 → `auth:session-expired`), and environment config
- `auth-headers.ts` — consolidated `getAuthHeaders()` / `getAdminAuthHeaders()` (replaces duplicated functions)
- One service file per domain — follow existing naming when adding new endpoints

**Backend ↔ Frontend convention:** Backend uses `UPPER_CASE` enum values; `packages/core/src/mappers/` converts them to lowercase for frontend use. Never use raw API response types directly in components.

### Types (`packages/core/src/types/`)

- One file per domain (e.g., `case.types.ts`, `client.types.ts`), re-exported via barrel `index.ts`
- `api.types.ts` holds backend contract types; other files hold frontend-facing types

### Environment & Feature Flags

Configured via `EnvironmentConfig` adapter interface. Web implementation reads from Vite's `import.meta.env`:
- `VITE_API_BASE_URL` — backend API base (default `http://localhost:8080`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth
- `VITE_ENABLE_PAYMENT` — gates subscription/billing features (string `'true'` to enable)

### Custom Hooks (`packages/web/src/hooks/`)

Standard return shape: `{ data, isLoading, error, refresh, ...domainMethods }`.

**Polling pattern** (used in `use-drafts.ts` and `use-case-sources.ts`):
- Use refs (`pollingIdsRef`, `pollingIntervalRef`) to track state without re-renders
- `startPolling(id)` adds to Set, starts interval only if not already running
- Poll function removes terminal IDs, clears interval when Set is empty
- Clean up via `useEffect` return

### Case Workspace (`packages/web/src/components/cases/case-workspace/`)

The most complex feature area (~34 components) with an IDE-like interface:

- `case-workspace.tsx` — main container managing modes, panels, resizable chat
- `left-sidebar.tsx` — navigation between documents, sources, notes
- `center-panel.tsx` — main content area with tab system
- `draft-chat-panel.tsx` — right-side resizable AI assistant panel
- `draft-creation-wizard.tsx` — multi-step form for creating legal documents from templates
- `draft-preview-tab.tsx` — preview and editing of generated drafts with formatting toolbar

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

### Routing (`packages/web/src/router.tsx`)

All routes except `/`, `/login`, `/signup`, `/blogs`, and `/admin/*` are wrapped in `ProtectedLayout` (auth guard + `DashboardLayout`). Unauthenticated access redirects to `/login`. Admin routes use a separate `AdminAuthContext`.

Key protected routes: `/home` (dashboard), `/cases/:caseId` (workspace), `/ai-research`, `/clients/:clientId`, `/judgments/:judgmentId`, `/cause-lists`, `/settings/*`.

### UI Components (`packages/web/src/components/ui/`)

shadcn/ui components customized with project design tokens (not default shadcn colors). Use the `cn()` utility from `@/lib/utils` for all Tailwind class composition (clsx + tailwind-merge).

### Toolbox (`packages/web/src/components/toolbox/`)

Standalone document utility tools (compressor, converter, translator, merger, splitter). Each is a dialog wrapping a shared `FileUploadZone` component with drag-drop and imperative handle via `forwardRef`.

### Styling

Custom design tokens defined as CSS variables and surfaced through Tailwind:
- `ledger-*` — neutral scale
- `kx-primary-*` — brand colors (50–950)
- `kx-accent-*` — accent colors
- `kx-surface`, `kx-card`, `kx-text-primary/secondary`

Dark mode is class-based (`darkMode: 'class'`). Font families: Inter (sans), Playfair Display (serif), JetBrains Mono (mono).

### localStorage Keys

`auth_token`, `auth_refresh_token`, `auth_user_id`, `knowlex_sidebar_collapsed`, `knowlex_navigation_state`
