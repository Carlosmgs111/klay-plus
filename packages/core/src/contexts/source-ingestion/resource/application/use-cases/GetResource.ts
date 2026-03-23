import type { ResourceRepository } from "../../domain/ResourceRepository";
import type { Resource } from "../../domain/Resource";
import { ResourceId } from "../../domain/ResourceId";
import { ResourceNotFoundError } from "../../domain/errors";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

export interface GetResourceInput {
  id: string;
}

export class GetResource {
  constructor(
    private readonly resourceRepository: ResourceRepository,
  ) {}

  async execute(
    params: GetResourceInput,
  ): Promise<Result<DomainError, Resource>> {
    const resourceId = ResourceId.create(params.id);
    const resource = await this.resourceRepository.findById(resourceId);

    if (!resource) {
      return Result.fail(new ResourceNotFoundError(params.id));
    }

    return Result.ok(resource);
  }
}
