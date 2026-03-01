# @klay/web — Astro Dashboard

Astro SSR (`@astrojs/node`) + React (`client:load`) + TailwindCSS.

## Commands

```bash
pnpm --filter @klay/web dev     # Start dev server
pnpm --filter @klay/web build   # Production build (broken — exports ref removed file)
```

## Structure

```
src/
  pages/          # 7 pages: index (redirect), dashboard, documents, knowledge, search, profiles, settings
  pages/api/      # 7 API routes under pipeline/
  components/     # React components (use client:load for interactivity)
  services/       # PipelineService interface → ServerPipelineService | BrowserPipelineService
  contexts/       # RuntimeModeContext (server/browser toggle)
```

## Key Patterns

- `RuntimeModeContext` — React context for server/browser mode toggle
- `PipelineService` interface with dual implementations (Server: fetch API routes, Browser: direct `@klay/core` import)
- `usePipelineAction<T>` hook — manages loading/success/error states for pipeline operations
- `ssr.noExternal: ["@klay/core"]` in `astro.config.ts` — Vite bundles and transpiles @klay/core .ts source directly

## Gotchas

- Build fails: `package.json` exports reference `./src/application/knowledge-pipeline.ts` which no longer exists
- Always use `client:load` for React interactive components
- API routes proxy to `@klay/core` services in server mode only
