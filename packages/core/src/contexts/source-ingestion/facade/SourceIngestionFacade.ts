import type { SourceUseCases } from "../source/application/index.js";
import type { ExtractionUseCases } from "../extraction/application/index.js";
import type { ResourceUseCases } from "../resource/application/index.js";
import type { SourceRepository } from "../source/domain/SourceRepository.js";
import type { ResourceRepository } from "../resource/domain/ResourceRepository.js";
import type { SourceType } from "../source/domain/SourceType.js";
import { SourceType as SourceTypeEnum } from "../source/domain/SourceType.js";
import { SourceId } from "../source/domain/SourceId.js";
import { SourceNotFoundError } from "../source/domain/errors/index.js";
import type { ResolvedSourceIngestionModules } from "./composition/infra-policies.js";
import { Result } from "../../../shared/domain/Result.js";
import type { DomainError } from "../../../shared/domain/errors/index.js";

const SOURCE_TYPE_TO_MIME: Record<SourceType, string> = {
  [SourceTypeEnum.Pdf]: "application/pdf",
  [SourceTypeEnum.Web]: "text/html",
  [SourceTypeEnum.Api]: "application/json",
  [SourceTypeEnum.PlainText]: "text/plain",
  [SourceTypeEnum.Markdown]: "text/markdown",
  [SourceTypeEnum.Csv]: "text/csv",
  [SourceTypeEnum.Json]: "application/json",
};

export interface RegisterSourceSuccess {
  sourceId: string;
}

export interface ExtractSourceSuccess {
  jobId: string;
  contentHash: string;
  changed: boolean;
}

export interface IngestAndExtractSuccess {
  sourceId: string;
  jobId: string;
  contentHash: string;
}

export interface IngestExtractAndReturnSuccess {
  sourceId: string;
  jobId: string;
  contentHash: string;
  extractedText: string;
  metadata: Record<string, unknown>;
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

/**
 * Application Facade for the Source Ingestion bounded context.
 *
 * Provides a unified entry point to all modules within the context,
 * coordinating use cases for resource management, source registration,
 * and content extraction.
 *
 * This is an Application Layer component - it does NOT contain domain logic.
 * It only coordinates existing use cases and handles cross-module workflows.
 *
 * The facade coordinates the flow:
 * 1. Resource storage (uploads file or registers external reference)
 * 2. Source registration (stores reference only)
 * 3. Content extraction (extracts text from URI)
 * 4. Source update (records extraction hash)
 */
export class SourceIngestionFacade {
  private readonly _source: SourceUseCases;
  private readonly _extraction: ExtractionUseCases;
  private readonly _resource: ResourceUseCases;
  private readonly _sourceRepository: SourceRepository;
  private readonly _resourceRepository: ResourceRepository;

  constructor(modules: ResolvedSourceIngestionModules) {
    this._source = modules.source;
    this._extraction = modules.extraction;
    this._resource = modules.resource;
    this._sourceRepository = modules.sourceRepository;
    this._resourceRepository = modules.resourceRepository;
  }

  get source(): SourceUseCases {
    return this._source;
  }

  get extraction(): ExtractionUseCases {
    return this._extraction;
  }

  get resource(): ResourceUseCases {
    return this._resource;
  }

  /**
   * Registers a source (stores reference only, no extraction).
   */
  async registerSource(params: {
    id: string;
    name: string;
    uri: string;
    type: SourceType;
  }): Promise<Result<DomainError, RegisterSourceSuccess>> {
    const registerResult = await this._source.registerSource.execute({
      id: params.id,
      name: params.name,
      type: params.type,
      uri: params.uri,
    });

    if (registerResult.isFail()) {
      return Result.fail(registerResult.error);
    }

    return Result.ok({ sourceId: params.id });
  }

  /**
   * Executes extraction for a registered source.
   * Coordinates the full flow:
   * 1. Fetches source from repository
   * 2. Executes extraction (pure, no source dependency)
   * 3. Updates source with content hash
   */
  async extractSource(params: {
    jobId: string;
    sourceId: string;
  }): Promise<Result<DomainError, ExtractSourceSuccess>> {
    // 1. Fetch source from repository
    const sourceId = SourceId.create(params.sourceId);
    const source = await this._sourceRepository.findById(sourceId);

    if (!source) {
      return Result.fail(new SourceNotFoundError(params.sourceId));
    }

    // 2. Execute extraction with URI and mimeType
    const mimeType = SOURCE_TYPE_TO_MIME[source.type];
    const extractionResult = await this._extraction.executeExtraction.execute({
      jobId: params.jobId,
      sourceId: params.sourceId,
      uri: source.uri,
      mimeType,
    });

    if (extractionResult.isFail()) {
      return Result.fail(extractionResult.error);
    }

    // 3. Update source with content hash
    const updateResult = await this._source.updateSource.execute({
      sourceId: params.sourceId,
      contentHash: extractionResult.value.contentHash,
    });

    if (updateResult.isFail()) {
      return Result.fail(updateResult.error);
    }

    return Result.ok({
      jobId: params.jobId,
      contentHash: extractionResult.value.contentHash,
      changed: updateResult.value.changed,
    });
  }

