/**
 * Pipeline Step - Identifies each stage of the knowledge pipeline.
 *
 * Used by KnowledgePipelineError to indicate which step failed
 * and which steps were completed before the failure.
 */
export const PipelineStep = {
  Ingestion: "ingestion",
  Processing: "processing",
  Cataloging: "cataloging",
  Search: "search",
} as const;

export type PipelineStep = (typeof PipelineStep)[keyof typeof PipelineStep];
