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
  pages/          # 7 pages: index (redirect), dashboard, documents, knowledge, search, profiles, settings
  pages/api/      # 14 API route files: 8 under pipeline/, 6 under lifecycle/
  components/     # 40 React components (use client:load for interactivity)
  services/       # PipelineService + LifecycleService interfaces, each with Server and Browser implementations
  contexts/       # RuntimeModeContext (server/browser toggle), ToastContext, ThemeContext
  server/         # pipeline-singleton.ts — shared platform instance for all server adapters
```

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
