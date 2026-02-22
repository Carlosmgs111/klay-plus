/**
 * DTOs for the Knowledge Pipeline orchestrator.
 *
 * These are pure data contracts — no domain logic, no framework dependencies.
 * All types use primitive/JSON-safe values only (no domain objects).
 *
 * The orchestrator receives these DTOs and maps them to facade calls.
 * Adapters (UI, REST) construct these DTOs from their own input formats.
 */

// ─── Full Pipeline ──────────────────────────────────────────────────────────

export interface ExecutePipelineInput {
  /** Unique ID for the source being ingested */
  sourceId: string;
  /** Human-readable name for the source */
  sourceName: string;
  /** URI pointing to the content (file path, URL, etc.) */
  uri: string;
  /** Source type as string (e.g., "PDF", "PLAIN_TEXT", "MARKDOWN") */
  sourceType: string;
  /** Unique ID for the extraction job */
  extractionJobId: string;
  /** Unique ID for the resource (optional — enables manifest tracking) */
  resourceId?: string;
  /** Unique ID for the projection */
  projectionId: string;
  /** Projection type (e.g., "EMBEDDING") — defaults to "EMBEDDING" if omitted */
  projectionType?: string;
  /** Processing profile ID — determines chunking and embedding strategies */
  processingProfileId: string;
  /** Unique ID for the semantic unit */
  semanticUnitId: string;
  /** Content language */
  language: string;
  /** Creator identifier */
  createdBy: string;
  /** Optional topics for the semantic unit */
  topics?: string[];
  /** Optional tags for the semantic unit */
  tags?: string[];
  /** Optional summary for the semantic unit */
  summary?: string;
  /** Optional attributes for the semantic unit */
  attributes?: Record<string, string>;
}

export interface ExecutePipelineSuccess {
  sourceId: string;
  unitId: string;
  projectionId: string;
  contentHash: string;
  extractedTextLength: number;
  chunksCount: number;
  dimensions: number;
  model: string;
  /** Resource ID if provided in input */
  resourceId?: string;
  /** Manifest ID if manifest tracking is enabled */
  manifestId?: string;
}

// ─── Granular: Ingest Document ───────────────────────────────────────────────

export interface IngestDocumentInput {
  sourceId: string;
  sourceName: string;
  uri: string;
  sourceType: string;
  extractionJobId: string;
}

export interface IngestDocumentSuccess {
  sourceId: string;
  jobId: string;
  contentHash: string;
  extractedText: string;
  metadata: Record<string, unknown>;
}

// ─── Granular: Process Document ──────────────────────────────────────────────

export interface ProcessDocumentInput {
  projectionId: string;
  semanticUnitId: string;
  semanticUnitVersion: number;
  content: string;
  projectionType?: string;
  /** Processing profile ID — determines chunking and embedding strategies */
  processingProfileId: string;
}

export interface ProcessDocumentSuccess {
  projectionId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

// ─── Granular: Catalog Document ──────────────────────────────────────────────

export interface CatalogDocumentInput {
  id: string;
  sourceId: string;
  sourceType: string;
  content: string;
  language: string;
  createdBy: string;
  topics?: string[];
  tags?: string[];
  summary?: string;
  attributes?: Record<string, string>;
}

export interface CatalogDocumentSuccess {
  unitId: string;
}

// ─── Processing Profile Management ──────────────────────────────────────────

export interface CreateProcessingProfileInput {
  id: string;
  name: string;
  chunkingStrategyId: string;
  embeddingStrategyId: string;
  configuration?: Record<string, unknown>;
}

export interface CreateProcessingProfileSuccess {
  profileId: string;
  version: number;
}

// ─── Granular: Search Knowledge ──────────────────────────────────────────────

export interface SearchKnowledgeInput {
  queryText: string;
  topK?: number;
  minScore?: number;
  filters?: Record<string, unknown>;
}

export interface SearchKnowledgeSuccess {
  queryText: string;
  items: Array<{
    semanticUnitId: string;
    content: string;
    score: number;
    version: number;
    metadata: Record<string, unknown>;
  }>;
  totalFound: number;
}

// ─── Manifest: Get Resource Manifest ─────────────────────────────────────────

export interface GetManifestInput {
  /** Query by resource ID */
  resourceId?: string;
  /** Query by source ID */
  sourceId?: string;
  /** Query by manifest ID */
  manifestId?: string;
}

export interface GetManifestSuccess {
  manifests: import("../domain/ContentManifest.js").ContentManifestEntry[];
}
