import type { SourceIngestionFacade } from "../../../../contexts/source-ingestion/facade/SourceIngestionFacade.js";
import type { SemanticProcessingFacade } from "../../../../contexts/semantic-processing/facade/SemanticProcessingFacade.js";
import type { SemanticKnowledgeFacade } from "../../../../contexts/semantic-knowledge/facade/SemanticKnowledgeFacade.js";
import type { SourceType } from "../../../../contexts/source-ingestion/source/domain/SourceType.js";
import type { ProjectionType } from "../../../../contexts/semantic-processing/projection/domain/ProjectionType.js";
import type { ExecutePipelineInput, ExecutePipelineSuccess } from "../../contracts/dtos.js";
import type { ManifestRepository } from "../../contracts/ManifestRepository.js";
import type { ContentManifestEntry } from "../../domain/ContentManifest.js";
import { Result } from "../../../../shared/domain/Result.js";
import { KnowledgePipelineError } from "../../domain/KnowledgePipelineError.js";
import { PipelineStep } from "../../domain/PipelineStep.js";

// Default projection type when not specified
const DEFAULT_PROJECTION_TYPE = "EMBEDDING";

/**
 * Use Case: Execute Full Pipeline
 *
 * Coordinates the complete knowledge pipeline: Ingest → Process → Catalog.
 * Uses only the 3 construction facades (no Retrieval).
 *
 * Each step tracks completed steps for error reporting.
 * If a step fails, the error includes which steps completed successfully.
 *
 * When a ManifestRepository is provided, records a ContentManifestEntry
 * tracking all cross-context associations produced by the pipeline run.
 */
export class ExecuteFullPipeline {
  constructor(
    private readonly _ingestion: SourceIngestionFacade,
    private readonly _processing: SemanticProcessingFacade,
    private readonly _knowledge: SemanticKnowledgeFacade,
    private readonly _manifestRepository: ManifestRepository | null = null,
  ) {}

  async execute(
    input: ExecutePipelineInput,
  ): Promise<Result<KnowledgePipelineError, ExecutePipelineSuccess>> {
    const completedSteps: PipelineStep[] = [];
    const manifestId = input.resourceId ? crypto.randomUUID() : undefined;

    const ingestionResult = await this._ingestion.ingestExtractAndReturn({
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      uri: input.uri,
      type: input.sourceType as SourceType,
      extractionJobId: input.extractionJobId,
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

    const catalogResult = await this._knowledge.createSemanticUnit({
      id: input.semanticUnitId,
      name: input.sourceName ?? "Untitled",
      description: input.summary ?? "",
      language: input.language,
      createdBy: input.createdBy,
      tags: input.tags,
      attributes: input.attributes,
    });

    if (catalogResult.isFail()) {
      await this._recordManifest(input, manifestId, "failed", completedSteps, PipelineStep.Cataloging);
      return Result.fail(
        KnowledgePipelineError.fromStep(
          PipelineStep.Cataloging,
          catalogResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(PipelineStep.Cataloging);

    const addSourceResult = await this._knowledge.addSourceToSemanticUnit({
      unitId: input.semanticUnitId,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      resourceId: input.resourceId,
      extractedContent: ingestionResult.value.extractedText,
      contentHash: ingestionResult.value.contentHash,
      processingProfileId: input.processingProfileId,
      processingProfileVersion: 1,
    });

    if (addSourceResult.isFail()) {
      await this._recordManifest(input, manifestId, "failed", completedSteps, PipelineStep.Cataloging);
      return Result.fail(
        KnowledgePipelineError.fromStep(
          PipelineStep.Cataloging,
          addSourceResult.error,
          completedSteps,
        ),
      );
    }

    const processingResult = await this._processing.processContent({
      projectionId: input.projectionId,
      semanticUnitId: input.semanticUnitId,
      semanticUnitVersion: addSourceResult.value.version,
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

    await this._recordManifest(input, manifestId, "complete", completedSteps, undefined, {
      contentHash: ingestionResult.value.contentHash,
      extractedTextLength: ingestionResult.value.extractedText.length,
      chunksCount: processingResult.value.chunksCount,
      dimensions: processingResult.value.dimensions,
      model: processingResult.value.model,
    });

    return Result.ok({
      sourceId: input.sourceId,
      unitId: catalogResult.value.unitId,
      projectionId: processingResult.value.projectionId,
      contentHash: ingestionResult.value.contentHash,
      extractedTextLength: ingestionResult.value.extractedText.length,
      chunksCount: processingResult.value.chunksCount,
      dimensions: processingResult.value.dimensions,
      model: processingResult.value.model,
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
        semanticUnitId: input.semanticUnitId,
        projectionId: input.projectionId,
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
