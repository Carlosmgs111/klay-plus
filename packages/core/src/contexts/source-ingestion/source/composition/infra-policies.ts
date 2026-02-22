import type { SourceRepository } from "../domain/SourceRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

export interface SourceInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

export interface ResolvedSourceInfra {
  repository: SourceRepository;
  eventPublisher: EventPublisher;
}
