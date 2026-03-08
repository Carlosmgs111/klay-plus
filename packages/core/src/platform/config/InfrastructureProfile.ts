export interface InfrastructureProfile {
  persistence: string;
  vectorStore: string;
  documentStorage: string;
  embedding: string;
  embeddingModel?: string;
  embeddingDimensions?: number;
}

export const DEFAULT_PROFILES: Record<string, InfrastructureProfile> = {
  "in-memory": {
    persistence: "in-memory",
    vectorStore: "in-memory",
    documentStorage: "in-memory",
    embedding: "hash",
    embeddingDimensions: 128,
  },
  browser: {
    persistence: "browser",
    vectorStore: "browser",
    documentStorage: "browser",
    embedding: "hash",
    embeddingDimensions: 128,
  },
  server: {
    persistence: "server",
    vectorStore: "server",
    documentStorage: "server",
    embedding: "hash",
  },
};
