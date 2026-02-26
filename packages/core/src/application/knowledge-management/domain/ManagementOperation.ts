/**
 * Management Operation - Identifies each lifecycle operation on existing semantic units.
 *
 * Used by KnowledgeManagementError to indicate which operation failed.
 * Unlike PipelineStep, these are atomic operations (no multi-step tracking needed).
 */
export const ManagementOperation = {
  AddSource: "add-source",
  RemoveSource: "remove-source",
  ReprocessUnit: "reprocess-unit",
  RollbackUnit: "rollback-unit",
  AddProjection: "add-projection",
  LinkUnits: "link-units",
} as const;

export type ManagementOperation =
  (typeof ManagementOperation)[keyof typeof ManagementOperation];
