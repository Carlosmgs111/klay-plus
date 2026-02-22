import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

export interface SemanticUnitInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

export interface ResolvedSemanticUnitInfra {
  repository: SemanticUnitRepository;
  eventPublisher: EventPublisher;
}
