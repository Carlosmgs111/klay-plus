import type { ResourceRepository } from "../../domain/ResourceRepository";
import type { EventPublisher } from "../../../../../shared/domain/EventPublisher";
import { Resource } from "../../domain/Resource";
import { ResourceId } from "../../domain/ResourceId";
import {
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
} from "../../domain/errors";
import { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

export interface RegisterExternalResourceInput {
  id: string;
  name: string;
  mimeType: string;
  uri: string;
  size?: number;
}

export interface RegisterExternalResourceSuccess {
  resourceId: string;
  storageUri: string;
}

export class RegisterExternalResource {
  constructor(
    private readonly resourceRepository: ResourceRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(
    params: RegisterExternalResourceInput,
  ): Promise<Result<DomainError, RegisterExternalResourceSuccess>> {
    if (!params.name || params.name.trim() === "") {
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

    const resource = Resource.reference(
      resourceId,
      params.name,
      params.mimeType,
      params.uri,
      params.size,
    );

    await this.resourceRepository.save(resource);
    await this.eventPublisher.publishAll(resource.clearEvents());

    return Result.ok({
      resourceId: params.id,
      storageUri: params.uri,
    });
  }
}
