/**
 * DTOs for the Knowledge Pipeline orchestrator.
 *
 * These are pure data contracts — no domain logic, no framework dependencies.
 * All types use primitive/JSON-safe values only (no domain objects).
 *
 * The orchestrator receives these DTOs and maps them to service calls.
 * Adapters (UI, REST) construct these DTOs from their own input formats.
 */

export interface ExecutePipelineInput {
  /** Unique ID for the source being ingested */
  sourceId: string;
  /** Human-readable name for the source */
  sourceName: string;
  /** URI pointing to the content (file path, URL, etc.) */
  uri: string;
  /** Raw file content — required for browser mode where file:// URIs are not fetchable */
  content?: ArrayBuffer;
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
  /** Context ID — optional, groups sources and declares requiredProfileId */
  contextId?: string;
  /** Content language */
  language: string;
  /** Creator identifier */
  createdBy: string;
  /** Optional topics for the context */
  topics?: string[];
  /** Optional tags for the context */
  tags?: string[];
  /** Optional summary for the context */
  summary?: string;
  /** Optional attributes for the context */
  attributes?: Record<string, string>;
}

export interface ExecutePipelineSuccess {
  sourceId: string;
  /** Source-knowledge aggregate ID */
  sourceKnowledgeId: string;
  projectionId: string;
  contentHash: string;
  extractedTextLength: number;
  chunksCount: number;
  dimensions: number;
  model: string;
  /** Context ID if provided in input */
  contextId?: string;
  /** Resource ID if provided in input */
  resourceId?: string;
  /** Manifest ID if manifest tracking is enabled */
  manifestId?: string;
}

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

export interface ProcessDocumentInput {
  projectionId: string;
  /** Source ID — primary key for projection */
  sourceId: string;
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

export interface CatalogDocumentInput {
  /** Context ID */
  contextId: string;
  name: string;
  description: string;
  language: string;
  createdBy: string;
  /** Required processing profile ID for sources in this context */
  requiredProfileId: string;
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface CatalogDocumentSuccess {
  contextId: string;
}

export interface CreateProcessingProfileInput {
  id: string;
  name: string;
  preparation: { strategyId: string; config: Record<string, unknown> };
  fragmentation: { strategyId: string; config: Record<string, unknown> };
  projection: { strategyId: string; config: Record<string, unknown> };
}

export interface CreateProcessingProfileSuccess {
  profileId: string;
  version: number;
}

export interface SearchKnowledgeInput {
  queryText: string;
  topK?: number;
  minScore?: number;
  filters?: Record<string, unknown>;
}

export interface SearchKnowledgeSuccess {
  queryText: string;
  items: Array<{
    /** Source ID */
    sourceId: string;
    content: string;
    score: number;
    metadata: Record<string, unknown>;
  }>;
  totalFound: number;
}

export interface ListProfilesResult {
  profiles: Array<{
    id: string;
    name: string;
    version: number;
    preparation: { strategyId: string; config: Record<string, unknown> };
    fragmentation: { strategyId: string; config: Record<string, unknown> };
    projection: { strategyId: string; config: Record<string, unknown> };
    status: string;
    createdAt: string;
  }>;
}

export interface UpdateProfileInput {
  id: string;
  name?: string;
  preparation?: { strategyId: string; config: Record<string, unknown> };
  fragmentation?: { strategyId: string; config: Record<string, unknown> };
  projection?: { strategyId: string; config: Record<string, unknown> };
}

export interface UpdateProfileResult {
  profileId: string;
  version: number;
}

export interface DeprecateProfileInput {
  id: string;
  reason: string;
}

export interface DeprecateProfileResult {
  profileId: string;
}

export interface GetManifestInput {
  /** Query by resource ID */
  resourceId?: string;
  /** Query by source ID */
  sourceId?: string;
  /** Query by manifest ID */
  manifestId?: string;
  /** Query by context ID */
  contextId?: string;
}

export interface GetManifestSuccess {
  manifests: import("../domain/ContentManifest").ContentManifestEntry[];
}
