import type { SemanticUnitRepository } from "../semantic-unit/domain/SemanticUnitRepository.js";
import type { KnowledgeLineageRepository } from "../lineage/domain/KnowledgeLineageRepository.js";
import type { EventPublisher } from "../../shared/domain/EventPublisher.js";

export type SemanticKnowledgeInfraPolicy = "in-memory" | "browser" | "server";

export interface SemanticKnowledgeInfrastructurePolicy {
  type: SemanticKnowledgeInfraPolicy;
  /** NeDB file path prefix (server only). Omit for in-memory NeDB. */
  dbPath?: string;
  /** IndexedDB database name (browser only). Defaults to "knowledge-platform". */
  dbName?: string;
}

export interface ResolvedSemanticKnowledgeInfra {
  semanticUnitRepository: SemanticUnitRepository;
  lineageRepository: KnowledgeLineageRepository;
  eventPublisher: EventPublisher;
}
