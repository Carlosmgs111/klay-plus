export const ResourceStatus = {
  Pending: "PENDING",
  Stored: "STORED",
  Failed: "FAILED",
  Deleted: "DELETED",
} as const;

export type ResourceStatus = (typeof ResourceStatus)[keyof typeof ResourceStatus];
