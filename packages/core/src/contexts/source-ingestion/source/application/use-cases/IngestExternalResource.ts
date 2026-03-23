import type { SourceRepository } from "../../domain/SourceRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import type { ExecuteExtraction } from "../../../extraction/application/ExecuteExtraction";
import type { RegisterExternalResource } from "../../../resource/application/use-cases/RegisterExternalResource";
import type { SourceType } from "../../domain/SourceType";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import { IngestAndExtract } from "./IngestAndExtract";

export interface IngestExternalResourceInput {
  resourceId: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  extractionJobId: string;
  uri: string;
  mimeType: string;
  size?: number;
}

export interface IngestExternalResourceSuccess {
  resourceId: string;
  sourceId: string;
  jobId: string;
  contentHash: string;
  storageUri: string;
  extractedText: string;
  metadata: Record<string, unknown>;
}

export class IngestExternalResource {
  private readonly ingestAndExtract: IngestAndExtract;

  constructor(
    private readonly registerExternalResource: RegisterExternalResource,
    sourceRepository: SourceRepository,
    eventPublisher: EventPublisher,
    executeExtraction: ExecuteExtraction,
  ) {
    this.ingestAndExtract = new IngestAndExtract(sourceRepository, eventPublisher, executeExtraction);
  }

  async execute(
    params: IngestExternalResourceInput,
  ): Promise<Result<DomainError, IngestExternalResourceSuccess>> {
    // Step 0: Register external resource
    const externalResult = await this.registerExternalResource.execute({
      id: params.resourceId,
      name: params.sourceName,
      mimeType: params.mimeType,
      uri: params.uri,
      size: params.size,
    });

    if (externalResult.isFail()) {
      return Result.fail(externalResult.error);
    }

    // Steps 1-3: Register source, extract, update
    const workflowResult = await this.ingestAndExtract.execute({
      sourceId: params.sourceId,
      sourceName: params.sourceName,
      uri: params.uri,
      type: params.sourceType,
      extractionJobId: params.extractionJobId,
    });

    if (workflowResult.isFail()) {
      return Result.fail(workflowResult.error);
    }

    return Result.ok({
      resourceId: params.resourceId,
      sourceId: workflowResult.value.sourceId,
      jobId: workflowResult.value.jobId,
      contentHash: workflowResult.value.contentHash,
      storageUri: params.uri,
      extractedText: workflowResult.value.extractedText,
      metadata: workflowResult.value.metadata,
    });
  }
}
