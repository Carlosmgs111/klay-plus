export { Resource } from "./Resource";
export { ResourceId } from "./ResourceId";
export { ResourceStatus } from "./ResourceStatus";
export { StorageLocation } from "./StorageLocation";
export type { ResourceStorage } from "./ResourceStorage";
export type { ResourceRepository } from "./ResourceRepository";

export { ResourceStored } from "./events/ResourceStored";
export { ResourceDeleted } from "./events/ResourceDeleted";

// Domain Errors
export {
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
  ResourceStorageFailedError,
  type ResourceError,
} from "./errors";
