import type { SourceRepository } from "../../domain/SourceRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import type { ExecuteExtraction } from "../../../extraction/application/ExecuteExtraction";
import type { StoreResource } from "../../../resource/application/use-cases/StoreResource";
import type { SourceType } from "../../domain/SourceType";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import { IngestAndExtract } from "./IngestAndExtract";

export interface IngestFileInput {
  resourceId: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  extractionJobId: string;
  file: { buffer: ArrayBuffer; originalName: string; mimeType: string };
}

export interface IngestFileSuccess {
  resourceId: string;
  sourceId: string;
  jobId: string;
  contentHash: string;
  storageUri: string;
  extractedText: string;
  metadata: Record<string, unknown>;
}

export class IngestFile {
  private readonly ingestAndExtract: IngestAndExtract;

  constructor(
    private readonly storeResource: StoreResource,
    sourceRepository: SourceRepository,
    eventPublisher: EventPublisher,
    executeExtraction: ExecuteExtraction,
  ) {
    this.ingestAndExtract = new IngestAndExtract(sourceRepository, eventPublisher, executeExtraction);
  }

  async execute(
    params: IngestFileInput,
  ): Promise<Result<DomainError, IngestFileSuccess>> {
    // Step 0: Store resource
    const storeResult = await this.storeResource.execute({
      id: params.resourceId,
      buffer: params.file.buffer,
      originalName: params.file.originalName,
      mimeType: params.file.mimeType,
    });

    if (storeResult.isFail()) {
      return Result.fail(storeResult.error);
    }

    // Steps 1-3: Register source, extract, update
    const workflowResult = await this.ingestAndExtract.execute({
      sourceId: params.sourceId,
      sourceName: params.sourceName,
      uri: storeResult.value.storageUri,
      type: params.sourceType,
      extractionJobId: params.extractionJobId,
      content: params.file.buffer,
    });

    if (workflowResult.isFail()) {
      return Result.fail(workflowResult.error);
    }

    return Result.ok({
      resourceId: params.resourceId,
      sourceId: workflowResult.value.sourceId,
      jobId: workflowResult.value.jobId,
      contentHash: workflowResult.value.contentHash,
      storageUri: storeResult.value.storageUri,
      extractedText: workflowResult.value.extractedText,
      metadata: workflowResult.value.metadata,
    });
  }
}
