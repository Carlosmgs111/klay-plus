import type { GetSource } from "../../../../source-ingestion/source/application/use-cases/GetSource";
import type { GetExtractedText } from "../../../../source-ingestion/source/application/use-cases/GetExtractedText";
import type { SourceIngestionPort } from "../../application/ports/SourceIngestionPort";
import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";

/**
 * Adapts GetSource + GetExtractedText use cases to the SourceIngestionPort interface.
 */
export class SourceIngestionAdapter implements SourceIngestionPort {
  constructor(
    private readonly _getSource: GetSource,
    private readonly _getExtractedText: GetExtractedText,
  ) {}

  async sourceExists(sourceId: string): Promise<boolean> {
    const source = await this._getSource.execute({ sourceId });
    return source !== null;
  }

  getExtractedText(sourceId: string): Promise<Result<DomainError, { text: string }>> {
    return this._getExtractedText.execute({ sourceId });
  }
}
