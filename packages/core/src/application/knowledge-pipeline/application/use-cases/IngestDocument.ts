import type { SourceIngestionFacade } from "../../../../contexts/source-ingestion/facade/SourceIngestionFacade";
import type { SourceType } from "../../../../contexts/source-ingestion/source/domain/SourceType";
import type { IngestDocumentInput, IngestDocumentSuccess } from "../../contracts/dtos.js";
import { Result } from "../../../../shared/domain/Result";
import { KnowledgePipelineError } from "../../domain/KnowledgePipelineError.js";
import { PipelineStep } from "../../domain/PipelineStep.js";

/**
 * Use Case: Ingest Document
 *
 * Registers a source and extracts text content via the SourceIngestionFacade.
 * Returns the extracted text for downstream use by other pipeline steps.
 */
export class IngestDocument {
  constructor(
    private readonly _ingestion: SourceIngestionFacade,
  ) {}

  async execute(
    input: IngestDocumentInput,
  ): Promise<Result<KnowledgePipelineError, IngestDocumentSuccess>> {
    const result = await this._ingestion.ingestExtractAndReturn({
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      uri: input.uri,
      type: input.sourceType as SourceType,
      extractionJobId: input.extractionJobId,
    });

    if (result.isFail()) {
      return Result.fail(
        KnowledgePipelineError.fromStep(PipelineStep.Ingestion, result.error, []),
      );
    }

    return Result.ok({
      sourceId: result.value.sourceId,
      jobId: result.value.jobId,
      contentHash: result.value.contentHash,
      extractedText: result.value.extractedText,
      metadata: result.value.metadata,
    });
  }
}
