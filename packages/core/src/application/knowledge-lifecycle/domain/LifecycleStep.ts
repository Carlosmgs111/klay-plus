export const LifecycleStep = {
  RemoveSource: "remove-source",
  Reprocess: "reprocess",
  Rollback: "rollback",
  Link: "link",
  Unlink: "unlink",
} as const;

export type LifecycleStep =
  (typeof LifecycleStep)[keyof typeof LifecycleStep];
