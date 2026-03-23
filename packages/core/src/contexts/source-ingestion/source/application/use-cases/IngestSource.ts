import type { StoreResource } from "../../../resource/application/use-cases/StoreResource";
import type { RegisterExternalResource } from "../../../resource/application/use-cases/RegisterExternalResource";
import type { IngestAndExtract } from "./IngestAndExtract";
import type { SourceType } from "../../domain/SourceType";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

export type IngestSourceInput =
  | {
      type: "file";
      resourceId: string;
      sourceId: string;
      sourceName: string;
      sourceType: SourceType;
      extractionJobId: string;
      file: { buffer: ArrayBuffer; originalName: string; mimeType: string };
      language?: string;
    }
  | {
      type: "external";
      resourceId: string;
      sourceId: string;
      sourceName: string;
      sourceType: SourceType;
      extractionJobId: string;
      uri: string;
      mimeType: string;
      size?: number;
      language?: string;
    };

export interface IngestSourceResult {
  resourceId: string;
  sourceId: string;
  jobId: string;
  contentHash: string;
  storageUri: string;
  extractedText: string;
  metadata: Record<string, unknown>;
}

/**
 * IngestSource — Unified use case merging IngestFile + IngestExternalResource.
 *
 * Discriminates on input.type: 'file' → StoreResource path, 'external' → RegisterExternalResource path.
 * Both paths converge at IngestAndExtract for register + extract + update.
 */
export class IngestSource {
  constructor(
    private readonly _ingestAndExtract: IngestAndExtract,
    private readonly _storeResource: StoreResource,
    private readonly _registerExternalResource: RegisterExternalResource,
  ) {}

  async execute(
    input: IngestSourceInput,
  ): Promise<Result<DomainError, IngestSourceResult>> {
    if (input.type === "file") {
      // Step 0: Store resource
      const storeResult = await this._storeResource.execute({
        id: input.resourceId,
        buffer: input.file.buffer,
        originalName: input.file.originalName,
        mimeType: input.file.mimeType,
      });

      if (storeResult.isFail()) {
        return Result.fail(storeResult.error);
      }

      // Steps 1-3: Register source, extract, update
      const workflowResult = await this._ingestAndExtract.execute({
        sourceId: input.sourceId,
        sourceName: input.sourceName,
        uri: storeResult.value.storageUri,
        type: input.sourceType,
        extractionJobId: input.extractionJobId,
        content: input.file.buffer,
      });

      if (workflowResult.isFail()) {
        return Result.fail(workflowResult.error);
      }

      return Result.ok({
        resourceId: input.resourceId,
        sourceId: workflowResult.value.sourceId,
        jobId: workflowResult.value.jobId,
        contentHash: workflowResult.value.contentHash,
        storageUri: storeResult.value.storageUri,
        extractedText: workflowResult.value.extractedText,
        metadata: workflowResult.value.metadata,
      });
    } else {
      // Step 0: Register external resource
      const externalResult = await this._registerExternalResource.execute({
        id: input.resourceId,
        name: input.sourceName,
        mimeType: input.mimeType,
        uri: input.uri,
        size: input.size,
      });

      if (externalResult.isFail()) {
        return Result.fail(externalResult.error);
      }

      // Steps 1-3: Register source, extract, update
      const workflowResult = await this._ingestAndExtract.execute({
        sourceId: input.sourceId,
        sourceName: input.sourceName,
        uri: input.uri,
        type: input.sourceType,
        extractionJobId: input.extractionJobId,
      });

      if (workflowResult.isFail()) {
        return Result.fail(workflowResult.error);
      }

      return Result.ok({
        resourceId: input.resourceId,
        sourceId: workflowResult.value.sourceId,
        jobId: workflowResult.value.jobId,
        contentHash: workflowResult.value.contentHash,
        storageUri: input.uri,
        extractedText: workflowResult.value.extractedText,
        metadata: workflowResult.value.metadata,
      });
    }
  }
}
