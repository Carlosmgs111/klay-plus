import type { ExtractionUseCases } from "../extraction/application";
import type { SourceRepository } from "../source/domain/SourceRepository";
import type { ResourceRepository } from "../resource/domain/ResourceRepository";
import type { ResourceStorage } from "../resource/domain/ResourceStorage";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import type { SourceType } from "../source/domain/SourceType";
import { SourceType as SourceTypeEnum } from "../source/domain/SourceType";
import { Source } from "../source/domain/Source";
import { SourceId } from "../source/domain/SourceId";
import {
  SourceNotFoundError,
  SourceAlreadyExistsError,
  SourceNameRequiredError,
  SourceUriRequiredError,
} from "../source/domain/errors";
import { Resource } from "../resource/domain/Resource";
import { ResourceId } from "../resource/domain/ResourceId";
import { StorageLocation } from "../resource/domain/StorageLocation";
import {
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
  ResourceStorageFailedError,
} from "../resource/domain/errors";
import type { ResolvedSourceIngestionModules } from "./composition/factory";
import { Result } from "../../../shared/domain/Result";
import type { DomainError } from "../../../shared/domain/errors";

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

export interface StoreResourceSuccess {
  resourceId: string;
  storageUri: string;
  size: number;
}

export interface RegisterExternalResourceSuccess {
  resourceId: string;
  storageUri: string;
}

export class SourceIngestionService {
  private readonly _extraction: ExtractionUseCases;
  private readonly _sourceRepository: SourceRepository;
  private readonly _sourceEventPublisher: EventPublisher;
  private readonly _resourceRepository: ResourceRepository;
  private readonly _resourceStorage: ResourceStorage;
  private readonly _resourceStorageProvider: string;
  private readonly _resourceEventPublisher: EventPublisher;

  constructor(modules: ResolvedSourceIngestionModules) {
    this._extraction = modules.extraction;
    this._sourceRepository = modules.sourceRepository;
    this._sourceEventPublisher = modules.sourceEventPublisher;
    this._resourceRepository = modules.resourceRepository;
    this._resourceStorage = modules.resourceStorage;
    this._resourceStorageProvider = modules.resourceStorageProvider;
    this._resourceEventPublisher = modules.resourceEventPublisher;
  }

  get extraction(): ExtractionUseCases {
    return this._extraction;
  }

  // ── Source operations ──────────────────────────────────────────────

  async registerSource(params: {
    id: string;
    name: string;
    uri: string;
    type: SourceType;
  }): Promise<Result<DomainError, RegisterSourceSuccess>> {
    if (!params.name || params.name.trim() === "") {
      return Result.fail(new SourceNameRequiredError());
    }
    if (!params.uri || params.uri.trim() === "") {
      return Result.fail(new SourceUriRequiredError());
    }

    const sourceId = SourceId.create(params.id);

    const exists = await this._sourceRepository.exists(sourceId);
    if (exists) {
      return Result.fail(new SourceAlreadyExistsError(params.uri));
    }

    const existingByUri = await this._sourceRepository.findByUri(params.uri);
    if (existingByUri) {
      return Result.fail(new SourceAlreadyExistsError(params.uri));
    }

    const source = Source.register(sourceId, params.name, params.type, params.uri);
    await this._sourceRepository.save(source);
    await this._sourceEventPublisher.publishAll(source.clearEvents());

    return Result.ok({ sourceId: params.id });
  }

  async extractSource(params: {
    jobId: string;
    sourceId: string;
  }): Promise<Result<DomainError, ExtractSourceSuccess>> {
    const sourceId = SourceId.create(params.sourceId);
    const source = await this._sourceRepository.findById(sourceId);

    if (!source) {
      return Result.fail(new SourceNotFoundError(params.sourceId));
    }

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

    const changed = source.recordExtraction(extractionResult.value.contentHash);
    if (changed) {
      await this._sourceRepository.save(source);
      await this._sourceEventPublisher.publishAll(source.clearEvents());
    }

    return Result.ok({
      jobId: params.jobId,
      contentHash: extractionResult.value.contentHash,
      changed,
    });
  }

  async ingestAndExtract(params: {
    sourceId: string;
    sourceName: string;
    uri: string;
    type: SourceType;
    extractionJobId: string;
  }): Promise<Result<DomainError, IngestAndExtractSuccess>> {
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

    // 2. Execute extraction
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
    const sourceId = SourceId.create(params.sourceId);
    const source = await this._sourceRepository.findById(sourceId);
    if (source) {
      const changed = source.recordExtraction(extractionResult.value.contentHash);
      if (changed) {
        await this._sourceRepository.save(source);
        await this._sourceEventPublisher.publishAll(source.clearEvents());
      }
    }

    return Result.ok({
      sourceId: params.sourceId,
      jobId: params.extractionJobId,
      contentHash: extractionResult.value.contentHash,
      extractedText: extractionResult.value.extractedText,
      metadata: extractionResult.value.metadata,
    });
  }

  // ── Resource operations ────────────────────────────────────────────

