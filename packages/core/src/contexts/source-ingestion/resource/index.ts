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

export { StoreResource } from "./application/use-cases/StoreResource";
export type {
  StoreResourceInput,
  StoreResourceSuccess,
} from "./application/use-cases/StoreResource";

export { RegisterExternalResource } from "./application/use-cases/RegisterExternalResource";
export type {
  RegisterExternalResourceInput,
  RegisterExternalResourceSuccess,
} from "./application/use-cases/RegisterExternalResource";

export { DeleteResource } from "./application/use-cases/DeleteResource";
export type { DeleteResourceInput } from "./application/use-cases/DeleteResource";

export { GetResource } from "./application/use-cases/GetResource";
export type { GetResourceInput } from "./application/use-cases/GetResource";
