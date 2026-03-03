import type { EventPublisher } from "../../../../shared/domain";
import { Result } from "../../../../shared/domain/Result";
import { SemanticProjection } from "../domain/SemanticProjection";
import { ProjectionId } from "../domain/ProjectionId";
import { ProjectionResult } from "../domain/ProjectionResult";
import type { ProjectionType } from "../domain/ProjectionType";
import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository";
import type { VectorWriteStore } from "../domain/ports/VectorWriteStore";
import type { VectorEntry } from "../../../../platform/vector/VectorEntry";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository";
import type { ProcessingProfileMaterializer } from "../composition/ProcessingProfileMaterializer";
import { ProcessingProfileId } from "../../processing-profile/domain/ProcessingProfileId";
import {
  ProjectionSourceIdRequiredError,
  ProjectionContentRequiredError,
  ProjectionProcessingError,
  type ProjectionError,
} from "../domain/errors";

export interface GenerateProjectionCommand {
  projectionId: string;
  sourceId: string;
  content: string;
  type: ProjectionType;
  processingProfileId: string;
}

export interface GenerateProjectionResult {
  projectionId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

export class GenerateProjection {
  constructor(
    private readonly repository: SemanticProjectionRepository,
    private readonly profileRepository: ProcessingProfileRepository,
    private readonly materializer: ProcessingProfileMaterializer,
    private readonly vectorStore: VectorWriteStore,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(
    command: GenerateProjectionCommand,
  ): Promise<Result<ProjectionError, GenerateProjectionResult>> {
    if (!command.sourceId || command.sourceId.trim() === "") {
      return Result.fail(new ProjectionSourceIdRequiredError());
    }

    if (!command.content || command.content.trim() === "") {
      return Result.fail(new ProjectionContentRequiredError());
    }

    const profileId = ProcessingProfileId.create(command.processingProfileId);
    const profile = await this.profileRepository.findActiveById(profileId);

    if (!profile) {
      return Result.fail(
        new ProjectionProcessingError(
          command.sourceId,
          `Processing profile '${command.processingProfileId}' not found or not active`,
          "embedding",
        ),
      );
    }

    const { embeddingStrategy, chunkingStrategy } =
      await this.materializer.materialize(profile);

    const projectionId = ProjectionId.create(command.projectionId);

    const projection = SemanticProjection.create(
      projectionId,
      command.sourceId,
      command.processingProfileId,
      command.type,
    );

    projection.markProcessing();

    try {
      const chunks = chunkingStrategy.chunk(command.content);
      const chunkContents = chunks.map((c) => c.content);

      const embeddings = await embeddingStrategy.embedBatch(chunkContents);

      const vectorEntries: VectorEntry[] = chunks.map((chunk, i) => ({
        id: `${command.sourceId}-${command.projectionId}-${chunk.index}`,
        // TODO: rename to sourceId when VectorEntry is updated (Phase 4)
        semanticUnitId: command.sourceId,
        vector: embeddings[i].vector,
        content: chunk.content,
        metadata: {
          chunkIndex: chunk.index,
          model: embeddings[i].model,
          projectionId: command.projectionId,
          processingProfileId: command.processingProfileId,
          sourceId: command.sourceId,
          ...chunk.metadata,
        },
      }));

      await this.vectorStore.deleteByProjectionId(command.projectionId);
      await this.vectorStore.upsert(vectorEntries);

      const result = ProjectionResult.create(
        command.type,
        {
          chunksCount: chunks.length,
          dimensions: embeddings[0]?.dimensions ?? 0,
          model: embeddings[0]?.model ?? "unknown",
        },
        profile.id.value,
        profile.version,
      );

      projection.complete(result);

      await this.repository.save(projection);
      await this.eventPublisher.publishAll(projection.clearEvents());

      return Result.ok({
        projectionId: command.projectionId,
        chunksCount: chunks.length,
        dimensions: embeddings[0]?.dimensions ?? 0,
        model: embeddings[0]?.model ?? "unknown",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // Determine the phase where error occurred
      const phase = this.determineErrorPhase(error);

      projection.fail(message);

      await this.repository.save(projection);
      await this.eventPublisher.publishAll(projection.clearEvents());

      return Result.fail(
        new ProjectionProcessingError(
          command.sourceId,
          message,
          phase,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  private determineErrorPhase(error: unknown): "chunking" | "embedding" | "storage" {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("chunk")) return "chunking";
    if (message.includes("embed") || message.includes("vector")) return "embedding";
    if (message.includes("store") || message.includes("database")) return "storage";

    return "embedding"; // Default to embedding as most common
  }
}
