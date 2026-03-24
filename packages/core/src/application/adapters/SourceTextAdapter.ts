import type { SourceQueries } from "../../contexts/source-ingestion/source/application/use-cases/SourceQueries";
import type { SourceTextPort } from "../ports/SourceTextPort";
import type { Result } from "../../shared/domain/Result";
import type { DomainError } from "../../shared/domain/errors";

export class SourceTextAdapter implements SourceTextPort {
  constructor(private readonly _sourceQueries: SourceQueries) {}

  getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>> {
    return this._sourceQueries.getExtractedText(sourceId);
  }
}
