import type { EventPublisher } from "../../../../shared/domain/index.js";
import { Result } from "../../../../shared/domain/Result.js";
import { Resource } from "../domain/Resource.js";
import { ResourceId } from "../domain/ResourceId.js";
import type { ResourceRepository } from "../domain/ResourceRepository.js";
import {
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
  type ResourceError,
} from "../domain/errors/index.js";

export interface RegisterExternalResourceCommand {
  id: string;
  name: string;
  mimeType: string;
  uri: string;
  size?: number;
}

export interface RegisterExternalResourceResult {
  resourceId: string;
  storageUri: string;
}

/**
 * Registers an externally referenced resource (no upload needed).
 * The file already exists at the given URI.
 */
export class RegisterExternalResource {
  constructor(
    private readonly repository: ResourceRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(
    command: RegisterExternalResourceCommand,
  ): Promise<Result<ResourceError, RegisterExternalResourceResult>> {
    // Validate required fields
    if (!command.name || command.name.trim() === "") {
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

    const resource = Resource.reference(
      resourceId,
      command.name,
      command.mimeType,
      command.uri,
      command.size,
    );

    await this.repository.save(resource);
    await this.eventPublisher.publishAll(resource.clearEvents());

    return Result.ok({
      resourceId: command.id,
      storageUri: command.uri,
    });
  }
}
