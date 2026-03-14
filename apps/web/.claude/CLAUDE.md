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
    index.astro         # Redirect to /contexts
    dashboard.astro     # Global dashboard
    documents.astro     # Document management
    search.astro        # Global semantic search
    profiles.astro      # Processing profiles
    settings.astro      # App settings
    knowledge.astro     # Redirect to /contexts (legacy)
    contexts/
      index.astro       # Contexts list (DashboardShell)
      [id]/
        dashboard.astro   # Context overview (ContextShell)
        sources.astro     # Context sources (ContextShell)
        versions.astro    # Context versions (ContextShell)
        projections.astro # Context projections (ContextShell)
        search.astro      # Context-scoped search (ContextShell)
  pages/api/           # 21 API route files: 8 pipeline/, 12 lifecycle/, 1 config
  components/
    shared/            # Reusable UI: Button, Card, Input, FileProcessingForm, etc.
    layout/            # DashboardShell, ContextShell, ProviderStack, Header, Sidebar
    features/
      dashboard/       # DashboardPage
      documents/       # DocumentUploadForm (thin wrapper over FileProcessingForm)
      knowledge/       # Context lifecycle actions (Archive, Deprecate, Activate, etc.)
      knowledgeContext/ # Context detail pages (Dashboard, Sources, Projections, Search)
      profiles/        # ProfileFormFields (shared), CreateProfileForm, ProfileEditForm (thin wrappers)
      search/          # SearchBar, SearchPage, SearchResults
      settings/        # SettingsPage (composition), ThemeCard, RuntimeModeCard, HealthCheckCard,
                       # ArchitectureFlowCard, InfrastructureSection, ProviderForm
  services/            # PipelineService + LifecycleService interfaces + dual implementations
    server-http-client.ts  # Shared HTTP helpers (serverPost, serverGet, serverPut, encodeContentForTransport)
    server-pipeline-service.ts  # Delegates to /api/pipeline/* via server-http-client
    server-lifecycle-service.ts # Delegates to /api/lifecycle/* via server-http-client
    browser-pipeline-service.ts # Direct @klay/core import + IndexedDB
    browser-lifecycle-service.ts # Direct @klay/core import + IndexedDB
  contexts/            # RuntimeModeContext (server/browser toggle), ToastContext, ThemeContext, KnowledgeContextContext
  hooks/               # usePipelineAction, useClickOutside, useToggleAction
  server/              # pipeline-singleton.ts — shared platform instance for all server adapters
  utils/               # fileDetection.ts
```

## Two-Shell Architecture

- **DashboardShell** (`components/layout/DashboardShell.tsx`): Global pages. Uses `Sidebar` + `Header` + lazy-loaded page components. Handles: dashboard, documents, search, profiles, settings, contexts (index).
- **ContextShell** (`components/layout/ContextShell.tsx`): Context-scoped pages under `/contexts/[id]/*`. Uses `ContextSidebar` + `Header` + lazy-loaded sub-page components. Receives `contextId` and `activePage` from Astro. Handles: dashboard, sources, versions, projections, search.

Both shells share `ProviderStack` (contexts), `Header`, and `ToastContainer`.

## Key Patterns

- **RuntimeModeContext** — React context for server/browser mode toggle; initialization logic extracted into `initServerMode()` / `initBrowserMode()` pure async functions
- **ServerHttpClient** (`services/server-http-client.ts`) — shared `serverPost`, `serverPut`, `serverGet` + `encodeContentForTransport`; includes `res.ok` validation
- **PipelineService** interface with dual implementations (Server: via ServerHttpClient, Browser: direct `@klay/core` import)
- **LifecycleService** interface with dual implementations for lifecycle/management operations
- **ProfileFormFields** — shared form component for 3-layer profile config (Preparation, Fragmentation, Projection); used by `CreateProfileForm` and `ProfileEditForm` as thin wrappers
- **FileProcessingForm** — shared file upload component with phase state machine; used by `DocumentUploadForm` and `AddSourceUploadForm` as thin wrappers
- **ProviderForm** — data-driven field renderer for infrastructure provider config (text, number, select, boolean, secrets, models)
- **useClickOutside** — reusable hook for click-outside detection with `enabled` flag
- `usePipelineAction<T>` hook — manages loading/success/error states for pipeline operations
- `pipeline-singleton.ts` — lazy singleton via `createKnowledgePlatform()`, exposes `getServerAdapter()`, `getLifecycleAdapter()`, `getManagementAdapter()`
- `ssr.noExternal: ["@klay/core"]` in `astro.config.ts` — Vite bundles and transpiles @klay/core .ts source directly

## Gotchas

- Always use `client:load` for React interactive components
- API routes proxy to `@klay/core` services in server mode only
- Lifecycle routes live under `pages/api/lifecycle/`, not `pages/api/pipeline/`
- Context sub-pages use `Astro.params.id` to extract `contextId` and pass it to `ContextShell`
- Action components (AddSourceUploadForm, RemoveSourceAction, etc.) live in `features/knowledge/` but are imported by `features/knowledgeContext/` pages
- `ErrorDisplay` has optional `code` — `PageErrorDisplay` is a re-export for backward compat
- `infrastructure-helpers.ts` contains `getNestedValue`, `setNestedValue`, `normalizeProfile` — used by InfrastructureSection and ProviderForm
