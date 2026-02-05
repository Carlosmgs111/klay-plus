import type { EventPublisher } from "../../../shared/domain/index.js";
import { SemanticProjection } from "../domain/SemanticProjection.js";
import { ProjectionId } from "../domain/ProjectionId.js";
import { ProjectionResult } from "../domain/ProjectionResult.js";
import type { ProjectionType } from "../domain/ProjectionType.js";
import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository.js";
import type { EmbeddingStrategy } from "../domain/ports/EmbeddingStrategy.js";
import type { ChunkingStrategy } from "../domain/ports/ChunkingStrategy.js";
import type { VectorStoreAdapter, VectorEntry } from "../domain/ports/VectorStoreAdapter.js";

export interface GenerateProjectionCommand {
  projectionId: string;
  semanticUnitId: string;
  semanticUnitVersion: number;
  content: string;
  type: ProjectionType;
}

export class GenerateProjection {
  constructor(
    private readonly repository: SemanticProjectionRepository,
    private readonly embeddingStrategy: EmbeddingStrategy,
    private readonly chunkingStrategy: ChunkingStrategy,
    private readonly vectorStore: VectorStoreAdapter,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: GenerateProjectionCommand): Promise<void> {
    const projectionId = ProjectionId.create(command.projectionId);

    const projection = SemanticProjection.create(
      projectionId,
      command.semanticUnitId,
      command.semanticUnitVersion,
      command.type,
    );

    projection.markProcessing();

    try {
      const chunks = this.chunkingStrategy.chunk(command.content);
      const chunkContents = chunks.map((c) => c.content);
      const embeddings = await this.embeddingStrategy.embedBatch(chunkContents);

      const vectorEntries: VectorEntry[] = chunks.map((chunk, i) => ({
        id: `${command.semanticUnitId}-${command.semanticUnitVersion}-${chunk.index}`,
        semanticUnitId: command.semanticUnitId,
        vector: embeddings[i].vector,
        content: chunk.content,
        metadata: {
          version: command.semanticUnitVersion,
          chunkIndex: chunk.index,
          model: embeddings[i].model,
          ...chunk.metadata,
        },
      }));

      await this.vectorStore.deleteBySemanticUnitId(command.semanticUnitId);
      await this.vectorStore.upsert(vectorEntries);

      const result = ProjectionResult.create(
        command.type,
        {
          chunksCount: chunks.length,
          dimensions: embeddings[0]?.dimensions ?? 0,
          model: embeddings[0]?.model ?? "unknown",
        },
        this.embeddingStrategy.strategyId,
        this.embeddingStrategy.version,
      );

      projection.complete(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      projection.fail(message);
    }

    await this.repository.save(projection);
    await this.eventPublisher.publishAll(projection.clearEvents());
  }
}
