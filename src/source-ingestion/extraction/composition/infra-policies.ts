import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { ContentExtractor } from "../domain/ContentExtractor.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

export type ExtractionInfraPolicy = "in-memory" | "browser" | "server";

export interface ExtractionInfrastructurePolicy {
  type: ExtractionInfraPolicy;
  dbPath?: string;
  dbName?: string;
  /** Optional custom content extractor. If not provided, a default composite extractor is created. */
  contentExtractor?: ContentExtractor;
}

export interface ResolvedExtractionInfra {
  repository: ExtractionJobRepository;
  extractor: ContentExtractor;
  eventPublisher: EventPublisher;
}
