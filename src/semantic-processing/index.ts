// Projection module
export {
  SemanticProjection,
  ProjectionId,
  ProjectionType,
  ProjectionStatus,
  ProjectionResult,
  ProjectionGenerated,
  ProjectionFailed,
} from "./projection/domain/index.js";

export type {
  SemanticProjectionRepository,
  EmbeddingStrategy,
  EmbeddingResult,
  ChunkingStrategy,
  Chunk,
  VectorStoreAdapter,
  VectorEntry,
  VectorSearchResult,
} from "./projection/domain/index.js";

export { GenerateProjection } from "./projection/application/index.js";
export type { GenerateProjectionCommand } from "./projection/application/index.js";

// Strategy Registry module
export {
  ProcessingStrategy,
  StrategyId,
  StrategyType,
} from "./strategy-registry/domain/index.js";

export type { ProcessingStrategyRepository } from "./strategy-registry/domain/index.js";

export { RegisterStrategy } from "./strategy-registry/application/index.js";
export type { RegisterStrategyCommand } from "./strategy-registry/application/index.js";

// ─── Infrastructure (strategies & adapters) ────────────────────────
export {
  BaseChunker,
  FixedSizeChunker,
  SentenceChunker,
  RecursiveChunker,
  ChunkerFactory,
  HashEmbeddingStrategy,
  WebLLMEmbeddingStrategy,
  AISdkEmbeddingStrategy,
} from "./projection/infrastructure/strategies/index.js";

export { InMemoryVectorStore } from "./projection/infrastructure/adapters/InMemoryVectorStore.js";

// ─── Composition ───────────────────────────────────────────────────
export { SemanticProcessingUseCases } from "./SemanticProcessingUseCases.js";
export { SemanticProcessingComposer } from "./composition/SemanticProcessingComposer.js";
export type {
  SemanticProcessingInfrastructurePolicy,
  ResolvedSemanticProcessingInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { SemanticProcessingInfrastructurePolicy } from "./composition/infra-policies.js";
import type { SemanticProcessingUseCases as _SPUseCases } from "./SemanticProcessingUseCases.js";

export async function semanticProcessingFactory(
  policy: SemanticProcessingInfrastructurePolicy,
): Promise<_SPUseCases> {
  const { SemanticProcessingComposer } = await import(
    "./composition/SemanticProcessingComposer.js"
  );
  const { SemanticProcessingUseCases } = await import(
    "./SemanticProcessingUseCases.js"
  );
  const infra = await SemanticProcessingComposer.resolve(policy);
  return new SemanticProcessingUseCases(
    infra.projectionRepository,
    infra.strategyRepository,
    infra.embeddingStrategy,
    infra.chunkingStrategy,
    infra.vectorStore,
    infra.eventPublisher,
  );
}
