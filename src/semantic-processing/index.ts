// ═══════════════════════════════════════════════════════════════════════════
// Projection Module
// ═══════════════════════════════════════════════════════════════════════════
export {
  SemanticProjection,
  ProjectionId,
  ProjectionType,
  ProjectionStatus,
  ProjectionResult,
  ProjectionGenerated,
  ProjectionFailed,
  ProjectionUseCases,
  ProjectionComposer,
  GenerateProjection,
  BaseChunker,
  FixedSizeChunker,
  SentenceChunker,
  RecursiveChunker,
  ChunkerFactory,
  HashEmbeddingStrategy,
  WebLLMEmbeddingStrategy,
  AISdkEmbeddingStrategy,
  InMemoryVectorStore,
  projectionFactory,
} from "./projection/index.js";

export type {
  SemanticProjectionRepository,
  EmbeddingStrategy,
  EmbeddingResult,
  ChunkingStrategy,
  Chunk,
  VectorStoreAdapter,
  VectorEntry,
  VectorSearchResult,
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
  GenerateProjectionCommand,
} from "./projection/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// Strategy Registry Module
// ═══════════════════════════════════════════════════════════════════════════
export {
  ProcessingStrategy,
  StrategyId,
  StrategyType,
  StrategyRegistryUseCases,
  StrategyRegistryComposer,
  RegisterStrategy,
  strategyRegistryFactory,
} from "./strategy-registry/index.js";

export type {
  ProcessingStrategyRepository,
  StrategyRegistryInfrastructurePolicy,
  ResolvedStrategyRegistryInfra,
  RegisterStrategyCommand,
} from "./strategy-registry/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// Orchestrator Module
// ═══════════════════════════════════════════════════════════════════════════
export {
  SemanticProcessingOrchestrator,
  SemanticProcessingOrchestratorComposer,
  semanticProcessingOrchestratorFactory,
} from "./orchestrator/index.js";

export type {
  SemanticProcessingOrchestratorPolicy,
  SemanticProcessingInfraPolicy,
  ResolvedSemanticProcessingModules,
} from "./orchestrator/index.js";
