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
