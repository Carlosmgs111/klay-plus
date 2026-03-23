import type { GetExtractedText } from "../../../../source-ingestion/source/application/use-cases/GetExtractedText";
import type { SourceTextPort } from "../../application/ports/SourceTextPort";
import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

/**
 * Adapts GetExtractedText use case to the SourceTextPort interface.
 */
export class SourceTextAdapter implements SourceTextPort {
  constructor(private readonly _getExtractedText: GetExtractedText) {}

  getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>> {
    return this._getExtractedText.execute({ sourceId });
  }
}
