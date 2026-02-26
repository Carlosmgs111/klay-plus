import type { SourceIngestionFacade } from "../../../../contexts/source-ingestion/facade/SourceIngestionFacade.js";
import type { SemanticKnowledgeFacade } from "../../../../contexts/semantic-knowledge/facade/SemanticKnowledgeFacade.js";
import type { SemanticProcessingFacade } from "../../../../contexts/semantic-processing/facade/SemanticProcessingFacade.js";
import type { SourceType } from "../../../../contexts/source-ingestion/source/domain/SourceType.js";
import type { ProjectionType } from "../../../../contexts/semantic-processing/projection/domain/ProjectionType.js";
import type { IngestAndAddSourceInput, IngestAndAddSourceSuccess } from "../../contracts/dtos.js";
import { Result } from "../../../../shared/domain/Result.js";
import { KnowledgeManagementError } from "../../domain/KnowledgeManagementError.js";
import { ManagementStep } from "../../domain/ManagementStep.js";

// Default projection type when not specified
const DEFAULT_PROJECTION_TYPE = "EMBEDDING";

/**
 * Use Case: Ingest and Add Source
 *
 * Coordinates the multi-step flow for adding a new source to an
 * existing semantic unit: Ingest → AddSource → Process.
 *
 * Each step tracks completed steps for error reporting.
 * If a step fails, the error includes which steps completed successfully.
 *
 * Mirrors ExecuteFullPipeline but operates on an existing unit
 * (no unit creation step).
 */
export class IngestAndAddSource {
  constructor(
    private readonly _ingestion: SourceIngestionFacade,
    private readonly _knowledge: SemanticKnowledgeFacade,
    private readonly _processing: SemanticProcessingFacade,
  ) {}

  async execute(
    input: IngestAndAddSourceInput,
  ): Promise<Result<KnowledgeManagementError, IngestAndAddSourceSuccess>> {
    const completedSteps: ManagementStep[] = [];

    // ─── Step 1: Ingest ─────────────────────────────────────────────────────────
    const ingestionResult = await this._ingestion.ingestExtractAndReturn({
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      uri: input.uri,
      type: input.sourceType as SourceType,
      extractionJobId: input.extractionJobId,
    });

    if (ingestionResult.isFail()) {
      return Result.fail(
        KnowledgeManagementError.fromStep(
          ManagementStep.Ingestion,
          ingestionResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(ManagementStep.Ingestion);

    // ─── Step 2: Add Source to Existing Unit ─────────────────────────────────────
    const addSourceResult = await this._knowledge.addSourceToSemanticUnit({
      unitId: input.unitId,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      resourceId: input.resourceId,
      extractedContent: ingestionResult.value.extractedText,
      contentHash: ingestionResult.value.contentHash,
      processingProfileId: input.processingProfileId,
      processingProfileVersion: 1,
    });

    if (addSourceResult.isFail()) {
      return Result.fail(
        KnowledgeManagementError.fromStep(
          ManagementStep.AddSource,
          addSourceResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(ManagementStep.AddSource);

    // ─── Step 3: Process ────────────────────────────────────────────────────────
    const processingResult = await this._processing.processContent({
      projectionId: input.projectionId,
      semanticUnitId: input.unitId,
      semanticUnitVersion: addSourceResult.value.version,
      content: ingestionResult.value.extractedText,
      type: (input.projectionType ?? DEFAULT_PROJECTION_TYPE) as ProjectionType,
      processingProfileId: input.processingProfileId,
    });

    if (processingResult.isFail()) {
      return Result.fail(
        KnowledgeManagementError.fromStep(
          ManagementStep.Processing,
          processingResult.error,
          completedSteps,
        ),
      );
    }

    completedSteps.push(ManagementStep.Processing);

    // ─── Success ────────────────────────────────────────────────────────────────
    return Result.ok({
      sourceId: input.sourceId,
      unitId: input.unitId,
      version: addSourceResult.value.version,
      projectionId: processingResult.value.projectionId,
      contentHash: ingestionResult.value.contentHash,
      extractedTextLength: ingestionResult.value.extractedText.length,
      chunksCount: processingResult.value.chunksCount,
      dimensions: processingResult.value.dimensions,
      model: processingResult.value.model,
      resourceId: input.resourceId,
    });
  }
}
