import type { SourceUseCases } from "../../source/application/index.js";
import type { ExtractionUseCases } from "../../extraction/application/index.js";
import type { ResourceUseCases } from "../../resource/application/index.js";
import type { SourceRepository } from "../../source/domain/SourceRepository.js";
import type { ResourceRepository } from "../../resource/domain/ResourceRepository.js";

// ─── Override Types ─────────────────────────────────────────────────────────

interface SourceOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

interface ExtractionOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

interface ResourceOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
  uploadPath?: string;
}

// ─── Facade Policy ───────────────────────────────────────────────────────────

export interface SourceIngestionFacadePolicy {
  provider: string;
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
   * Upload path for local file storage.
   * @default "./uploads"
   */
  uploadPath?: string;
  /**
   * Override policies for individual modules.
   * If not provided, modules inherit from the facade's type.
   */
  overrides?: {
    source?: SourceOverrides;
    extraction?: ExtractionOverrides;
    resource?: ResourceOverrides;
  };
  /**
   * Configuration overrides for testing or explicit configuration.
   * When provided, these values take precedence over environment variables.
   *
   * @example
   * ```typescript
   * configOverrides: {
   *   KLAY_DB_PATH: "/tmp/test",
   *   OPENAI_API_KEY: "test-key",
   * }
   * ```
   */
  configOverrides?: Record<string, string>;
}

// ─── Resolved Modules ────────────────────────────────────────────────────────

export interface ResolvedSourceIngestionModules {
  source: SourceUseCases;
  extraction: ExtractionUseCases;
  resource: ResourceUseCases;
  /** Repository exposed for facade coordination */
  sourceRepository: SourceRepository;
  /** Repository exposed for facade coordination */
  resourceRepository: ResourceRepository;
}
