import type { ResourceRepository } from "../../domain/ResourceRepository";
import type { ResourceStorage } from "../../domain/ResourceStorage";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import { Resource } from "../../domain/Resource";
import { ResourceId } from "../../domain/ResourceId";
import { StorageLocation } from "../../domain/StorageLocation";
import {
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
  ResourceStorageFailedError,
} from "../../domain/errors";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

export interface StoreResourceInput {
  id: string;
  buffer: ArrayBuffer;
  originalName: string;
  mimeType: string;
}

export interface StoreResourceSuccess {
  resourceId: string;
  storageUri: string;
  size: number;
}

export class StoreResource {
  constructor(
    private readonly resourceRepository: ResourceRepository,
    private readonly resourceStorage: ResourceStorage,
    private readonly resourceStorageProvider: string,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(
    params: StoreResourceInput,
  ): Promise<Result<DomainError, StoreResourceSuccess>> {
    if (!params.originalName || params.originalName.trim() === "") {
      return Result.fail(new ResourceInvalidNameError());
    }
    if (!params.mimeType || params.mimeType.trim() === "") {
      return Result.fail(new ResourceInvalidMimeTypeError());
    }

    const resourceId = ResourceId.create(params.id);
    const exists = await this.resourceRepository.exists(resourceId);
    if (exists) {
      return Result.fail(new ResourceAlreadyExistsError(params.id));
    }

    let uploadResult: { uri: string; size: number };
    try {
      uploadResult = await this.resourceStorage.upload({
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

    const storageLocation = StorageLocation.create(this.resourceStorageProvider, uploadResult.uri);
    const resource = Resource.store(
      resourceId,
      params.originalName,
      params.mimeType,
      uploadResult.size,
      storageLocation,
    );

    await this.resourceRepository.save(resource);
    await this.eventPublisher.publishAll(resource.clearEvents());

    return Result.ok({
      resourceId: params.id,
      storageUri: uploadResult.uri,
      size: uploadResult.size,
    });
  }
}