  /**
   * Registers a source and immediately executes extraction.
   * This is the complete ingestion workflow.
   */
  async ingestAndExtract(params: {
    sourceId: string;
    sourceName: string;
    uri: string;
    type: SourceType;
    extractionJobId: string;
  }): Promise<Result<DomainError, IngestAndExtractSuccess>> {
    // Register source
    const registerResult = await this.registerSource({
      id: params.sourceId,
      name: params.sourceName,
      uri: params.uri,
      type: params.type,
    });

    if (registerResult.isFail()) {
      return Result.fail(registerResult.error);
    }

    // Execute extraction
    const extractionResult = await this.extractSource({
      jobId: params.extractionJobId,
      sourceId: params.sourceId,
    });

    if (extractionResult.isFail()) {
      return Result.fail(extractionResult.error);
    }

    return Result.ok({
      sourceId: params.sourceId,
      jobId: params.extractionJobId,
      contentHash: extractionResult.value.contentHash,
    });
  }

  /**
   * Registers a source, executes extraction, and returns the extracted text.
   * Unlike ingestAndExtract(), this method returns the full extraction result
   * including extractedText and metadata — useful for downstream processing.
   */
  async ingestExtractAndReturn(params: {
    sourceId: string;
    sourceName: string;
    uri: string;
    type: SourceType;
    extractionJobId: string;
  }): Promise<Result<DomainError, IngestExtractAndReturnSuccess>> {
    // 1. Register source
    const registerResult = await this.registerSource({
      id: params.sourceId,
      name: params.sourceName,
      uri: params.uri,
      type: params.type,
    });

    if (registerResult.isFail()) {
      return Result.fail(registerResult.error);
    }

    // 2. Execute extraction (directly to preserve extractedText)
    const mimeType = SOURCE_TYPE_TO_MIME[params.type];
    const extractionResult = await this._extraction.executeExtraction.execute({
      jobId: params.extractionJobId,
      sourceId: params.sourceId,
      uri: params.uri,
      mimeType,
    });

    if (extractionResult.isFail()) {
      return Result.fail(extractionResult.error);
    }

    // 3. Update source with content hash
    const updateResult = await this._source.updateSource.execute({
      sourceId: params.sourceId,
      contentHash: extractionResult.value.contentHash,
    });

    if (updateResult.isFail()) {
      return Result.fail(updateResult.error);
    }

    return Result.ok({
      sourceId: params.sourceId,
      jobId: params.extractionJobId,
      contentHash: extractionResult.value.contentHash,
      extractedText: extractionResult.value.extractedText,
      metadata: extractionResult.value.metadata,
    });
  }

  /**
   * Uploads a file, registers it as a source, and extracts its content.
   * This is the complete file ingestion workflow:
   * 1. Store resource (upload to storage)
   * 2. Register source (with storage URI)
   * 3. Execute extraction (extract text from stored file)
   * 4. Update source (record content hash)
   */
  async ingestFile(params: {
    resourceId: string;
    sourceId: string;
    sourceName: string;
    sourceType: SourceType;
    extractionJobId: string;
    file: { buffer: ArrayBuffer; originalName: string; mimeType: string };
  }): Promise<Result<DomainError, IngestFileSuccess>> {
    // 1. Store resource
    const storeResult = await this._resource.storeResource.execute({
      id: params.resourceId,
      buffer: params.file.buffer,
      originalName: params.file.originalName,
      mimeType: params.file.mimeType,
    });

    if (storeResult.isFail()) {
      return Result.fail(storeResult.error);
    }

    // 2. Register source with storage URI
    const registerResult = await this.registerSource({
      id: params.sourceId,
      name: params.sourceName,
      uri: storeResult.value.storageUri,
      type: params.sourceType,
    });

    if (registerResult.isFail()) {
      return Result.fail(registerResult.error);
    }

    // 3. Execute extraction (pass buffer for in-memory extraction)
    const mimeType = SOURCE_TYPE_TO_MIME[params.sourceType];
    const extractionResult = await this._extraction.executeExtraction.execute({
      jobId: params.extractionJobId,
      sourceId: params.sourceId,
      uri: storeResult.value.storageUri,
      mimeType,
      content: params.file.buffer,
    });

    if (extractionResult.isFail()) {
      return Result.fail(extractionResult.error);
    }

    // 4. Update source with content hash
    const updateResult = await this._source.updateSource.execute({
      sourceId: params.sourceId,
      contentHash: extractionResult.value.contentHash,
    });

    if (updateResult.isFail()) {
      return Result.fail(updateResult.error);
    }

    return Result.ok({
      resourceId: params.resourceId,
      sourceId: params.sourceId,
      jobId: params.extractionJobId,
      contentHash: extractionResult.value.contentHash,
      storageUri: storeResult.value.storageUri,
      extractedText: extractionResult.value.extractedText,
      metadata: extractionResult.value.metadata,
    });
  }

