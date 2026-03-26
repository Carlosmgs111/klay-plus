// ── Context Details ──────────────────────────────────────────────────

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

// ── Context Refs ────────────────────────────────────────────────────

export interface ContextRefDTO {
  id: string;
  name: string;
  state: string;
  requiredProfileId: string;
}

export interface ListContextsResult {
  contexts: ContextRefDTO[];
  total: number;
}

export interface GetSourceContextsResult {
  sourceId: string;
  contexts: ContextRefDTO[];
}

// ── Context Lifecycle ───────────────────────────────────────────────

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

export interface TransitionContextStateInput {
  contextId: string;
  targetState: "ACTIVE" | "DEPRECATED" | "ARCHIVED";
  reason?: string;
}

export interface TransitionContextStateResult {
  contextId: string;
  state: string;
}

export interface UpdateContextProfileInput {
  contextId: string;
  profileId: string;
}

export interface UpdateContextProfileResult {
  contextId: string;
  profileId: string;
  reconciled?: { processedCount: number; failedCount: number };
}

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

// ── Lineage ─────────────────────────────────────────────────────────

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
