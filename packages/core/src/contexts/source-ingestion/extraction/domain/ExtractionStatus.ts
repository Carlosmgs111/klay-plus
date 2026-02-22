export const ExtractionStatus = {
  Pending: "PENDING",
  Running: "RUNNING",
  Completed: "COMPLETED",
  Failed: "FAILED",
} as const;

export type ExtractionStatus = (typeof ExtractionStatus)[keyof typeof ExtractionStatus];
