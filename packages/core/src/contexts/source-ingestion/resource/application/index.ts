import type { ResourceRepository } from "../domain/ResourceRepository.js";
import type { ResourceStorage } from "../domain/ResourceStorage.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

// ─── Use Cases ─────────────────────────────────────────────────────
export { StoreResource } from "./StoreResource.js";
export type { StoreResourceCommand, StoreResourceResult } from "./StoreResource.js";

export { RegisterExternalResource } from "./RegisterExternalResource.js";
export type { RegisterExternalResourceCommand, RegisterExternalResourceResult } from "./RegisterExternalResource.js";

export { DeleteResource } from "./DeleteResource.js";
export type { DeleteResourceCommand } from "./DeleteResource.js";

export { GetResource } from "./GetResource.js";

// ─── Use Cases Facade ──────────────────────────────────────────────
import { StoreResource } from "./StoreResource.js";
import { RegisterExternalResource } from "./RegisterExternalResource.js";
import { DeleteResource } from "./DeleteResource.js";
import { GetResource } from "./GetResource.js";

export class ResourceUseCases {
  readonly storeResource: StoreResource;
  readonly registerExternalResource: RegisterExternalResource;
  readonly deleteResource: DeleteResource;
  readonly getResource: GetResource;

  constructor(
    repository: ResourceRepository,
    storage: ResourceStorage,
    storageProvider: string,
    eventPublisher: EventPublisher,
  ) {
    this.storeResource = new StoreResource(repository, storage, storageProvider, eventPublisher);
    this.registerExternalResource = new RegisterExternalResource(repository, eventPublisher);
    this.deleteResource = new DeleteResource(repository, storage, eventPublisher);
    this.getResource = new GetResource(repository);
  }
}
