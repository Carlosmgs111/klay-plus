import type { SourceInfrastructurePolicy } from "../../source/composition/infra-policies.js";
import type { ExtractionInfrastructurePolicy } from "../../extraction/composition/infra-policies.js";
import type { SourceUseCases } from "../../source/application/index.js";
import type { ExtractionUseCases } from "../../extraction/application/index.js";
import type { SourceRepository } from "../../source/domain/SourceRepository.js";

// ─── Orchestrator Policy ──────────────────────────────────────────────────────

export type SourceIngestionInfraPolicy = "in-memory" | "browser" | "server";

export interface SourceIngestionOrchestratorPolicy {
  type: SourceIngestionInfraPolicy;
  /**
   * Database path for server-side persistence (NeDB).
   * @default "./data"
   */
  dbPath?: string;
  /**
   * Database name for browser-side persistence (IndexedDB).
   * @default "source-ingestion"
   */
  dbName?: string;
  /**
   * Override policies for individual modules.
   * If not provided, modules inherit from the orchestrator's type.
   */
  overrides?: {
    source?: Partial<SourceInfrastructurePolicy>;
    extraction?: Partial<ExtractionInfrastructurePolicy>;
  };
}

// ─── Resolved Modules ─────────────────────────────────────────────────────────

export interface ResolvedSourceIngestionModules {
  source: SourceUseCases;
  extraction: ExtractionUseCases;
  /** Repository exposed for orchestrator coordination */
  sourceRepository: SourceRepository;
}
