export { SemanticProjection } from "./SemanticProjection.js";
export { ProjectionId } from "./ProjectionId.js";
export { ProjectionType } from "./ProjectionType.js";
export { ProjectionStatus } from "./ProjectionStatus.js";
export { ProjectionResult } from "./ProjectionResult.js";
export type { SemanticProjectionRepository } from "./SemanticProjectionRepository.js";

export type {
  EmbeddingStrategy,
  EmbeddingResult,
  ChunkingStrategy,
  Chunk,
  VectorStoreAdapter,
  VectorEntry,
  VectorSearchResult,
} from "./ports/index.js";

export { ProjectionGenerated } from "./events/ProjectionGenerated.js";
export { ProjectionFailed } from "./events/ProjectionFailed.js";
