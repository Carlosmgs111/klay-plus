import { GenerateProjection } from "./projection/application/GenerateProjection.js";
import { RegisterStrategy } from "./strategy-registry/application/RegisterStrategy.js";
import type { SemanticProjectionRepository } from "./projection/domain/SemanticProjectionRepository.js";
import type { ProcessingStrategyRepository } from "./strategy-registry/domain/ProcessingStrategyRepository.js";
import type { EmbeddingStrategy } from "./projection/domain/ports/EmbeddingStrategy.js";
import type { ChunkingStrategy } from "./projection/domain/ports/ChunkingStrategy.js";
import type { VectorStoreAdapter } from "./projection/domain/ports/VectorStoreAdapter.js";
import type { EventPublisher } from "../shared/domain/EventPublisher.js";

export class SemanticProcessingUseCases {
  readonly generateProjection: GenerateProjection;
  readonly registerStrategy: RegisterStrategy;

  constructor(
    projectionRepository: SemanticProjectionRepository,
    strategyRepository: ProcessingStrategyRepository,
    embeddingStrategy: EmbeddingStrategy,
    chunkingStrategy: ChunkingStrategy,
    vectorStore: VectorStoreAdapter,
    eventPublisher: EventPublisher,
  ) {
    this.generateProjection = new GenerateProjection(
      projectionRepository,
      embeddingStrategy,
      chunkingStrategy,
      vectorStore,
      eventPublisher,
    );
    this.registerStrategy = new RegisterStrategy(strategyRepository, eventPublisher);
  }
}
