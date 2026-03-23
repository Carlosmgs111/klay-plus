import type { ResourceRepository } from "../../domain/ResourceRepository";
import type { ResourceStorage } from "../../domain/ResourceStorage";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import { ResourceId } from "../../domain/ResourceId";
import {
  ResourceNotFoundError,
  ResourceStorageFailedError,
} from "../../domain/errors";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

export interface DeleteResourceInput {
  id: string;
}

export class DeleteResource {
  constructor(
    private readonly resourceRepository: ResourceRepository,
    private readonly resourceStorage: ResourceStorage,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(
    params: DeleteResourceInput,
  ): Promise<Result<DomainError, void>> {
    const resourceId = ResourceId.create(params.id);
    const resource = await this.resourceRepository.findById(resourceId);

    if (!resource) {
      return Result.fail(new ResourceNotFoundError(params.id));
    }

    if (resource.provider !== "external" && resource.storageUri) {
      try {
        await this.resourceStorage.delete(resource.storageUri);
      } catch (error) {
        return Result.fail(
          new ResourceStorageFailedError(
            `Failed to delete from storage: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    }

    resource.markDeleted();
    await this.resourceRepository.save(resource);
    await this.eventPublisher.publishAll(resource.clearEvents());

    return Result.ok(undefined);
  }
}
