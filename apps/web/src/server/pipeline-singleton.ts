import { KnowledgePipelineRESTAdapter } from "@klay/core/adapters/rest";
import { createKnowledgePipeline } from "@klay/core";

let _adapterPromise: Promise<KnowledgePipelineRESTAdapter> | null = null;

/**
 * Returns a singleton KnowledgePipelineRESTAdapter for server-side API routes.
 * Creates the pipeline once, seeds a default processing profile, and reuses it.
 */
export function getServerAdapter(): Promise<KnowledgePipelineRESTAdapter> {
  if (!_adapterPromise) {
    _adapterPromise = _createAdapter();
  }
  return _adapterPromise;
}

async function _createAdapter(): Promise<KnowledgePipelineRESTAdapter> {
  const pipeline = await createKnowledgePipeline({
    provider: "server",
    dbPath: process.env.KLAY_DB_PATH ?? "./data",
    embeddingDimensions: Number(process.env.KLAY_EMBEDDING_DIMENSIONS) || 128,
    embeddingProvider: process.env.KLAY_EMBEDDING_PROVIDER ?? "hash",
    embeddingModel: process.env.KLAY_EMBEDDING_MODEL,
    defaultChunkingStrategy: process.env.KLAY_CHUNKING_STRATEGY ?? "recursive",
  });

  // Seed default processing profile (ignore if already exists)
  await pipeline.createProcessingProfile({
    id: "default",
    name: "Default",
    chunkingStrategyId: "recursive",
    embeddingStrategyId: "hash",
  });

  return new KnowledgePipelineRESTAdapter(pipeline);
}
