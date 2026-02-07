import type { SourceRepository } from "../domain/SourceRepository.js";
import type { SourceExtractor } from "../domain/SourceExtractor.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

export type SourceInfraPolicy = "in-memory" | "browser" | "server";

export interface SourceInfrastructurePolicy {
  type: SourceInfraPolicy;
  dbPath?: string;
  dbName?: string;
}

export interface ResolvedSourceInfra {
  repository: SourceRepository;
  extractor: SourceExtractor;
  eventPublisher: EventPublisher;
}
