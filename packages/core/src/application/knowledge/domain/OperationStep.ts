/**
 * OperationStep — Identifies each stage of the knowledge orchestrator.
 *
 * Merges PipelineStep + LifecycleStep into a single enum.
 * Used by KnowledgeError to indicate which step failed
 * and which steps were completed before the failure.
 */
export const OperationStep = {
  // Pipeline steps
  Ingestion: "ingestion",
  Processing: "processing",
  Cataloging: "cataloging",
  Search: "search",
  // Lifecycle steps
  RemoveSource: "remove-source",
  ReconcileProjections: "reconcile-projections",
  Link: "link",
  Unlink: "unlink",
  CreateContext: "create-context",
  ActivateContext: "activate-context",
  TransitionState: "transition-state",
  UpdateContextProfile: "update-context-profile",
  ProcessSourceAllProfiles: "process-source-all-profiles",
} as const;

export type OperationStep = (typeof OperationStep)[keyof typeof OperationStep];
