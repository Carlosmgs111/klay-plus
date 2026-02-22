import type { VectorStoreConfig } from "../../semantic-query/composition/infra-policies.js";
import type { SemanticQueryUseCases } from "../../semantic-query/application/index.js";
import type { ResolvedSemanticQueryInfra } from "../../semantic-query/composition/infra-policies.js";

// ─── Override Types ─────────────────────────────────────────────────────────

/**
 * Override type for SemanticQuery module within the facade.
 * Does NOT include vectorStoreConfig (always inherited from facade).
 * Does NOT include the index signature from the module policy.
 */
interface SemanticQueryOverrides {
  provider?: string;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  webLLMModelId?: string;
  configOverrides?: Record<string, string>;
}

// ─── Facade Policy ───────────────────────────────────────────────────────────

export interface KnowledgeRetrievalFacadePolicy {
  provider: string;
  /**
   * Configuration for connecting to the vector store resource.
   * Replaces direct vectorStoreRef to eliminate cross-context coupling.
   */
  vectorStoreConfig: VectorStoreConfig;
  /**
   * Embedding dimensions - must match the embedding strategy used in processing.
   * @default 128
   */
  embeddingDimensions?: number;

  // ─── Embedding Configuration ──────────────────────────────────────────────

  /**
   * Embedding provider to use.
   * Must match the provider used in semantic-processing for vector compatibility.
   */
  embeddingProvider?: string;

  /**
   * Model ID for the embedding provider.
   * @example "text-embedding-3-small" (OpenAI)
   * @example "embed-multilingual-v3.0" (Cohere)
   * @example "sentence-transformers/all-MiniLM-L6-v2" (HuggingFace)
   */
  embeddingModel?: string;

  /**
   * Override policies for individual modules.
   * If not provided, modules inherit from the facade's type.
   */
  overrides?: {
    semanticQuery?: SemanticQueryOverrides;
  };
  /**
   * Configuration overrides for testing or explicit configuration.
   * When provided, these values take precedence over environment variables.
   *
   * Required keys depend on embeddingProvider:
   * - "openai" → OPENAI_API_KEY
   * - "cohere" → COHERE_API_KEY
   * - "huggingface" → HUGGINGFACE_API_KEY
   */
  configOverrides?: Record<string, string>;
}

// ─── Resolved Modules ────────────────────────────────────────────────────────

export interface ResolvedKnowledgeRetrievalModules {
  semanticQuery: SemanticQueryUseCases;
  /** Infrastructure exposed for facade coordination */
  semanticQueryInfra: ResolvedSemanticQueryInfra;
}
