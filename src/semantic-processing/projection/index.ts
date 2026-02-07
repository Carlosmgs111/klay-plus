// ─── Domain ────────────────────────────────────────────────────────
export {
  SemanticProjection,
  ProjectionId,
  ProjectionType,
  ProjectionStatus,
  ProjectionResult,
  ProjectionGenerated,
  ProjectionFailed,
} from "./domain/index.js";

export type {
  SemanticProjectionRepository,
  EmbeddingStrategy,
  EmbeddingResult,
  ChunkingStrategy,
  Chunk,
  VectorStoreAdapter,
  VectorEntry,
  VectorSearchResult,
} from "./domain/index.js";

// ─── Application ───────────────────────────────────────────────────
export { GenerateProjection, ProjectionUseCases } from "./application/index.js";
export type { GenerateProjectionCommand } from "./application/index.js";

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
} from "./infrastructure/strategies/index.js";

export { InMemoryVectorStore } from "./infrastructure/adapters/InMemoryVectorStore.js";

// ─── Composition ───────────────────────────────────────────────────
export { ProjectionComposer } from "./composition/ProjectionComposer.js";
export type {
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { ProjectionInfrastructurePolicy } from "./composition/infra-policies.js";
import type { ProjectionUseCases as _UseCases } from "./application/index.js";

export async function projectionFactory(
  policy: ProjectionInfrastructurePolicy,
): Promise<_UseCases> {
  const { ProjectionComposer } = await import("./composition/ProjectionComposer.js");
  const { ProjectionUseCases } = await import("./application/index.js");
  const infra = await ProjectionComposer.resolve(policy);
  return new ProjectionUseCases(
    infra.repository,
    infra.embeddingStrategy,
    infra.chunkingStrategy,
    infra.vectorStore,
    infra.eventPublisher,
  );
}
