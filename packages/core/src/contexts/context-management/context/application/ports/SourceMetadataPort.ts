/**
 * Port for reading source metadata (name, type) from the source library.
 * Consumed by GetContextDetails use case.
 * Implemented by SourceMetadataAdapter (wraps SourceIngestionService).
 */
export interface SourceMetadata {
  name: string;
  type: string;
}

export interface SourceMetadataPort {
  getSourceMetadata(sourceId: string): Promise<SourceMetadata | null>;
}
