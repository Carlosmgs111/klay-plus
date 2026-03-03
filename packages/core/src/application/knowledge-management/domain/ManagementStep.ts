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
  CreateSourceKnowledge: "create-source-knowledge",
  Processing: "processing",
  RegisterProjection: "register-projection",
  AddToContext: "add-to-context",
} as const;

export type ManagementStep =
  (typeof ManagementStep)[keyof typeof ManagementStep];
