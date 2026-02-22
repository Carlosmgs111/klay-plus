export const ProjectionStatus = {
  Pending: "PENDING",
  Processing: "PROCESSING",
  Completed: "COMPLETED",
  Failed: "FAILED",
} as const;

export type ProjectionStatus = (typeof ProjectionStatus)[keyof typeof ProjectionStatus];
