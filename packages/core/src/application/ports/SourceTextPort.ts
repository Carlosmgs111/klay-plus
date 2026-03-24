import type { Result } from "../../shared/domain/Result";
import type { DomainError } from "../../shared/domain/errors";

/**
 * Cross-context port for retrieving extracted text content for a source.
 * Consumed by application-layer orchestrators (ReconcileProjections).
 * Implemented by SourceTextAdapter (wraps source-ingestion SourceQueries).
 */
export interface SourceTextPort {
  getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>>;
}
