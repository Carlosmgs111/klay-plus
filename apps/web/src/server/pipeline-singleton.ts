import {
  KnowledgePipelineRESTAdapter,
  KnowledgeManagementRESTAdapter,
  KnowledgeLifecycleRESTAdapter,
} from "@klay/core/adapters/rest";
import { createKnowledgePlatform } from "@klay/core";

interface ServerAdapters {
  pipeline: KnowledgePipelineRESTAdapter;
  management: KnowledgeManagementRESTAdapter;
  lifecycle: KnowledgeLifecycleRESTAdapter;
}

let _adaptersPromise: Promise<ServerAdapters> | null = null;

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
  const platform = await createKnowledgePlatform({
    provider: "server",
    dbPath: process.env.KLAY_DB_PATH ?? "./data",
    embeddingDimensions: Number(process.env.KLAY_EMBEDDING_DIMENSIONS) || 128,
    embeddingProvider: process.env.KLAY_EMBEDDING_PROVIDER ?? "hash",
    embeddingModel: process.env.KLAY_EMBEDDING_MODEL,
    defaultChunkingStrategy: process.env.KLAY_CHUNKING_STRATEGY ?? "recursive",
  });

  // Seed default processing profile (ignore if already exists)
  await platform.pipeline.createProcessingProfile({
    id: "default",
    name: "Default",
    chunkingStrategyId: "recursive",
    embeddingStrategyId: "hash",
  });

  return {
    pipeline: new KnowledgePipelineRESTAdapter(platform.pipeline),
    management: new KnowledgeManagementRESTAdapter(platform.management),
    lifecycle: new KnowledgeLifecycleRESTAdapter(platform.lifecycle),
  };
}

/**
 * Returns the singleton KnowledgePipelineRESTAdapter for server-side API routes.
 * Backward-compatible — existing routes continue to use this.
 */
export async function getServerAdapter(): Promise<KnowledgePipelineRESTAdapter> {
  const adapters = await _getAdapters();
  return adapters.pipeline;
}

/**
 * Returns the singleton KnowledgeManagementRESTAdapter for server-side API routes.
 */
export async function getManagementAdapter(): Promise<KnowledgeManagementRESTAdapter> {
  const adapters = await _getAdapters();
  return adapters.management;
}

/**
 * Returns the singleton KnowledgeLifecycleRESTAdapter for server-side API routes.
 */
export async function getLifecycleAdapter(): Promise<KnowledgeLifecycleRESTAdapter> {
  const adapters = await _getAdapters();
  return adapters.lifecycle;
}
