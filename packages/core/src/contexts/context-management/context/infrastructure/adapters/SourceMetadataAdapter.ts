import type { GetSource } from "../../../../source-ingestion/source/application/use-cases/GetSource";
import type { SourceMetadata, SourceMetadataPort } from "../../application/ports/SourceMetadataPort";

/**
 * Adapts GetSource use case to the SourceMetadataPort interface.
 */
export class SourceMetadataAdapter implements SourceMetadataPort {
  constructor(private readonly getSource: GetSource) {}

  async getSourceMetadata(sourceId: string): Promise<SourceMetadata | null> {
    const source = await this.getSource.execute({ sourceId });
    if (!source) return null;
    return { name: source.name, type: source.type };
  }
}
