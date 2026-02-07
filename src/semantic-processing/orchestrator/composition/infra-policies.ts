import type { ProjectionInfrastructurePolicy } from "../../projection/composition/infra-policies.js";
import type { StrategyRegistryInfrastructurePolicy } from "../../strategy-registry/composition/infra-policies.js";
import type { ProjectionUseCases } from "../../projection/application/index.js";
import type { StrategyRegistryUseCases } from "../../strategy-registry/application/index.js";
import type { VectorStoreAdapter } from "../../projection/domain/ports/VectorStoreAdapter.js";

// ─── Orchestrator Policy ──────────────────────────────────────────────────────

export type SemanticProcessingInfraPolicy = "in-memory" | "browser" | "server";

export interface SemanticProcessingOrchestratorPolicy {
  type: SemanticProcessingInfraPolicy;
  /**
   * Database path for server-side persistence (NeDB).
   * @default "./data"
   */
  dbPath?: string;
  /**
   * Database name for browser-side persistence (IndexedDB).
   * @default "semantic-processing"
   */
  dbName?: string;
  /**
   * Embedding dimensions for vector generation.
   * @default 128
   */
  embeddingDimensions?: number;
  /**
   * AI SDK model ID for server-side embeddings.
   * @example "openai:text-embedding-3-small"
   */
  aiSdkModelId?: string;
  /**
   * Default chunking strategy type.
   * @default "recursive"
   */
  defaultChunkingStrategy?: "fixed-size" | "sentence" | "recursive";
  /**
   * Override policies for individual modules.
   * If not provided, modules inherit from the orchestrator's type.
   */
  overrides?: {
    projection?: Partial<ProjectionInfrastructurePolicy>;
    strategyRegistry?: Partial<StrategyRegistryInfrastructurePolicy>;
  };
}

// ─── Resolved Modules ─────────────────────────────────────────────────────────

export interface ResolvedSemanticProcessingModules {
  projection: ProjectionUseCases;
  strategyRegistry: StrategyRegistryUseCases;
  /**
   * Exposed vector store for cross-context wiring.
   * The knowledge-retrieval context needs this to query vectors.
   */
  vectorStore: VectorStoreAdapter;
}
