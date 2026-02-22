import type { ProjectionUseCases } from "../../projection/application/index.js";
import type { ProcessingProfileUseCases } from "../../processing-profile/application/index.js";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository.js";
import type { VectorEntry } from "../../../../platform/vector/VectorEntry";

// ─── Vector Store Config ────────────────────────────────────────────────────

/**
 * Configuration exposed for cross-context wiring.
 * Instead of sharing a VectorStore instance, we share the config
 * so each context can create its own store pointing to the same resource.
 */
export interface VectorStoreConfig {
  dbPath?: string;
  dbName?: string;
  sharedEntries?: Map<string, VectorEntry>;
}

// ─── Override Types ─────────────────────────────────────────────────────────

interface ProjectionOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  webLLMModelId?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  configOverrides?: Record<string, string>;
}

interface ProcessingProfileOverrides {
  provider?: string;
  dbPath?: string;
  dbName?: string;
}

// ─── Facade Policy ──────────────────────────────────────────────────────────

export interface SemanticProcessingFacadePolicy {
  provider: string;

  // ─── Database Configuration ────────────────────────────────────────────────

  /**
   * Database path for server-side persistence (NeDB).
   * @default "./data"
   */
  dbPath?: string;
  /**
   * Database name for browser-side persistence (IndexedDB).
   * @default "semantic-processing"
   */
  dbName?: string;

  // ─── Embedding Configuration ───────────────────────────────────────────────

  /**
   * Embedding dimensions for vector generation (hash embeddings only).
   * @default 128
   */
  embeddingDimensions?: number;

  /**
   * Embedding provider to use.
   * - "hash": Local deterministic embeddings (no API required)
   * - "openai": OpenAI text-embedding models (requires OPENAI_API_KEY)
   * - "cohere": Cohere embed models (requires COHERE_API_KEY)
   * - "huggingface": HuggingFace models (requires HUGGINGFACE_API_KEY)
   *
   * @default "hash" for in-memory, auto-detected for server
   */
  embeddingProvider?: string;

  /**
   * Model ID for the embedding provider.
   * @example "text-embedding-3-small" (OpenAI)
   * @example "embed-multilingual-v3.0" (Cohere)
   * @example "sentence-transformers/all-MiniLM-L6-v2" (HuggingFace)
   */
  embeddingModel?: string;

  // ─── Chunking Configuration ────────────────────────────────────────────────

  /**
   * Default chunking strategy type.
   * @default "recursive"
   */
  defaultChunkingStrategy?: string;

  // ─── Module Overrides ──────────────────────────────────────────────────────

  /**
   * Override policies for individual modules.
   * If not provided, modules inherit from the facade's type.
   */
  overrides?: {
    projection?: ProjectionOverrides;
    processingProfile?: ProcessingProfileOverrides;
  };

  // ─── Environment Configuration ─────────────────────────────────────────────

  /**
   * Configuration overrides for testing or explicit configuration.
   * When provided, these values take precedence over environment variables.
   *
   * @example
   * ```typescript
   * configOverrides: {
   *   OPENAI_API_KEY: "sk-...",
   *   COHERE_API_KEY: "...",
   * }
   * ```
   */
  configOverrides?: Record<string, string>;
}

// ─── Resolved Modules ───────────────────────────────────────────────────────

export interface ResolvedSemanticProcessingModules {
  projection: ProjectionUseCases;
  processingProfile: ProcessingProfileUseCases;
  /**
   * Exposed for cross-module wiring — GenerateProjection needs
   * to look up profiles at runtime.
   */
  profileRepository: ProcessingProfileRepository;
  /**
   * Configuration for cross-context vector store wiring.
   * Each context creates its own VectorReadStore/VectorWriteStore
   * pointing to the same physical resource via this config.
   */
  vectorStoreConfig: VectorStoreConfig;
}
