export const LifecycleStep = {
  RemoveSource: "remove-source",
  Reprocess: "reprocess",
  Rollback: "rollback",
  Link: "link",
  Unlink: "unlink",
  CreateContext: "create-context",
  ArchiveContext: "archive-context",
  DeprecateContext: "deprecate-context",
  ActivateContext: "activate-context",
  GenerateProjection: "generate-projection",
} as const;

export type LifecycleStep =
  (typeof LifecycleStep)[keyof typeof LifecycleStep];
