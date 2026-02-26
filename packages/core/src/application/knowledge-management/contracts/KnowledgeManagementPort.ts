import type { Result } from "../../../shared/domain/Result.js";
import type { KnowledgeManagementError } from "../domain/KnowledgeManagementError.js";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "./dtos.js";

/**
 * KnowledgeManagementPort — the single public entry point for multi-step
 * lifecycle operations on existing semantic units.
 *
 * This is a Port in the Hexagonal Architecture sense:
 * - Primary adapters (UI, REST) depend on this port
 * - The KnowledgeManagementOrchestrator implements this port
 * - The factory returns this port type (not the implementation)
 *
 * Only exposes flows that coordinate multiple bounded contexts.
 * Atomic operations (removeSource, rollbackUnit, linkUnits, etc.) are
 * called directly on the facade by the client.
 */
export interface KnowledgeManagementPort {
  /**
   * Ingests content from a URI, adds it as a source to an existing semantic unit,
   * and processes it to generate embeddings.
   *
   * Multi-step flow: Ingestion → AddSource → Processing
   */
  ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<Result<KnowledgeManagementError, IngestAndAddSourceSuccess>>;
}
