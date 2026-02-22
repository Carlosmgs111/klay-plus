import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";

export interface LineageInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

export interface ResolvedLineageInfra {
  repository: KnowledgeLineageRepository;
  eventPublisher: EventPublisher;
}
