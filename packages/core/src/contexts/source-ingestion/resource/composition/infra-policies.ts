import type { ResourceRepository } from "../domain/ResourceRepository.js";
import type { ResourceStorage } from "../domain/ResourceStorage.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

export interface ResourceInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  uploadPath?: string;
  [key: string]: unknown;
}

export interface ResolvedResourceInfra {
  repository: ResourceRepository;
  storage: ResourceStorage;
  storageProvider: string;
  eventPublisher: EventPublisher;
}
