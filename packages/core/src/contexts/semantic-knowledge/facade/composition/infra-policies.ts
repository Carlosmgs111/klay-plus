import type { SemanticUnitUseCases } from "../../semantic-unit/application/index.js";
import type { LineageUseCases } from "../../lineage/application/index.js";
import type { SemanticUnitRepository } from "../../semantic-unit/domain/SemanticUnitRepository.js";
import type { KnowledgeLineageRepository } from "../../lineage/domain/KnowledgeLineageRepository.js";

// ─── Override Types ─────────────────────────────────────────────────────────

interface SemanticUnitOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

interface LineageOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

// ─── Facade Policy ───────────────────────────────────────────────────────────

export interface SemanticKnowledgeFacadePolicy {
  provider: string;
  /**
   * Database path for server-side persistence (NeDB).
   * @default "./data"
   */
  dbPath?: string;
  /**
   * Database name for browser-side persistence (IndexedDB).
   * @default "semantic-knowledge"
   */
  dbName?: string;
  /**
   * Override policies for individual modules.
   * If not provided, modules inherit from the facade's type.
   */
  overrides?: {
    semanticUnit?: SemanticUnitOverrides;
    lineage?: LineageOverrides;
  };
  /**
   * Configuration overrides for testing or explicit configuration.
   * When provided, these values take precedence over environment variables.
   *
   * @example
   * ```typescript
   * configOverrides: {
   *   KLAY_DB_PATH: "/tmp/test",
   * }
   * ```
   */
  configOverrides?: Record<string, string>;
}

// ─── Resolved Modules ────────────────────────────────────────────────────────

export interface ResolvedSemanticKnowledgeModules {
  semanticUnit: SemanticUnitUseCases;
  lineage: LineageUseCases;
  /** Repository exposed for facade coordination */
  semanticUnitRepository: SemanticUnitRepository;
  /** Repository exposed for facade coordination */
  lineageRepository: KnowledgeLineageRepository;
}
