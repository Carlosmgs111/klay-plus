# Unified ConfigStore Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make ConfigStore the single source of truth for credentials in both browser and server runtimes, with NeDB persistence on server and API routes bridging UI to server-side store.

**Architecture:** Add NeDBConfigStore to core (mirrors IndexedDBConfigStore pattern using NeDBStore). Expose server-side ConfigStore via Astro API routes. Update pipeline-singleton to create and use NeDBConfigStore. Unify SettingsPage to work identically in both modes.

**Tech Stack:** TypeScript, NeDB (nedb-promises), Astro API routes, React, Vitest

---

### Task 1: Add `entries()` method to NeDBStore

**Files:**
- Modify: `packages/core/src/platform/persistence/nedb/NeDBStore.ts:54-58`

**Step 1: Write the implementation**

Add after the `getAll()` method (line 58):

```typescript
async entries(): Promise<[string, T][]> {
  const db = await this.ensureDB();
  const docs = await db.find({});
  return docs.map((doc: any) => [doc._key as string, doc._value as T]);
}
```

**Step 2: Verify existing tests still pass**

Run: `pnpm --filter @klay/core test`
Expected: All tests pass (NeDBStore isn't directly tested, but downstream repos use it)

**Step 3: Commit**

```bash
git add packages/core/src/platform/persistence/nedb/NeDBStore.ts
git commit -m "feat(core): add entries() method to NeDBStore"
```

---

### Task 2: Create NeDBConfigStore

**Files:**
- Create: `packages/core/src/platform/config/NeDBConfigStore.ts`
- Modify: `packages/core/src/platform/config/index.ts:5` (add export)

**Step 1: Write the failing test**

Add a new describe block at the end of `packages/core/src/platform/config/__tests__/ConfigStore.test.ts`:

```typescript
describe("NeDBConfigStore", () => {
  it("starts empty", async () => {
    const { NeDBConfigStore } = await import("../NeDBConfigStore");
    const store = new NeDBConfigStore(); // in-memory (no filename)
    expect(await store.loadAll()).toEqual({});
  });

  it("set and loadAll round-trips", async () => {
    const { NeDBConfigStore } = await import("../NeDBConfigStore");
    const store = new NeDBConfigStore();
    await store.set("OPENAI_API_KEY", "sk-test");
    await store.set("COHERE_API_KEY", "co-test");
    expect(await store.loadAll()).toEqual({
      OPENAI_API_KEY: "sk-test",
      COHERE_API_KEY: "co-test",
    });
  });

  it("get returns value for existing key", async () => {
    const { NeDBConfigStore } = await import("../NeDBConfigStore");
    const store = new NeDBConfigStore();
    await store.set("KEY", "value");
    expect(await store.get("KEY")).toBe("value");
  });

  it("get returns undefined for missing key", async () => {
    const { NeDBConfigStore } = await import("../NeDBConfigStore");
    const store = new NeDBConfigStore();
    expect(await store.get("MISSING")).toBeUndefined();
  });

  it("remove deletes a key", async () => {
    const { NeDBConfigStore } = await import("../NeDBConfigStore");
    const store = new NeDBConfigStore();
    await store.set("A", "1");
    await store.set("B", "2");
    await store.remove("A");
    expect(await store.loadAll()).toEqual({ B: "2" });
  });

  it("has returns true for existing keys", async () => {
    const { NeDBConfigStore } = await import("../NeDBConfigStore");
    const store = new NeDBConfigStore();
    await store.set("X", "y");
    expect(await store.has("X")).toBe(true);
    expect(await store.has("MISSING")).toBe(false);
  });

  it("set overwrites existing value", async () => {
    const { NeDBConfigStore } = await import("../NeDBConfigStore");
    const store = new NeDBConfigStore();
    await store.set("K", "old");
    await store.set("K", "new");
    expect(await store.get("K")).toBe("new");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/ConfigStore.test.ts`
Expected: FAIL — cannot resolve `../NeDBConfigStore`

**Step 3: Write the implementation**

Create `packages/core/src/platform/config/NeDBConfigStore.ts`:

```typescript
import type { ConfigStore } from "./ConfigStore";
import { NeDBStore } from "../persistence/nedb/NeDBStore";

/**
 * Server-side ConfigStore backed by NeDB.
 * Persists configuration (API keys, URIs, credentials) to a local file.
 */
export class NeDBConfigStore implements ConfigStore {
  private readonly store: NeDBStore<string>;

  constructor(dbPath?: string) {
    const filename = dbPath ? `${dbPath}/config.db` : undefined;
    this.store = new NeDBStore<string>(filename);
  }

  async get(key: string): Promise<string | undefined> {
    return this.store.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.store.put(key, value);
  }

  async remove(key: string): Promise<void> {
    await this.store.remove(key);
  }

  async loadAll(): Promise<Record<string, string>> {
    const pairs = await this.store.entries();
    return Object.fromEntries(pairs);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }
}
```

**Step 4: Add export to index.ts**

In `packages/core/src/platform/config/index.ts`, add after line 5 (`IndexedDBConfigStore` export):

```typescript
export { NeDBConfigStore } from "./NeDBConfigStore";
```

**Step 5: Run tests to verify they pass**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/ConfigStore.test.ts`
Expected: All tests pass (InMemoryConfigStore + resolveConfigProvider + NeDBConfigStore)

**Step 6: Commit**

```bash
git add packages/core/src/platform/config/NeDBConfigStore.ts packages/core/src/platform/config/__tests__/ConfigStore.test.ts packages/core/src/platform/config/index.ts
git commit -m "feat(core): add NeDBConfigStore for server-side credential persistence"
```

---

### Task 3: Update resolveConfigProvider for server + configStore

Currently `resolveConfigProvider` falls through to `NodeConfigProvider` when provider is server and no configStore is given. With this change, **if configStore is provided, it's used regardless of provider** (the current code already does this — configStore check is before the browser/server check). The only change needed is in `resolveConfigProvider` to **also hydrate from NodeConfigProvider** as fallback values when configStore is used in server mode, so bootstrap env vars (KLAY_DB_PATH etc.) still work.

**Files:**
- Modify: `packages/core/src/platform/config/resolveConfigProvider.ts`
- Modify: `packages/core/src/platform/config/__tests__/ConfigStore.test.ts`

**Step 1: Write the failing test**

Add to the `resolveConfigProvider with configStore` describe block:

```typescript
it("server mode with configStore uses store values", async () => {
  const store = new InMemoryConfigStore({ OPENAI_API_KEY: "sk-from-store" });
  const provider = await resolveConfigProvider({
    provider: "server",
    configStore: store,
  });

  expect(provider.get("OPENAI_API_KEY")).toBe("sk-from-store");
});
```

**Step 2: Run test to verify it passes (it already should!)**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/ConfigStore.test.ts`
Expected: PASS — the current code already handles configStore before the provider check.

This confirms that the resolver already works correctly. No code change needed to `resolveConfigProvider.ts` — the priority chain is:
1. `configOverrides` → InMemoryConfigProvider
2. `configStore` → InMemoryConfigProvider(loadAll()) — **this already handles server+configStore**
3. `provider === "browser"` → InMemoryConfigProvider({})
4. fallback → NodeConfigProvider

**Step 3: Commit**

```bash
git add packages/core/src/platform/config/__tests__/ConfigStore.test.ts
git commit -m "test(core): verify resolveConfigProvider works with server + configStore"
```

---

### Task 4: Update pipeline-singleton to use NeDBConfigStore

**Files:**
- Modify: `apps/web/src/server/pipeline-singleton.ts`

**Step 1: Rewrite pipeline-singleton**

Replace the full contents of `apps/web/src/server/pipeline-singleton.ts`:

```typescript
import {
  KnowledgePipelineRESTAdapter,
  KnowledgeManagementRESTAdapter,
  KnowledgeLifecycleRESTAdapter,
} from "@klay/core/adapters/rest";
import { createKnowledgePlatform } from "@klay/core";
import type { ConfigStore } from "@klay/core/config";

interface ServerAdapters {
  pipeline: KnowledgePipelineRESTAdapter;
  management: KnowledgeManagementRESTAdapter;
  lifecycle: KnowledgeLifecycleRESTAdapter;
}

let _adaptersPromise: Promise<ServerAdapters> | null = null;
let _configStore: ConfigStore | null = null;

const DB_PATH = process.env.KLAY_DB_PATH ?? "./data";

/**
 * Returns the server-side ConfigStore (NeDB-backed).
 * Lazily created on first access; reused across all routes.
 */
export async function getConfigStore(): Promise<ConfigStore> {
  if (!_configStore) {
    const { NeDBConfigStore } = await import("@klay/core/config");
    _configStore = new NeDBConfigStore(DB_PATH);
  }
  return _configStore;
}

/**
 * Returns the singleton server adapters (pipeline, management, lifecycle).
 * Creates the full platform once, seeds a default processing profile, and reuses it.
 */
function _getAdapters(): Promise<ServerAdapters> {
  if (!_adaptersPromise) {
    _adaptersPromise = _createAdapters();
  }
  return _adaptersPromise;
}

async function _createAdapters(): Promise<ServerAdapters> {
  const configStore = await getConfigStore();

  const platform = await createKnowledgePlatform({
    provider: "server",
    dbPath: DB_PATH,
    configStore,
    defaultChunkingStrategy: process.env.KLAY_CHUNKING_STRATEGY ?? "recursive",
  });

  // Seed default processing profile (ignore if already exists)
  await platform.pipeline.createProcessingProfile({
    id: "default",
    name: "Default",
    chunkingStrategyId: "recursive",
    embeddingStrategyId: "hash-embedding",
  });

  return {
    pipeline: new KnowledgePipelineRESTAdapter(platform.pipeline),
    management: new KnowledgeManagementRESTAdapter(platform.management),
    lifecycle: new KnowledgeLifecycleRESTAdapter(platform.lifecycle),
  };
}

/**
 * Invalidate the singleton so it re-creates with fresh ConfigStore values.
 * Called after config changes (API key updates, profile changes).
 */
export function invalidateAdapters(): void {
  _adaptersPromise = null;
}

export async function getServerAdapter(): Promise<KnowledgePipelineRESTAdapter> {
  const adapters = await _getAdapters();
  return adapters.pipeline;
}

export async function getManagementAdapter(): Promise<KnowledgeManagementRESTAdapter> {
  const adapters = await _getAdapters();
  return adapters.management;
}

export async function getLifecycleAdapter(): Promise<KnowledgeLifecycleRESTAdapter> {
  const adapters = await _getAdapters();
  return adapters.lifecycle;
}
```

Key changes:
- Creates `NeDBConfigStore` with `DB_PATH` and passes it to `createKnowledgePlatform` as `configStore`
- Removes `embeddingDimensions`, `embeddingProvider`, `embeddingModel` from env vars — these come from ConfigStore now
- Exposes `getConfigStore()` for API routes to read/write
- Adds `invalidateAdapters()` for re-creation after config changes

**Step 2: Verify build**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds (may warn about missing keys at runtime, which is fine)

**Step 3: Commit**

```bash
git add apps/web/src/server/pipeline-singleton.ts
git commit -m "feat(web): use NeDBConfigStore in server pipeline singleton"
```

---

### Task 5: Create config API routes

**Files:**
- Create: `apps/web/src/pages/api/config.ts`

**Step 1: Write the API route**

Create `apps/web/src/pages/api/config.ts`:

```typescript
import type { APIRoute } from "astro";
import { getConfigStore, invalidateAdapters } from "../../server/pipeline-singleton";

/**
 * GET /api/config — Load all config key-value pairs.
 * Returns: { [key: string]: string }
 */
export const GET: APIRoute = async () => {
  const store = await getConfigStore();
  const all = await store.loadAll();
  return new Response(JSON.stringify(all), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * PUT /api/config — Set one or more config keys.
 * Body: { entries: Record<string, string>, reinitialize?: boolean }
 */
export const PUT: APIRoute = async ({ request }) => {
  const { entries, reinitialize = false } = (await request.json()) as {
    entries: Record<string, string>;
    reinitialize?: boolean;
  };

  const store = await getConfigStore();
  for (const [key, value] of Object.entries(entries)) {
    if (value) {
      await store.set(key, value);
    } else {
      await store.remove(key);
    }
  }

  if (reinitialize) {
    invalidateAdapters();
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * DELETE /api/config — Remove a config key.
 * Body: { key: string }
 */
export const DELETE: APIRoute = async ({ request }) => {
  const { key } = (await request.json()) as { key: string };
  const store = await getConfigStore();
  await store.remove(key);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

**Step 2: Verify build**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/web/src/pages/api/config.ts
git commit -m "feat(web): add /api/config routes for server-side credential management"
```

---

### Task 6: Create ServerConfigService for UI to call API routes

**Files:**
- Create: `apps/web/src/services/server-config-service.ts`

The SettingsPage needs a way to read/write config in server mode. Instead of calling ConfigStore directly (which is server-only), it calls the API routes. We create a thin wrapper that implements the same interface the UI needs.

**Step 1: Write the service**

Create `apps/web/src/services/server-config-service.ts`:

```typescript
import type { ConfigStore } from "@klay/core/config";

/**
 * ConfigStore-like interface that proxies to /api/config routes.
 * Used by SettingsPage in server mode to read/write credentials.
 */
export class ServerConfigService implements ConfigStore {
  async get(key: string): Promise<string | undefined> {
    const all = await this.loadAll();
    return all[key];
  }

  async set(key: string, value: string): Promise<void> {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: { [key]: value } }),
    });
  }

  async remove(key: string): Promise<void> {
    await fetch("/api/config", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  }

  async loadAll(): Promise<Record<string, string>> {
    const res = await fetch("/api/config");
    return res.json();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /**
   * Batch-save entries and optionally reinitialize the server pipeline.
   */
  async saveAndReinitialize(entries: Record<string, string>): Promise<void> {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, reinitialize: true }),
    });
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/src/services/server-config-service.ts
git commit -m "feat(web): add ServerConfigService proxy for /api/config routes"
```

---

### Task 7: Update RuntimeModeContext to provide ConfigStore in server mode

**Files:**
- Modify: `apps/web/src/contexts/RuntimeModeContext.tsx`

Currently server mode sets `configStore: null`. We need to provide a `ServerConfigService` instance so the SettingsPage can use it.

**Step 1: Modify the server mode branch**

In `RuntimeModeContext.tsx`, in the `useEffect` block for `mode === "server"` (around line 101-119):

Change:
```typescript
if (mode === "server") {
  // Resolve a default profile for server so the UI can show infra settings
  if (!profileRef.current) {
    const { resolveInfrastructureProfile } = await import("@klay/core/config");
    const profile = await resolveInfrastructureProfile({ provider: "server" });
    profileRef.current = profile;
  }

  const [{ ServerPipelineService }, { ServerLifecycleService }] =
    await Promise.all([
      import("../services/server-pipeline-service"),
      import("../services/server-lifecycle-service"),
    ]);
  if (!cancelled) {
    setInfrastructureProfileState(profileRef.current);
    setService(new ServerPipelineService());
    setLifecycleService(new ServerLifecycleService());
    setConfigStore(null);
  }
}
```

To:
```typescript
if (mode === "server") {
  // Create or reuse server config service (proxies to /api/config)
  let store = configStoreRef.current;
  if (!store) {
    const { ServerConfigService } = await import("../services/server-config-service");
    store = new ServerConfigService();
    configStoreRef.current = store;
  }

  // Resolve infrastructure profile from server-side ConfigStore
  if (!profileRef.current) {
    const { resolveInfrastructureProfile } = await import("@klay/core/config");
    const profile = await resolveInfrastructureProfile({
      provider: "server",
      configStore: store,
    });
    profileRef.current = profile;
  }

  const [{ ServerPipelineService }, { ServerLifecycleService }] =
    await Promise.all([
      import("../services/server-pipeline-service"),
      import("../services/server-lifecycle-service"),
    ]);
  if (!cancelled) {
    setConfigStore(store);
    setInfrastructureProfileState(profileRef.current);
    setService(new ServerPipelineService());
    setLifecycleService(new ServerLifecycleService());
  }
}
```

Also update `setMode` to reset `configStoreRef` when switching modes (line 88-93):

```typescript
const setMode = (newMode: RuntimeMode) => {
  profileRef.current = null;
  configStoreRef.current = null; // Reset store so it resolves for new runtime
  setModeState(newMode);
  localStorage.setItem(STORAGE_KEY, newMode);
};
```

**Step 2: Verify dev server runs**

Run: `pnpm --filter @klay/web dev`
Navigate to Settings page. In server mode, the infrastructure profile and API keys sections should now load values from the server ConfigStore.

**Step 3: Commit**

```bash
git add apps/web/src/contexts/RuntimeModeContext.tsx
git commit -m "feat(web): provide ConfigStore in server mode via ServerConfigService"
```

---

### Task 8: Update SettingsPage for unified credential management

**Files:**
- Modify: `apps/web/src/components/features/settings/SettingsPage.tsx`

The SettingsPage already works with `configStore` from context. The main change is removing the server-mode-specific messaging and ensuring `handleSaveKeys` calls `invalidateAdapters` on the server via the API.

**Step 1: Update the API keys section text**

In `SettingsPage.tsx` around line 324-329, change:

```typescript
<p className="text-xs text-tertiary">
  {isServerMode
    ? "In server mode, API keys are resolved from environment variables. Values entered here are stored locally for browser mode."
    : activeRequirements.length > 0
      ? "Configure API keys required by the current embedding provider. Keys are stored in IndexedDB and never sent to any server."
      : "No API keys required for the current configuration."}
</p>
```

To:

```typescript
<p className="text-xs text-tertiary">
  {activeRequirements.length > 0
    ? isServerMode
      ? "Configure API keys required by the current infrastructure profile. Keys are persisted on the server."
      : "Configure API keys required by the current infrastructure profile. Keys are stored locally in IndexedDB."
    : "No API keys required for the current configuration."}
</p>
```

**Step 2: Update handleSaveKeys to reinitialize server**

In `SettingsPage.tsx`, update `handleSaveKeys` (around line 108-131) to use batch save in server mode:

```typescript
const handleSaveKeys = async () => {
  if (!configStore) return;
  setIsSavingKeys(true);
  try {
    // Save profile if changed
    if (localProfile) {
      await setInfrastructureProfile(localProfile);
    }

    // Build entries map
    const entries: Record<string, string> = {};
    for (const req of activeRequirements) {
      entries[req.key] = apiKeyValues[req.key] ?? "";
    }

    if (isServerMode && "saveAndReinitialize" in configStore) {
      // Server mode: batch save + reinitialize pipeline in one call
      await (configStore as any).saveAndReinitialize(entries);
    } else {
      // Browser mode: save individually to ConfigStore
      for (const [key, value] of Object.entries(entries)) {
        if (value) {
          await configStore.set(key, value);
        } else {
          await configStore.remove(key);
        }
      }
    }

    reinitialize();
    addToast("Settings saved. Services reinitializing...", "success");
  } finally {
    setIsSavingKeys(false);
  }
};
```

**Step 3: Verify dev server runs and both modes work**

Run: `pnpm --filter @klay/web dev`
1. Switch to server mode → Settings should show infra profile + API key fields → Save should persist to NeDB
2. Switch to browser mode → Same fields → Save should persist to IndexedDB

**Step 4: Commit**

```bash
git add apps/web/src/components/features/settings/SettingsPage.tsx
git commit -m "feat(web): unify SettingsPage credential management for both runtimes"
```

---

### Task 9: Run full test suite and verify build

**Files:** None (verification only)

**Step 1: Run core tests**

Run: `pnpm --filter @klay/core test`
Expected: All tests pass

**Step 2: Run production build**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds

**Step 3: Manual smoke test**

Run: `pnpm --filter @klay/web dev`
1. Server mode: Settings → set an API key → Save → verify it persists after page refresh
2. Browser mode: Settings → set an API key → Save → verify it persists after page refresh
3. Switch between modes → verify each mode has its own credential store

---

### Task 10: Clean up legacy env var references

**Files:**
- Possibly modify: `apps/web/src/server/pipeline-singleton.ts` (verify no remaining embedding env vars)
- Review: any other `process.env.KLAY_EMBEDDING_*` references in web layer

**Step 1: Search for stale env var references**

Search for: `process.env.KLAY_EMBEDDING` and `process.env.OPENAI_API_KEY` across the codebase.

**Step 2: Remove any remaining hardcoded env var reads for credentials**

Any `process.env.OPENAI_API_KEY`, `process.env.COHERE_API_KEY`, etc. in web layer should be removed — credentials now come from ConfigStore.

Keep `process.env.KLAY_DB_PATH` and `process.env.KLAY_CHUNKING_STRATEGY` — these are bootstrap config, not credentials.

**Step 3: Commit**

```bash
git commit -m "chore(web): remove legacy env var references for credentials"
```
