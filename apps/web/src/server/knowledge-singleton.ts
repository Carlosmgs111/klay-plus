import { createKnowledgePlatform } from "@klay/core";
import type { KnowledgePlatform } from "@klay/core";
import type { ConfigStore } from "@klay/core/config";
import { resolveInfrastructureProfile } from "@klay/core/config";
import { InMemorySecretStore } from "@klay/core/secrets";

let _coordinatorPromise: Promise<KnowledgePlatform> | null = null;
let _configStore: ConfigStore | null = null;

const DB_PATH = process.env.KLAY_DB_PATH ?? "./data";

/**
 * Returns the server-side ConfigStore (NeDB-backed).
 * Lazily created on first access; reused across all routes.
 */
export async function getConfigStore(): Promise<ConfigStore> {
  if (!_configStore) {
    const { NeDBConfigStore } = await import("@klay/core/config/nedb");
    _configStore = new NeDBConfigStore(DB_PATH);
  }
  return _configStore;
}

function _getCoordinator(): Promise<KnowledgePlatform> {
  if (!_coordinatorPromise) {
    _coordinatorPromise = _createCoordinator();
  }
  return _coordinatorPromise;
}

async function _createCoordinator(): Promise<KnowledgePlatform> {
  const configStore = await getConfigStore();

  // Create SecretStore and seed from env vars for immediate use
  const secretStore = new InMemorySecretStore();
  for (const key of ["OPENAI_API_KEY", "COHERE_API_KEY", "HUGGINGFACE_API_KEY"]) {
    const val = process.env[key] ?? import.meta.env[key];
    if (val) await secretStore.set(key, val, { category: "api-key" });
  }

  const infrastructure = await resolveInfrastructureProfile({
    provider: "server",
    configStore,
  });

  const coordinator = await createKnowledgePlatform({
    provider: "server",
    dbPath: DB_PATH,
    configStore,
    secretStore,
    defaultChunkingStrategy: process.env.KLAY_CHUNKING_STRATEGY ?? "recursive",
    infrastructure,
  });

  await coordinator.createProfile({
    id: "default",
    name: "Default",
    preparation: { strategyId: "basic", config: {} },
    fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
    projection: { strategyId: "hash-embedding", config: {} },
  });

  return coordinator;
}

/**
 * Invalidate the singleton so it re-creates with fresh ConfigStore values.
 * Called after config changes (API key updates, profile changes).
 */
export function invalidateAdapters(): void {
  _coordinatorPromise = null;
}

export async function getCoordinator(): Promise<KnowledgePlatform> {
  return _getCoordinator();
}

/** @deprecated Use `getCoordinator()` instead. */
export const getAdapter = getCoordinator;
/** @deprecated Use `getCoordinator()` instead. */
export const getServerAdapter = getCoordinator;
/** @deprecated Use `getCoordinator()` instead. */
export const getLifecycleAdapter = getCoordinator;
