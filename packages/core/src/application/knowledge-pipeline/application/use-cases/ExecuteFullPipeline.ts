import type { SourceIngestionService } from "../../../../contexts/source-ingestion/service/SourceIngestionService";
import type { SemanticProcessingService } from "../../../../contexts/semantic-processing/service/SemanticProcessingService";
import type { SourceKnowledgeService } from "../../../../contexts/source-knowledge/service/SourceKnowledgeService";
import type { ContextManagementService } from "../../../../contexts/context-management/service/ContextManagementService";
import type { SourceType } from "../../../../contexts/source-ingestion/source/domain/SourceType";
import type { ProjectionType } from "../../../../contexts/semantic-processing/projection/domain/ProjectionType";
import type { ExecutePipelineInput, ExecutePipelineSuccess } from "../../contracts/dtos";
import type { ManifestRepository } from "../../contracts/ManifestRepository";
import type { ContentManifestEntry } from "../../domain/ContentManifest";
import { Result } from "../../../../shared/domain/Result";
import { KnowledgePipelineError } from "../../domain/KnowledgePipelineError";
import { PipelineStep } from "../../domain/PipelineStep";

// Default projection type when not specified
const DEFAULT_PROJECTION_TYPE = "EMBEDDING";

/**
 * Use Case: Execute Full Pipeline
 *
 * Coordinates the complete knowledge pipeline:
 * 1. Ingest source via ingestion service
 * 2. Create SourceKnowledge (projection hub) for the source
 * 3. Process content via processing service (sourceId-primary)
 * 4. Register projection in source-knowledge hub
 * 5. (Optional) If contextId provided, add source to context
 * 6. Record manifest
 *
 * Each step tracks completed steps for error reporting.
 * If a step fails, the error includes which steps completed successfully.
 *
 * When a ManifestRepository is provided, records a ContentManifestEntry
 * tracking all cross-context associations produced by the pipeline run.
 */
export class ExecuteFullPipeline {
  constructor(
    private readonly _ingestion: SourceIngestionService,
    private readonly _processing: SemanticProcessingService,
    private readonly _sourceKnowledge: SourceKnowledgeService,
    private readonly _contextManagement: ContextManagementService,
    private readonly _manifestRepository: ManifestRepository | null = null,
  ) {}

