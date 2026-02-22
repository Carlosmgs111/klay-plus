export { Resource } from "./Resource.js";
export { ResourceId } from "./ResourceId.js";
export { ResourceStatus } from "./ResourceStatus.js";
export { StorageLocation } from "./StorageLocation.js";
export type { ResourceStorage } from "./ResourceStorage.js";
export type { ResourceRepository } from "./ResourceRepository.js";

export { ResourceStored } from "./events/ResourceStored.js";
export { ResourceDeleted } from "./events/ResourceDeleted.js";

// Domain Errors
export {
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
  ResourceStorageFailedError,
  type ResourceError,
} from "./errors/index.js";
