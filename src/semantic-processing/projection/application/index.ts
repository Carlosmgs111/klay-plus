import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository.js";
import type { EmbeddingStrategy } from "../domain/ports/EmbeddingStrategy.js";
import type { ChunkingStrategy } from "../domain/ports/ChunkingStrategy.js";
import type { VectorStoreAdapter } from "../domain/ports/VectorStoreAdapter.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { GenerateProjection } from "./GenerateProjection.js";
export type { GenerateProjectionCommand } from "./GenerateProjection.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { GenerateProjection } from "./GenerateProjection.js";

export class ProjectionUseCases {
  readonly generateProjection: GenerateProjection;

  constructor(
    repository: SemanticProjectionRepository,
    embeddingStrategy: EmbeddingStrategy,
    chunkingStrategy: ChunkingStrategy,
    vectorStore: VectorStoreAdapter,
    eventPublisher: EventPublisher,
  ) {
    this.generateProjection = new GenerateProjection(
      repository,
      embeddingStrategy,
      chunkingStrategy,
      vectorStore,
      eventPublisher,
    );
  }
}
