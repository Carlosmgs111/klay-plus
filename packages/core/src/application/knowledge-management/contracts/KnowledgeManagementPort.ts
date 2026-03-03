import type { Result } from "../../../shared/domain/Result";
import type { KnowledgeManagementError } from "../domain/KnowledgeManagementError";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "./dtos";

/**
 * KnowledgeManagementPort — the single public entry point for multi-step
 * lifecycle operations on existing contexts.
 *
 * This is a Port in the Hexagonal Architecture sense:
 * - Primary adapters (UI, REST) depend on this port
 * - The KnowledgeManagementOrchestrator implements this port
 * - The factory returns this port type (not the implementation)
 *
 * Only exposes flows that coordinate multiple bounded contexts.
 * Atomic operations (removeSource, rollbackContext, etc.) are
 * called directly on the service by the client.
 */
export interface KnowledgeManagementPort {
  /**
   * Ingests content from a URI, creates a SourceKnowledge hub, processes
   * the content to generate embeddings, and adds the source to an existing context.
   *
   * Multi-step flow: Ingestion → CreateSourceKnowledge → Processing → RegisterProjection → AddToContext
   */
  ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<Result<KnowledgeManagementError, IngestAndAddSourceSuccess>>;
}
