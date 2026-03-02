# @klay/web — Astro Dashboard

Astro SSR (`@astrojs/node`) + React (`client:load`) + TailwindCSS.

## Commands

```bash
pnpm --filter @klay/web dev     # Start dev server
pnpm --filter @klay/web build   # Production build
```

## Structure

```
src/
  pages/              # 13 Astro pages total
    index.astro         # Redirect to /units
    dashboard.astro     # Global dashboard
    documents.astro     # Document management
    search.astro        # Global semantic search
    profiles.astro      # Processing profiles
    settings.astro      # App settings
    knowledge.astro     # Redirect to /units (legacy)
    units/
      index.astro       # Units list (UnitsIndexPage via DashboardShell)
      [id]/
        dashboard.astro   # Unit overview (UnitShell)
        sources.astro     # Unit sources (UnitShell)
        versions.astro    # Unit versions (UnitShell)
        projections.astro # Unit projections (UnitShell)
        search.astro      # Unit-scoped search (UnitShell)
  pages/api/           # 14 API route files: 8 under pipeline/, 6 under lifecycle/
  components/          # 45 React components (use client:load for interactivity)
  services/            # PipelineService + LifecycleService interfaces, each with Server and Browser implementations
  contexts/            # RuntimeModeContext (server/browser toggle), ToastContext, ThemeContext
  server/              # pipeline-singleton.ts — shared platform instance for all server adapters
```

## Two-Shell Architecture

- **DashboardShell** (`components/layout/DashboardShell.tsx`): Global pages. Uses `Sidebar` + `Header` + lazy-loaded page components. Handles: dashboard, documents, search, profiles, settings, units (index).
- **UnitShell** (`components/layout/UnitShell.tsx`): Unit-scoped pages under `/units/[id]/*`. Uses `UnitSidebar` + `Header` + lazy-loaded unit sub-page components. Receives `unitId` and `activePage` from Astro. Handles: dashboard, sources, versions, projections, search.

Both shells share `ProviderStack` (contexts), `Header`, and `ToastContainer`.

## Key Patterns

- `RuntimeModeContext` — React context for server/browser mode toggle, provides both PipelineService and LifecycleService
- `PipelineService` interface with dual implementations (Server: fetch API routes, Browser: direct `@klay/core` import)
- `LifecycleService` interface with dual implementations for lifecycle/management operations
- `usePipelineAction<T>` hook — manages loading/success/error states for pipeline operations
- `pipeline-singleton.ts` — lazy singleton via `createKnowledgePlatform()`, exposes `getServerAdapter()`, `getLifecycleAdapter()`, `getManagementAdapter()`
- `ssr.noExternal: ["@klay/core"]` in `astro.config.ts` — Vite bundles and transpiles @klay/core .ts source directly

## Gotchas

- Always use `client:load` for React interactive components
- API routes proxy to `@klay/core` services in server mode only
- Lifecycle routes live under `pages/api/lifecycle/`, not `pages/api/pipeline/`
- Unit sub-pages use `Astro.params.id` to extract `unitId` and pass it to `UnitShell`
- Action components (AddSourceForm, RemoveSourceAction, etc.) live in `features/knowledge/` but are imported by `features/units/` pages