  /**
   * Registers an external resource, creates a source, and extracts content.
   * For files that already exist at an external location.
   */
  async ingestExternalResource(params: {
    resourceId: string;
    sourceId: string;
    sourceName: string;
    sourceType: SourceType;
    extractionJobId: string;
    uri: string;
    mimeType: string;
    size?: number;
  }): Promise<Result<DomainError, IngestFileSuccess>> {
    // 1. Register external resource
    const externalResult = await this._resource.registerExternalResource.execute({
      id: params.resourceId,
      name: params.sourceName,
      mimeType: params.mimeType,
      uri: params.uri,
      size: params.size,
    });

    if (externalResult.isFail()) {
      return Result.fail(externalResult.error);
    }

    // 2. Register source with external URI
    const registerResult = await this.registerSource({
      id: params.sourceId,
      name: params.sourceName,
      uri: params.uri,
      type: params.sourceType,
    });

    if (registerResult.isFail()) {
      return Result.fail(registerResult.error);
    }

    // 3. Execute extraction
    const extractionMime = SOURCE_TYPE_TO_MIME[params.sourceType];
    const extractionResult = await this._extraction.executeExtraction.execute({
      jobId: params.extractionJobId,
      sourceId: params.sourceId,
      uri: params.uri,
      mimeType: extractionMime,
    });

    if (extractionResult.isFail()) {
      return Result.fail(extractionResult.error);
    }

    // 4. Update source with content hash
    const updateResult = await this._source.updateSource.execute({
      sourceId: params.sourceId,
      contentHash: extractionResult.value.contentHash,
    });

    if (updateResult.isFail()) {
      return Result.fail(updateResult.error);
    }

    return Result.ok({
      resourceId: params.resourceId,
      sourceId: params.sourceId,
      jobId: params.extractionJobId,
      contentHash: extractionResult.value.contentHash,
      storageUri: params.uri,
      extractedText: extractionResult.value.extractedText,
      metadata: extractionResult.value.metadata,
    });
  }

  /**
   * Batch registration of multiple sources (no extraction).
   */
  async batchRegister(
    sources: Array<{
      id: string;
      name: string;
      uri: string;
      type: SourceType;
    }>,
  ): Promise<
    Array<{
      sourceId: string;
      success: boolean;
      error?: string;
    }>
  > {
    const results = await Promise.allSettled(
      sources.map((source) => this.registerSource(source)),
    );

    return results.map((promiseResult, index) => {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        if (result.isOk()) {
          return {
            sourceId: result.value.sourceId,
            success: true,
          };
        }
        return {
          sourceId: sources[index].id,
          success: false,
          error: result.error.message,
        };
      }
      return {
        sourceId: sources[index].id,
        success: false,
        error: promiseResult.reason instanceof Error ? promiseResult.reason.message : String(promiseResult.reason),
      };
    });
  }

  /**
   * Batch ingestion with extraction.
   */
  async batchIngestAndExtract(
    sources: Array<{
      sourceId: string;
      sourceName: string;
      uri: string;
      type: SourceType;
      extractionJobId: string;
    }>,
  ): Promise<
    Array<{
      sourceId: string;
      jobId: string;
      success: boolean;
      contentHash?: string;
      error?: string;
    }>
  > {
    const results = await Promise.allSettled(
      sources.map((source) => this.ingestAndExtract(source)),
    );

    return results.map((promiseResult, index) => {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        if (result.isOk()) {
          return {
            sourceId: result.value.sourceId,
            jobId: result.value.jobId,
            success: true,
            contentHash: result.value.contentHash,
          };
        }
        return {
          sourceId: sources[index].sourceId,
          jobId: sources[index].extractionJobId,
          success: false,
          error: result.error.message,
        };
      }
      return {
        sourceId: sources[index].sourceId,
        jobId: sources[index].extractionJobId,
        success: false,
        error: promiseResult.reason instanceof Error ? promiseResult.reason.message : String(promiseResult.reason),
      };
    });
  }
}
