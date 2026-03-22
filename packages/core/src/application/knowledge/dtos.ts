/**
 * DTOs for the unified Knowledge orchestrator.
 *
 * These are pure data contracts — no domain logic, no framework dependencies.
 * All types use primitive/JSON-safe values only (no domain objects).
 *
 * The orchestrator receives these DTOs and maps them to service calls.
 * Adapters (UI, REST) construct these DTOs from their own input formats.
 */

// ── Pipeline DTOs ──────────────────────────────────────────────────────

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
  retrievalOverride?: {
    ranking?: "passthrough" | "mmr" | "cross-encoder";
    mmrLambda?: number;
    crossEncoderModel?: string;
  };
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

// ── Context Details (replaces manifest queries) ──────────────────────

export interface GetContextDetailsInput {
  contextId: string;
}

export interface ProjectionSummaryDTO {
  projectionId: string;
  processingProfileId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

export interface ContextSourceDetailDTO {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  projections: ProjectionSummaryDTO[];
  // Backward compat (projection matching requiredProfile):
  projectionId?: string;
  chunksCount?: number;
  dimensions?: number;
  model?: string;
  addedAt: string;
}

export interface ContextVersionDTO {
  version: number;
  sourceIds: string[];
  reason: string;
  createdAt: string;
}

export interface GetContextDetailsResult {
  contextId: string;
  name: string;
  state: string;
  requiredProfileId: string;
  sources: ContextSourceDetailDTO[];
  versions: ContextVersionDTO[];
  status: "empty" | "partial" | "complete";
}

export interface EnrichedContextSummaryDTO {
  id: string;
  name: string;
  state: string;
  sourceCount: number;
  projectionCount: number;
  requiredProfileId: string;
  status: "empty" | "partial" | "complete";
}

export interface ListContextsSummaryResult {
  contexts: EnrichedContextSummaryDTO[];
}

// ── Source Library ──────────────────────────────────────────────────

export interface SourceSummaryDTO {
  id: string;
  name: string;
  type: string;
  uri: string;
  hasBeenExtracted: boolean;
  currentVersion: number | null;
  registeredAt: string;
}

export interface ListSourcesResult {
  sources: SourceSummaryDTO[];
  total: number;
}

export interface GetSourceInput {
  sourceId: string;
}

export interface SourceDetailDTO extends SourceSummaryDTO {
  versions: Array<{
    version: number;
    contentHash: string;
    extractedAt: string;
  }>;
  extractedTextPreview: string | null;
}

export interface GetSourceResult {
  source: SourceDetailDTO;
}

export interface GetSourceContextsInput {
  sourceId: string;
}

export interface ContextRefDTO {
  id: string;
  name: string;
  state: string;
  requiredProfileId: string;
}

export interface GetSourceContextsResult {
  sourceId: string;
  contexts: ContextRefDTO[];
}

export interface ListContextsResult {
  contexts: ContextRefDTO[];
  total: number;
}

// ── Declarative Entry Point ─────────────────────────────────────────

export interface ProcessKnowledgeInput {
  sourceId: string;

  // New source (present = needs ingestion)
  sourceName?: string;
  uri?: string;
  content?: ArrayBuffer;
  sourceType?: string;
  extractionJobId?: string;

  // Processing
  projectionId?: string;
  projectionType?: string;
  processingProfileId?: string;

  // Context (optional)
  contextId?: string;
}

export interface ProcessKnowledgeSuccess {
  sourceId: string;
  completedSteps: string[];

  // Ingestion (if executed)
  contentHash?: string;
  extractedTextLength?: number;
  extractedText?: string;

  // Processing (if executed)
  projectionId?: string;
  chunksCount?: number;
  dimensions?: number;
  model?: string;

  // Context (if executed)
  contextId?: string;
}

// ── Lifecycle DTOs ──────────────────────────────────────────────────

export interface RemoveSourceInput {
  contextId: string;
  sourceId: string;
}

export interface RemoveSourceResult {
  contextId: string;
  version: number;
}

export interface ReconcileProjectionsInput {
  contextId: string;
  profileId: string;
}

export interface ReconcileProjectionsResult {
  contextId: string;
  version: number;
  processedCount: number;
  failedCount: number;
}

export interface LinkContextsInput {
  sourceContextId: string;
  targetContextId: string;
  relationshipType: string;
}

export interface LinkContextsResult {
  sourceContextId: string;
  targetContextId: string;
}

export interface UnlinkContextsInput {
  sourceContextId: string;
  targetContextId: string;
}

export interface UnlinkContextsResult {
  sourceContextId: string;
  targetContextId: string;
}

export interface CreateContextInput {
  id: string;
  name: string;
  description: string;
  language: string;
  requiredProfileId: string;
  createdBy: string;
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface CreateContextResult {
  contextId: string;
  state: string;
}

export interface GetContextLineageInput {
  contextId: string;
}

export interface GetContextLineageResult {
  contextId: string;
  traces: Array<{
    fromContextId: string;
    toContextId: string;
    relationship: string;
    createdAt: string;
  }>;
}

export interface UpdateContextProfileInput {
  contextId: string;
  profileId: string;
}

export interface UpdateContextProfileResult {
  contextId: string;
  profileId: string;
  reconciled?: {
    processedCount: number;
    failedCount: number;
  };
}

export interface ProcessSourceAllProfilesInput {
  sourceId: string;
}

export interface ProcessSourceAllProfilesResult {
  sourceId: string;
  profileResults: Array<{
    profileId: string;
    processedCount: number;
    failedCount: number;
  }>;
  totalProcessed: number;
  totalFailed: number;
}

export interface ReconcileAllProfilesInput {
  contextId: string;
}

export interface ReconcileAllProfilesResult {
  contextId: string;
  profileResults: Array<{
    profileId: string;
    processedCount: number;
    failedCount: number;
  }>;
  totalProcessed: number;
  totalFailed: number;
}
