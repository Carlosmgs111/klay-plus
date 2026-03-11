import type { InfrastructureProfile } from "./InfrastructureProfile";

export const PRESET_PROFILES: Record<string, InfrastructureProfile> = {
  "in-memory": {
    id: "in-memory",
    name: "In-Memory (Testing)",
    persistence: { type: "in-memory" },
    vectorStore: { type: "in-memory", dimensions: 128 },
    embedding: { type: "hash", dimensions: 128 },
    documentStorage: { type: "in-memory" },
  },
  browser: {
    id: "browser",
    name: "Browser",
    persistence: { type: "indexeddb" },
    vectorStore: { type: "indexeddb", dimensions: 384 },
    embedding: { type: "webllm", model: "Xenova/all-MiniLM-L6-v2" },
    documentStorage: { type: "browser" },
  },
  server: {
    id: "server",
    name: "Server (NeDB)",
    persistence: { type: "nedb" },
    vectorStore: { type: "nedb", dimensions: 128 },
    embedding: { type: "hash", dimensions: 128 },
    documentStorage: { type: "local", basePath: "./data/uploads" },
  },
};
