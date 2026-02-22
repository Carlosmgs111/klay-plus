import type { EventPublisher } from "../../../../shared/domain/index";
import { Result } from "../../../../shared/domain/Result";
import { ResourceId } from "../domain/ResourceId.js";
import type { ResourceRepository } from "../domain/ResourceRepository.js";
import type { ResourceStorage } from "../domain/ResourceStorage.js";
import {
  ResourceNotFoundError,
  ResourceStorageFailedError,
  type ResourceError,
} from "../domain/errors/index.js";

export interface DeleteResourceCommand {
  id: string;
}

/**
 * Deletes a resource from storage and marks the aggregate as deleted.
 * For external resources (provider === "external"), only the aggregate is updated.
 */
export class DeleteResource {
  constructor(
    private readonly repository: ResourceRepository,
    private readonly storage: ResourceStorage,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: DeleteResourceCommand): Promise<Result<ResourceError, void>> {
    const resourceId = ResourceId.create(command.id);
    const resource = await this.repository.findById(resourceId);

    if (!resource) {
      return Result.fail(new ResourceNotFoundError(command.id));
    }

    // Delete from physical storage if not external
    if (resource.provider !== "external" && resource.storageUri) {
      try {
        await this.storage.delete(resource.storageUri);
      } catch (error) {
        return Result.fail(
          new ResourceStorageFailedError(
            `Failed to delete from storage: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    }

    resource.markDeleted();
    await this.repository.save(resource);
    await this.eventPublisher.publishAll(resource.clearEvents());

    return Result.ok(undefined);
  }
}
