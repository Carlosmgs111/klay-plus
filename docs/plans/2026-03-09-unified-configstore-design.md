# Unified ConfigStore Design

**Date:** 2026-03-09
**Branch:** feat/infrastructure-profile
**Status:** Approved

## Problem

API keys and infrastructure credentials have two disconnected flows:

- **Browser mode**: UI → IndexedDBConfigStore → ConfigProvider → Factories (works)
- **Server mode**: `.env` → `process.env` → NodeConfigProvider → Factories (no UI control)

The user cannot manage credentials from the dashboard in server mode. Additionally, the system needs to support URIs (Qdrant, pgvector) and other connection data beyond API keys.

## Decision

**Approach A: Unified ConfigStore** — extend the existing ConfigStore abstraction to server mode via NeDB persistence, bridged by API routes.

## Design

### Target Architecture

```
BROWSER:  UI → IndexedDBConfigStore → ConfigProvider → Factories
SERVER:   UI → API routes → NeDBConfigStore → ConfigProvider → Factories
```

Both runtimes use ConfigStore as the single source of truth for credentials. The UI always controls credential management.

### Core Changes (`packages/core`)

1. **`NeDBStore.entries()`** — Add missing method to return `[key, value][]` pairs (IndexedDBStore already has this)
2. **`NeDBConfigStore`** — New ConfigStore implementation backed by NeDBStore, persists to `config.db`
3. **`resolveConfigProvider`** — Server mode uses ConfigStore when available (NodeConfigProvider becomes bootstrap-only fallback)
4. **Exports** — Add NeDBConfigStore to `config/index.ts`

### Web Changes (`apps/web`)

5. **`pipeline-singleton.ts`** — Create NeDBConfigStore, pass as `configStore` to platform factory, expose getter
6. **`/api/config/` routes** — GET (loadAll), PUT (set key), DELETE (remove key) — bridge UI → server ConfigStore
7. **`SettingsPage.tsx`** — Server mode uses API routes instead of showing "keys from env vars" message

### What Stays

- `ConfigStore` interface — already correct
- `ConfigProvider` interface — still read-only
- Factories — receive ConfigProvider, agnostic to source
- `InfrastructureProfile` — persisted in ConfigStore with key `__INFRA_PROFILE__`
- `NodeConfigProvider` — kept for bootstrap config (KLAY_DB_PATH, etc.)

### Credential Flow

```
┌── BROWSER ──────────────────────────────────────┐
│ SettingsPage → configStore.set("OPENAI_API_KEY") │
│              → IndexedDBConfigStore               │
│              → resolveConfigProvider               │
│              → InMemoryConfigProvider(loadAll())   │
│              → factory.require("OPENAI_API_KEY")   │
└──────────────────────────────────────────────────┘

┌── SERVER ─────────────────────────────────────────────┐
│ SettingsPage → fetch("PUT /api/config/OPENAI_API_KEY") │
│              → NeDBConfigStore.set()                    │
│              → resolveConfigProvider                     │
│              → InMemoryConfigProvider(loadAll())         │
│              → factory.require("OPENAI_API_KEY")         │
│                                                          │
│ Bootstrap (KLAY_DB_PATH, etc.) → process.env             │
└──────────────────────────────────────────────────────────┘
```

### Security

- No encryption at rest (deferred — can be added later)
- API routes are local-only (Astro SSR, same-origin)
- Browser: credentials in IndexedDB (user-local, never sent to server)
- Server: credentials in NeDB file on disk (`config.db`)

### Out of Scope

- Encryption at rest
- Credential rotation
- Multi-user access control
- URI management UI (uses same ConfigStore — just different keys)
