/**
 * ContentManifest — tracks cross-context associations for a pipeline run.
 *
 * This is a plain serializable object, NOT a DDD aggregate.
 * The orchestrator is an application layer above bounded contexts,
 * and its entities are intentionally simple (same pattern as KnowledgePipelineError).
 *
 * A manifest records which artifacts were produced from a resource
 * across all pipeline steps:
 * - resource (physical file) → source-ingestion/resource
 * - source (logical reference) → source-ingestion/source
 * - extraction job → source-ingestion/extraction
 * - semantic unit → semantic-knowledge
 * - projection (vectors) → semantic-processing
 */
export interface ContentManifestEntry {
  /** Unique manifest ID */
  id: string;
  /** Resource ID (physical file in source-ingestion/resource) */
  resourceId: string;
  /** Source ID (logical reference in source-ingestion/source) */
  sourceId: string;
  /** Extraction job ID (in source-ingestion/extraction) */
  extractionJobId: string;
  /** Semantic unit ID (in semantic-knowledge) */
  semanticUnitId: string;
  /** Projection ID (in semantic-processing) */
  projectionId: string;
  /** Pipeline execution status */
  status: "partial" | "complete" | "failed";
  /** Steps that completed successfully */
  completedSteps: string[];
  /** Step where failure occurred (if status === "failed") */
  failedStep?: string;
  /** Content hash from extraction */
  contentHash?: string;
  /** Length of extracted text */
  extractedTextLength?: number;
  /** Number of chunks produced */
  chunksCount?: number;
  /** Embedding dimensions */
  dimensions?: number;
  /** Embedding model used */
  model?: string;
  /** Timestamp of manifest creation */
  createdAt: string;
  /** Timestamp of pipeline completion */
  completedAt?: string;
}
