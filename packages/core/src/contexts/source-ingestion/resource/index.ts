/**
 * Resource Module - Public API
 *
 * This module manages physical file resources (upload, storage, lifecycle).
 * It handles both user-uploaded files and externally referenced resources.
 */

export {
  Resource,
  ResourceId,
  ResourceStatus,
  StorageLocation,
  ResourceStored,
  ResourceDeleted,
  // Domain Errors
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
  ResourceStorageFailedError,
} from "./domain";

export type { ResourceRepository, ResourceStorage, ResourceError } from "./domain";

export { resourceFactory } from "./composition";
export type {
  ResourceInfrastructurePolicy,
  ResolvedResourceInfra,
  ResourceFactoryResult,
} from "./composition";
