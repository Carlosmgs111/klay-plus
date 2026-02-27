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
} from "./domain/index.js";

export type { ResourceRepository, ResourceStorage, ResourceError } from "./domain/index.js";

export { StoreResource, RegisterExternalResource, DeleteResource, GetResource, ResourceUseCases } from "./application/index.js";
export type { StoreResourceCommand, StoreResourceResult, RegisterExternalResourceCommand, RegisterExternalResourceResult, DeleteResourceCommand } from "./application/index.js";

export { ResourceComposer, resourceFactory } from "./composition/index.js";
export type {
  ResourceInfrastructurePolicy,
  ResolvedResourceInfra,
  ResourceFactoryResult,
} from "./composition/index.js";
