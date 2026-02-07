import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

export type LineageInfraPolicy = "in-memory" | "browser" | "server";

export interface LineageInfrastructurePolicy {
  type: LineageInfraPolicy;
  dbPath?: string;
  dbName?: string;
}

export interface ResolvedLineageInfra {
  repository: KnowledgeLineageRepository;
  eventPublisher: EventPublisher;
}
