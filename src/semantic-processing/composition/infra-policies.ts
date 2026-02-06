import type { SemanticProjectionRepository } from "../projection/domain/SemanticProjectionRepository.js";
import type { ProcessingStrategyRepository } from "../strategy-registry/domain/ProcessingStrategyRepository.js";
import type { EmbeddingStrategy } from "../projection/domain/ports/EmbeddingStrategy.js";
import type { ChunkingStrategy } from "../projection/domain/ports/ChunkingStrategy.js";
import type { VectorStoreAdapter } from "../projection/domain/ports/VectorStoreAdapter.js";
import type { EventPublisher } from "../../shared/domain/EventPublisher.js";

export type SemanticProcessingInfraPolicy = "in-memory" | "browser" | "server";

export interface SemanticProcessingInfrastructurePolicy {
  type: SemanticProcessingInfraPolicy;
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

export interface ResolvedSemanticProcessingInfra {
  projectionRepository: SemanticProjectionRepository;
  strategyRepository: ProcessingStrategyRepository;
  embeddingStrategy: EmbeddingStrategy;
  chunkingStrategy: ChunkingStrategy;
  vectorStore: VectorStoreAdapter;
  eventPublisher: EventPublisher;
}
