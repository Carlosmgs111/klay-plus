import type { SourceRepository } from "../source/domain/SourceRepository.js";
import type { ExtractionJobRepository } from "../extraction/domain/ExtractionJobRepository.js";
import type { SourceExtractor } from "../source/domain/SourceExtractor.js";
import type { EventPublisher } from "../../shared/domain/EventPublisher.js";

export type SourceIngestionInfraPolicy = "in-memory" | "browser" | "server";

export interface SourceIngestionInfrastructurePolicy {
  type: SourceIngestionInfraPolicy;
  dbPath?: string;
  dbName?: string;
}

export interface ResolvedSourceIngestionInfra {
  sourceRepository: SourceRepository;
  extractionJobRepository: ExtractionJobRepository;
  sourceExtractor: SourceExtractor;
  eventPublisher: EventPublisher;
}
