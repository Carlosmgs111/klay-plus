/**
 * Port for reading source metadata (name, type) from the source library.
 * Consumed by GetContextDetail, ListContextSummary use cases.
 */
export interface SourceMetadata {
  name: string;
  type: string;
}

export interface SourceMetadataPort {
  getSourceMetadata(sourceId: string): Promise<SourceMetadata | null>;
}
