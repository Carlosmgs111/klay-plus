import type { EventPublisher } from "../../../../shared/domain/index";
import { Result } from "../../../../shared/domain/Result";
import { SemanticProjection } from "../domain/SemanticProjection.js";
import { ProjectionId } from "../domain/ProjectionId.js";
import { ProjectionResult } from "../domain/ProjectionResult.js";
import type { ProjectionType } from "../domain/ProjectionType.js";
import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository.js";
import type { VectorWriteStore } from "../domain/ports/VectorWriteStore.js";
import type { VectorEntry } from "../../../../platform/vector/VectorEntry";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository.js";
import type { ProcessingProfileMaterializer } from "../composition/ProcessingProfileMaterializer.js";
import { ProcessingProfileId } from "../../processing-profile/domain/ProcessingProfileId.js";
import {
  ProjectionSemanticUnitIdRequiredError,
  ProjectionContentRequiredError,
  ProjectionProcessingError,
  type ProjectionError,
} from "../domain/errors/index.js";

export interface GenerateProjectionCommand {
  projectionId: string;
  semanticUnitId: string;
  semanticUnitVersion: number;
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
    // ─── Validations ────────────────────────────────────────────────────
    if (!command.semanticUnitId || command.semanticUnitId.trim() === "") {
      return Result.fail(new ProjectionSemanticUnitIdRequiredError());
    }

    if (!command.content || command.content.trim() === "") {
      return Result.fail(new ProjectionContentRequiredError());
    }

    // ─── Resolve Processing Profile ──────────────────────────────────────
    const profileId = ProcessingProfileId.create(command.processingProfileId);
    const profile = await this.profileRepository.findActiveById(profileId);

    if (!profile) {
      return Result.fail(
        new ProjectionProcessingError(
          command.semanticUnitId,
          `Processing profile '${command.processingProfileId}' not found or not active`,
          "embedding",
        ),
      );
    }

    // ─── Materialize Strategies ─────────────────────────────────────────
    const { embeddingStrategy, chunkingStrategy } =
      await this.materializer.materialize(profile);

    // ─── Create Projection ──────────────────────────────────────────────
    const projectionId = ProjectionId.create(command.projectionId);

    const projection = SemanticProjection.create(
      projectionId,
      command.semanticUnitId,
      command.semanticUnitVersion,
      command.type,
    );

    projection.markProcessing();

    try {
      // ─── Chunking ───────────────────────────────────────────────────────
      const chunks = chunkingStrategy.chunk(command.content);
      const chunkContents = chunks.map((c) => c.content);

      // ─── Embedding ──────────────────────────────────────────────────────
      const embeddings = await embeddingStrategy.embedBatch(chunkContents);

      // ─── Vector Store ───────────────────────────────────────────────────
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

      // ─── Complete Projection ────────────────────────────────────────────
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

      // ─── Persist and Publish ────────────────────────────────────────────
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
          command.semanticUnitId,
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
