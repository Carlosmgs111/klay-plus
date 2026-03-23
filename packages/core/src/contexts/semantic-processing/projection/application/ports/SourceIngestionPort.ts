import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

/**
 * Port for accessing source existence and extracted text.
 * Consumed by ProcessSourceAllProfiles use case.
 * Implemented by SourceIngestionAdapter (wraps GetSource + GetExtractedText use cases).
 */
export interface SourceIngestionPort {
  sourceExists(sourceId: string): Promise<boolean>;
  getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>>;
}
