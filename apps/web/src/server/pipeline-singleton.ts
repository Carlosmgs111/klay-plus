import {
  KnowledgePipelineRESTAdapter,
  KnowledgeManagementRESTAdapter,
  KnowledgeLifecycleRESTAdapter,
} from "@klay/core/adapters/rest";
import { createKnowledgePlatform } from "@klay/core";
import type { ConfigStore } from "@klay/core/config";
import { InMemorySecretStore } from "@klay/core/secrets";

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
    const { NeDBConfigStore } = await import("@klay/core/config/nedb");
    _configStore = new NeDBConfigStore(DB_PATH);
  }
  return _configStore;
}

function _getAdapters(): Promise<ServerAdapters> {
  if (!_adaptersPromise) {
    _adaptersPromise = _createAdapters();
  }
  return _adaptersPromise;
}

async function _createAdapters(): Promise<ServerAdapters> {
  const configStore = await getConfigStore();

  // Create SecretStore and seed from env vars for immediate use
  const secretStore = new InMemorySecretStore();
  for (const key of ["OPENAI_API_KEY", "COHERE_API_KEY", "HUGGINGFACE_API_KEY"]) {
    const val = process.env[key] ?? import.meta.env[key];
    if (val) await secretStore.set(key, val, { category: "api-key" });
  }

  const platform = await createKnowledgePlatform({
    provider: "server",
    dbPath: DB_PATH,
    configStore,
    secretStore,
    defaultChunkingStrategy: process.env.KLAY_CHUNKING_STRATEGY ?? "recursive",
  });

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
