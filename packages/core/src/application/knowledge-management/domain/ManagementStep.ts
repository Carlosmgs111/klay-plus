/**
 * Management Step - Identifies each stage of the management orchestrator flow.
 *
 * Used by KnowledgeManagementError to indicate which step failed
 * and which steps were completed before the failure.
 *
 * Mirrors PipelineStep from the knowledge-pipeline module.
 */
export const ManagementStep = {
  Ingestion: "ingestion",
  AddSource: "add-source",
  Processing: "processing",
} as const;

export type ManagementStep =
  (typeof ManagementStep)[keyof typeof ManagementStep];
