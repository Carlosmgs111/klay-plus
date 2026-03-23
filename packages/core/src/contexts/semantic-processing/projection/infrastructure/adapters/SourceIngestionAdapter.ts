import type { SourceQueries } from "../../../../source-ingestion/source/application/use-cases/SourceQueries";
import type { SourceIngestionPort } from "../../application/ports/SourceIngestionPort";
import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

/**
 * Adapts SourceQueries to the SourceIngestionPort interface.
 * Updated to use SourceQueries directly instead of GetSource + GetExtractedText.
 */
export class SourceIngestionAdapter implements SourceIngestionPort {
  constructor(
    private readonly _sourceQueries: SourceQueries,
  ) {}

  async sourceExists(sourceId: string): Promise<boolean> {
    return this._sourceQueries.exists(sourceId);
  }

  getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>> {
    return this._sourceQueries.getExtractedText(sourceId);
  }
}
