import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository.js";
import type { EmbeddingStrategy } from "../domain/ports/EmbeddingStrategy.js";
import type { ChunkingStrategy } from "../domain/ports/ChunkingStrategy.js";
import type { VectorStoreAdapter } from "../domain/ports/VectorStoreAdapter.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";
export type ProjectionInfraPolicy = "in-memory" | "browser" | "server";
export interface ProjectionInfrastructurePolicy {
    type: ProjectionInfraPolicy;
    dbPath?: string;
    dbName?: string;
    /** Chunking strategy ID from ChunkerFactory. Defaults to "recursive". */
    chunkingStrategyId?: string;
    /** Dimensions for hash embeddings (in-memory only). Defaults to 128. */
    embeddingDimensions?: number;
    /** WebLLM model ID (browser only). */
    webLLMModelId?: string;
    /** Pre-configured AI SDK embedding model (server only). */
    aiSdkEmbeddingModel?: any;
}
export interface ResolvedProjectionInfra {
    repository: SemanticProjectionRepository;
    embeddingStrategy: EmbeddingStrategy;
    chunkingStrategy: ChunkingStrategy;
    vectorStore: VectorStoreAdapter;
    eventPublisher: EventPublisher;
}
//# sourceMappingURL=infra-policies.d.ts.map