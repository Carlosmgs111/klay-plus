import type { SourceQueries } from "../../contexts/source-ingestion/source/application/use-cases/SourceQueries";
import type { SourceMetadata, SourceMetadataPort } from "../ports/SourceMetadataPort";

export class SourceMetadataAdapter implements SourceMetadataPort {
  constructor(private readonly _sourceQueries: SourceQueries) {}

  async getSourceMetadata(sourceId: string): Promise<SourceMetadata | null> {
    const source = await this._sourceQueries.getById(sourceId);
    if (!source) return null;
    return { name: source.name, type: source.type };
  }
}
