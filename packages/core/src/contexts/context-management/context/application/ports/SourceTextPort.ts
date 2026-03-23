import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

/**
 * Port for retrieving extracted text content for a source.
 * Consumed by ReconcileProjections use case.
 * Implemented by SourceTextAdapter (wraps SourceIngestionService).
 */
export interface SourceTextPort {
  getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>>;
}
