/**
 * DTOs for the Knowledge Management orchestrator.
 *
 * These are pure data contracts — no domain logic, no framework dependencies.
 * All types use primitive/JSON-safe values only (no domain objects).
 *
 * The orchestrator receives these DTOs and orchestrates multi-step flows.
 * Adapters (UI, REST) construct these DTOs from their own input formats.
 */

export interface IngestAndAddSourceInput {
  /** Existing context to add the source to */
  contextId: string;
  /** ID for the new source */
  sourceId: string;
  /** Display name for the source */
  sourceName: string;
  /** URI of the content to ingest */
  uri: string;
  /** Raw file content — required for browser uploads where file:// URIs are not fetchable */
  content?: ArrayBuffer;
  /** Type of the source (e.g., "PLAIN_TEXT", "PDF") */
  sourceType: string;
  /** ID for the extraction job */
  extractionJobId: string;
  /** ID for the projection to create */
  projectionId: string;
  /** Type of projection (defaults to "EMBEDDING") */
  projectionType?: string;
  /** Processing profile to use for chunking/embedding */
  processingProfileId: string;
  /** Optional resource ID for file tracking */
  resourceId?: string;
}

export interface IngestAndAddSourceSuccess {
  sourceId: string;
  sourceKnowledgeId: string;
  contextId: string;
  projectionId: string;
  contentHash: string;
  extractedTextLength: number;
  chunksCount: number;
  dimensions: number;
  model: string;
  resourceId?: string;
}