  async storeResource(params: {
    id: string;
    buffer: ArrayBuffer;
    originalName: string;
    mimeType: string;
  }): Promise<Result<DomainError, StoreResourceSuccess>> {
    if (!params.originalName || params.originalName.trim() === "") {
      return Result.fail(new ResourceInvalidNameError());
    }
    if (!params.mimeType || params.mimeType.trim() === "") {
      return Result.fail(new ResourceInvalidMimeTypeError());
    }

    const resourceId = ResourceId.create(params.id);
    const exists = await this._resourceRepository.exists(resourceId);
    if (exists) {
      return Result.fail(new ResourceAlreadyExistsError(params.id));
    }

    let uploadResult: { uri: string; size: number };
    try {
      uploadResult = await this._resourceStorage.upload({
        buffer: params.buffer,
        originalName: params.originalName,
        mimeType: params.mimeType,
      });
    } catch (error) {
      return Result.fail(
        new ResourceStorageFailedError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }

    const storageLocation = StorageLocation.create(this._resourceStorageProvider, uploadResult.uri);
    const resource = Resource.store(
      resourceId,
      params.originalName,
      params.mimeType,
      uploadResult.size,
      storageLocation,
    );

    await this._resourceRepository.save(resource);
    await this._resourceEventPublisher.publishAll(resource.clearEvents());

    return Result.ok({
      resourceId: params.id,
      storageUri: uploadResult.uri,
      size: uploadResult.size,
    });
  }

  async registerExternalResource(params: {
    id: string;
    name: string;
    mimeType: string;
    uri: string;
    size?: number;
  }): Promise<Result<DomainError, RegisterExternalResourceSuccess>> {
    if (!params.name || params.name.trim() === "") {
      return Result.fail(new ResourceInvalidNameError());
    }
    if (!params.mimeType || params.mimeType.trim() === "") {
      return Result.fail(new ResourceInvalidMimeTypeError());
    }

    const resourceId = ResourceId.create(params.id);
    const exists = await this._resourceRepository.exists(resourceId);
    if (exists) {
      return Result.fail(new ResourceAlreadyExistsError(params.id));
    }

    const resource = Resource.reference(
      resourceId,
      params.name,
      params.mimeType,
      params.uri,
      params.size,
    );

    await this._resourceRepository.save(resource);
    await this._resourceEventPublisher.publishAll(resource.clearEvents());

    return Result.ok({
      resourceId: params.id,
      storageUri: params.uri,
    });
  }

  async deleteResource(params: {
    id: string;
  }): Promise<Result<DomainError, void>> {
    const resourceId = ResourceId.create(params.id);
    const resource = await this._resourceRepository.findById(resourceId);

    if (!resource) {
      return Result.fail(new ResourceNotFoundError(params.id));
    }

    if (resource.provider !== "external" && resource.storageUri) {
      try {
        await this._resourceStorage.delete(resource.storageUri);
      } catch (error) {
        return Result.fail(
          new ResourceStorageFailedError(
            `Failed to delete from storage: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    }

    resource.markDeleted();
    await this._resourceRepository.save(resource);
    await this._resourceEventPublisher.publishAll(resource.clearEvents());

    return Result.ok(undefined);
  }

  async getResource(id: string): Promise<Result<DomainError, import("../resource/domain/Resource").Resource>> {
    const resourceId = ResourceId.create(id);
    const resource = await this._resourceRepository.findById(resourceId);

    if (!resource) {
      return Result.fail(new ResourceNotFoundError(id));
    }

    return Result.ok(resource);
  }

  // ── Composite workflows ────────────────────────────────────────────

  async ingestFile(params: {
    resourceId: string;
    sourceId: string;
    sourceName: string;
    sourceType: SourceType;
    extractionJobId: string;
    file: { buffer: ArrayBuffer; originalName: string; mimeType: string };
  }): Promise<Result<DomainError, IngestFileSuccess>> {
    // 1. Store resource
    const storeResult = await this.storeResource({
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

    // 3. Execute extraction
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
    const sourceId = SourceId.create(params.sourceId);
    const source = await this._sourceRepository.findById(sourceId);
    if (source) {
      const changed = source.recordExtraction(extractionResult.value.contentHash);
      if (changed) {
        await this._sourceRepository.save(source);
        await this._sourceEventPublisher.publishAll(source.clearEvents());
      }
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
    const externalResult = await this.registerExternalResource({
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
    const sourceId = SourceId.create(params.sourceId);
    const source = await this._sourceRepository.findById(sourceId);
    if (source) {
      const changed = source.recordExtraction(extractionResult.value.contentHash);
      if (changed) {
        await this._sourceRepository.save(source);
        await this._sourceEventPublisher.publishAll(source.clearEvents());
      }
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

  // ── Batch operations ───────────────────────────────────────────────

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
          return { sourceId: result.value.sourceId, success: true };
        }
        return { sourceId: sources[index].id, success: false, error: result.error.message };
      }
      return {
        sourceId: sources[index].id,
        success: false,
        error: promiseResult.reason instanceof Error ? promiseResult.reason.message : String(promiseResult.reason),
      };
    });
  }

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
