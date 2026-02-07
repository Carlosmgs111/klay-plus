import type { EventPublisher } from "../../../shared/domain/index.js";
import type { ProjectionType } from "../domain/ProjectionType.js";
import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository.js";
import type { EmbeddingStrategy } from "../domain/ports/EmbeddingStrategy.js";
import type { ChunkingStrategy } from "../domain/ports/ChunkingStrategy.js";
import type { VectorStoreAdapter } from "../domain/ports/VectorStoreAdapter.js";
export interface GenerateProjectionCommand {
    projectionId: string;
    semanticUnitId: string;
    semanticUnitVersion: number;
    content: string;
    type: ProjectionType;
}
export declare class GenerateProjection {
    private readonly repository;
    private readonly embeddingStrategy;
    private readonly chunkingStrategy;
    private readonly vectorStore;
    private readonly eventPublisher;
    constructor(repository: SemanticProjectionRepository, embeddingStrategy: EmbeddingStrategy, chunkingStrategy: ChunkingStrategy, vectorStore: VectorStoreAdapter, eventPublisher: EventPublisher);
    execute(command: GenerateProjectionCommand): Promise<void>;
}
//# sourceMappingURL=GenerateProjection.d.ts.map