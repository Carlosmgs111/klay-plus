/**
 * ProcessKnowledge — DTOs
 *
 * Pure data contracts for the cross-context pipeline workflow.
 */

// ── Input ────────────────────────────────────────────────────────────

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

// ── Output ───────────────────────────────────────────────────────────

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
