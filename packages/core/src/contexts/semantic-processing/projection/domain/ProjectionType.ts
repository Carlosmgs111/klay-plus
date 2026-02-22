export const ProjectionType = {
  Embedding: "EMBEDDING",
  Summary: "SUMMARY",
  Keywords: "KEYWORDS",
  Classification: "CLASSIFICATION",
} as const;

export type ProjectionType = (typeof ProjectionType)[keyof typeof ProjectionType];
