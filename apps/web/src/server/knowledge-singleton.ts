import { createKnowledgeApplication } from "@klay/core";
import type { KnowledgeApplication } from "@klay/core";
import type { ConfigStore } from "@klay/core/config";
import { resolveInfrastructureProfile } from "@klay/core/config";
import { InMemorySecretStore } from "@klay/core/secrets";

let _coordinatorPromise: Promise<KnowledgeApplication> | null = null;
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

function _getCoordinator(): Promise<KnowledgeApplication> {
  if (!_coordinatorPromise) {
    _coordinatorPromise = _createCoordinator();
  }
  return _coordinatorPromise;
}

async function _createCoordinator(): Promise<KnowledgeApplication> {
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

  const app = await createKnowledgeApplication({
    provider: "server",
    dbPath: DB_PATH,
    configStore,
    secretStore,
    defaultChunkingStrategy: process.env.KLAY_CHUNKING_STRATEGY ?? "recursive",
    infrastructure,
  });

  // Seed default processing profile (ignore result — may already exist)
  await app.semanticProcessing.createProcessingProfile.execute({
    id: "default",
    name: "Default",
    preparation: { strategyId: "basic", config: {} },
    fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
    projection: { strategyId: "hash-embedding", config: {} },
  });

  return app;
}

/**
 * Invalidate the singleton so it re-creates with fresh ConfigStore values.
 * Called after config changes (API key updates, profile changes).
 */
export function invalidateAdapters(): void {
  _coordinatorPromise = null;
}

export async function getCoordinator(): Promise<KnowledgeApplication> {
  return _getCoordinator();
}

/** @deprecated Use `getCoordinator()` instead. */
export const getAdapter = getCoordinator;
/** @deprecated Use `getCoordinator()` instead. */
export const getServerAdapter = getCoordinator;
/** @deprecated Use `getCoordinator()` instead. */
export const getLifecycleAdapter = getCoordinator;
