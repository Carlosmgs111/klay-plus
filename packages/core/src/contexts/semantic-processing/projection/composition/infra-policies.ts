import type { SemanticProjectionRepository } from "../domain/SemanticProjectionRepository.js";
import type { VectorWriteStore } from "../domain/ports/VectorWriteStore.js";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher.js";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository.js";
import type { ProcessingProfileMaterializer } from "./ProcessingProfileMaterializer.js";

export interface ProjectionInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;

  /** Dimensions for hash embeddings (in-memory only). Defaults to 128. */
  embeddingDimensions?: number;

  /** WebLLM model ID (browser only). */
  webLLMModelId?: string;

  /**
   * Embedding provider to use. Defaults based on policy type:
   * - "in-memory" → "hash"
   * - "browser" → uses WebLLM
   * - "server" → "hash" (fallback) or specified provider
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
   * Configuration overrides for testing or explicit configuration.
   * When provided, these values are used instead of process.env.
   *
   * Required keys depend on embeddingProvider:
   * - "openai" → OPENAI_API_KEY
   * - "cohere" → COHERE_API_KEY
   * - "huggingface" → HUGGINGFACE_API_KEY
   */
  configOverrides?: Record<string, string>;
  [key: string]: unknown;
}

export interface ResolvedProjectionInfra {
  repository: SemanticProjectionRepository;
  profileRepository: ProcessingProfileRepository;
  materializer: ProcessingProfileMaterializer;
  vectorWriteStore: VectorWriteStore;
  eventPublisher: EventPublisher;
}
