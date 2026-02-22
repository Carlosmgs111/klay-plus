import { Result } from "../../../../shared/domain/Result.js";
import type { Resource } from "../domain/Resource.js";
import { ResourceId } from "../domain/ResourceId.js";
import type { ResourceRepository } from "../domain/ResourceRepository.js";
import {
  ResourceNotFoundError,
  type ResourceError,
} from "../domain/errors/index.js";

/**
 * Retrieves a resource by its ID.
 */
export class GetResource {
  constructor(
    private readonly repository: ResourceRepository,
  ) {}

  async execute(id: string): Promise<Result<ResourceError, Resource>> {
    const resourceId = ResourceId.create(id);
    const resource = await this.repository.findById(resourceId);

    if (!resource) {
      return Result.fail(new ResourceNotFoundError(id));
    }

    return Result.ok(resource);
  }
}
