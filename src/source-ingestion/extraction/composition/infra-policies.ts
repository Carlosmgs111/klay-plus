import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { SourceRepository } from "../../source/domain/SourceRepository.js";
import type { SourceExtractor } from "../../source/domain/SourceExtractor.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";

export type ExtractionInfraPolicy = "in-memory" | "browser" | "server";

export interface ExtractionInfrastructurePolicy {
  type: ExtractionInfraPolicy;
  dbPath?: string;
  dbName?: string;
  /** External source repository (from source module). Required for ExecuteExtraction. */
  sourceRepository?: SourceRepository;
  /** External source extractor (from source module). Required for ExecuteExtraction. */
  sourceExtractor?: SourceExtractor;
}

export interface ResolvedExtractionInfra {
  repository: ExtractionJobRepository;
  sourceRepository: SourceRepository;
  sourceExtractor: SourceExtractor;
  eventPublisher: EventPublisher;
}
