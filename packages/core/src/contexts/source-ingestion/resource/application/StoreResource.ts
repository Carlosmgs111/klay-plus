import type { EventPublisher } from "../../../../shared/domain/index.js";
import { Result } from "../../../../shared/domain/Result.js";
import { Resource } from "../domain/Resource.js";
import { ResourceId } from "../domain/ResourceId.js";
import { StorageLocation } from "../domain/StorageLocation.js";
import type { ResourceRepository } from "../domain/ResourceRepository.js";
import type { ResourceStorage } from "../domain/ResourceStorage.js";
import {
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
  ResourceStorageFailedError,
  type ResourceError,
} from "../domain/errors/index.js";

export interface StoreResourceCommand {
  id: string;
  buffer: ArrayBuffer;
  originalName: string;
  mimeType: string;
}

export interface StoreResourceResult {
  resourceId: string;
  storageUri: string;
  size: number;
}

/**
 * Uploads a file buffer to storage and creates a Resource aggregate.
 */
export class StoreResource {
  constructor(
    private readonly repository: ResourceRepository,
    private readonly storage: ResourceStorage,
    private readonly storageProvider: string,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: StoreResourceCommand): Promise<Result<ResourceError, StoreResourceResult>> {
    // Validate required fields
    if (!command.originalName || command.originalName.trim() === "") {
      return Result.fail(new ResourceInvalidNameError());
    }

    if (!command.mimeType || command.mimeType.trim() === "") {
      return Result.fail(new ResourceInvalidMimeTypeError());
    }

    const resourceId = ResourceId.create(command.id);

    // Check for duplicates
    const exists = await this.repository.exists(resourceId);
    if (exists) {
      return Result.fail(new ResourceAlreadyExistsError(command.id));
    }

    // Upload to storage
    let uploadResult: { uri: string; size: number };
    try {
      uploadResult = await this.storage.upload({
        buffer: command.buffer,
        originalName: command.originalName,
        mimeType: command.mimeType,
      });
    } catch (error) {
      return Result.fail(
        new ResourceStorageFailedError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }

    // Create aggregate
    const storageLocation = StorageLocation.create(this.storageProvider, uploadResult.uri);
    const resource = Resource.store(
      resourceId,
      command.originalName,
      command.mimeType,
      uploadResult.size,
      storageLocation,
    );

    await this.repository.save(resource);
    await this.eventPublisher.publishAll(resource.clearEvents());

    return Result.ok({
      resourceId: command.id,
      storageUri: uploadResult.uri,
      size: uploadResult.size,
    });
  }
}
