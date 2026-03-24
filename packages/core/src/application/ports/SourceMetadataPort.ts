/**
 * Cross-context port for reading source metadata (name, type).
 * Consumed by application-layer ContextReadModel.
 * Implemented by SourceMetadataAdapter (wraps source-ingestion SourceQueries).
 */
export interface SourceMetadata {
  name: string;
  type: string;
}

export interface SourceMetadataPort {
  getSourceMetadata(sourceId: string): Promise<SourceMetadata | null>;
}
