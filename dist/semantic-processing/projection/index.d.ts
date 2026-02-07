export { SemanticProjection, ProjectionId, ProjectionType, ProjectionStatus, ProjectionResult, ProjectionGenerated, ProjectionFailed, } from "./domain/index.js";
export type { SemanticProjectionRepository, EmbeddingStrategy, EmbeddingResult, ChunkingStrategy, Chunk, VectorStoreAdapter, VectorEntry, VectorSearchResult, } from "./domain/index.js";
export { GenerateProjection, ProjectionUseCases } from "./application/index.js";
export type { GenerateProjectionCommand } from "./application/index.js";
export { BaseChunker, FixedSizeChunker, SentenceChunker, RecursiveChunker, ChunkerFactory, HashEmbeddingStrategy, WebLLMEmbeddingStrategy, AISdkEmbeddingStrategy, } from "./infrastructure/strategies/index.js";
export { InMemoryVectorStore } from "./infrastructure/adapters/InMemoryVectorStore.js";
export { ProjectionComposer } from "./composition/ProjectionComposer.js";
export type { ProjectionInfrastructurePolicy, ResolvedProjectionInfra, } from "./composition/infra-policies.js";
import type { ProjectionInfrastructurePolicy } from "./composition/infra-policies.js";
import type { ProjectionUseCases as _UseCases } from "./application/index.js";
export declare function projectionFactory(policy: ProjectionInfrastructurePolicy): Promise<_UseCases>;
//# sourceMappingURL=index.d.ts.map