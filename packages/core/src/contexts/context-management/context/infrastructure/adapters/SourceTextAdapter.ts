import type { SourceQueries } from "../../../../source-ingestion/source/application/use-cases/SourceQueries";
import type { SourceTextPort } from "../../application/ports/SourceTextPort";
import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

/**
 * Adapts SourceQueries to the SourceTextPort interface.
 * Updated to use SourceQueries.getExtractedText() directly.
 */
export class SourceTextAdapter implements SourceTextPort {
  constructor(private readonly _sourceQueries: SourceQueries) {}

  getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>> {
    return this._sourceQueries.getExtractedText(sourceId);
  }
}