  async execute(
    input: ExecutePipelineInput,
  ): Promise<Result<KnowledgePipelineError, ExecutePipelineSuccess>> {
    const completedSteps: PipelineStep[] = [];
    const manifestId = input.resourceId ? crypto.randomUUID() : undefined;

    // ── Step 1: Ingest source ──────────────────────────────────────
    const ingestionResult = await this._ingestion.ingestAndExtract({
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      uri: input.uri,
      type: input.sourceType as SourceType,
      extractionJobId: input.extractionJobId,
      content: input.content,
    });

    if (ingestionResult.isFail()) {
      await this._recordManifest(input, manifestId, "failed", completedSteps, PipelineStep.Ingestion);
      return Result.fail(
        KnowledgePipelineError.fromStep(
          PipelineStep.Ingestion,
          ingestionResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(PipelineStep.Ingestion);

    // ── Step 2: Create SourceKnowledge (projection hub) ────────────
    const sourceKnowledgeId = `sk-${input.sourceId}`;
    const skResult = await this._sourceKnowledge.createSourceKnowledge({
      id: sourceKnowledgeId,
      sourceId: input.sourceId,
      contentHash: ingestionResult.value.contentHash,
      defaultProfileId: input.processingProfileId,
    });

    if (skResult.isFail()) {
      await this._recordManifest(input, manifestId, "failed", completedSteps, PipelineStep.Cataloging);
      return Result.fail(
        KnowledgePipelineError.fromStep(
          PipelineStep.Cataloging,
          skResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(PipelineStep.Cataloging);

    // ── Step 3: Process content (sourceId-primary) ─────────────────
    const processingResult = await this._processing.processContent({
      projectionId: input.projectionId,
      sourceId: input.sourceId,
      content: ingestionResult.value.extractedText,
      type: (input.projectionType ?? DEFAULT_PROJECTION_TYPE) as ProjectionType,
      processingProfileId: input.processingProfileId,
    });

    if (processingResult.isFail()) {
      await this._recordManifest(input, manifestId, "failed", completedSteps, PipelineStep.Processing);
      return Result.fail(
        KnowledgePipelineError.fromStep(
          PipelineStep.Processing,
          processingResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(PipelineStep.Processing);

    // ── Step 4: Register projection in source-knowledge hub ────────
    await this._sourceKnowledge.registerProjection({
      sourceId: input.sourceId,
      projectionId: input.projectionId,
      profileId: input.processingProfileId,
      status: "COMPLETED",
    });

    // ── Step 5: (Optional) Ensure context exists, then add source ──
    if (input.contextId) {
      const existingContext = await this._contextManagement.getContext(input.contextId);
      if (!existingContext) {
        await this._contextManagement.createContext({
          id: input.contextId,
          name: input.sourceName ?? input.sourceId,
          description: "",
          language: input.language ?? "en",
          requiredProfileId: input.processingProfileId,
          createdBy: input.createdBy ?? "pipeline",
        });
      }

      await this._contextManagement.addSourceToContext({
        contextId: input.contextId,
        sourceId: input.sourceId,
        sourceKnowledgeId,
        profileSatisfied: true,
      });
    }

    // ── Step 6: Record manifest ────────────────────────────────────
    await this._recordManifest(input, manifestId, "complete", completedSteps, undefined, {
      sourceKnowledgeId,
      contentHash: ingestionResult.value.contentHash,
      extractedTextLength: ingestionResult.value.extractedText.length,
      chunksCount: processingResult.value.chunksCount,
      dimensions: processingResult.value.dimensions,
      model: processingResult.value.model,
    });

    return Result.ok({
      sourceId: input.sourceId,
      sourceKnowledgeId,
      projectionId: processingResult.value.projectionId,
      contentHash: ingestionResult.value.contentHash,
      extractedTextLength: ingestionResult.value.extractedText.length,
      chunksCount: processingResult.value.chunksCount,
      dimensions: processingResult.value.dimensions,
      model: processingResult.value.model,
      contextId: input.contextId,
      resourceId: input.resourceId,
      manifestId,
    });
  }

  /**
   * Records a ContentManifestEntry if manifest tracking is enabled.
   * Does not throw — manifest recording is best-effort.
   */
  private async _recordManifest(
    input: ExecutePipelineInput,
    manifestId: string | undefined,
    status: "complete" | "failed",
    completedSteps: PipelineStep[],
    failedStep?: PipelineStep,
    metrics?: {
      sourceKnowledgeId?: string;
      contentHash?: string;
      extractedTextLength?: number;
      chunksCount?: number;
      dimensions?: number;
      model?: string;
    },
  ): Promise<void> {
    if (!this._manifestRepository || !input.resourceId || !manifestId) {
      return;
    }

    try {
      const entry: ContentManifestEntry = {
        id: manifestId,
        resourceId: input.resourceId,
        sourceId: input.sourceId,
        extractionJobId: input.extractionJobId,
        sourceKnowledgeId: metrics?.sourceKnowledgeId,
        projectionId: input.projectionId,
        contextId: input.contextId,
        status,
        completedSteps: [...completedSteps],
        failedStep,
        contentHash: metrics?.contentHash,
        extractedTextLength: metrics?.extractedTextLength,
        chunksCount: metrics?.chunksCount,
        dimensions: metrics?.dimensions,
        model: metrics?.model,
        createdAt: new Date().toISOString(),
        completedAt: status === "complete" ? new Date().toISOString() : undefined,
      };

      await this._manifestRepository.save(entry);
    } catch {
      // Best-effort: manifest recording should not fail the pipeline
    }
  }
}
