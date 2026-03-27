// ── Persistence ──────────────────────────────────────────────────────

export type PersistenceConfig =
  | { type: "in-memory" }
  | { type: "indexeddb"; databaseName?: string }
  | { type: "nedb"; path?: string };

// ── Vector Store ─────────────────────────────────────────────────────

export type DistanceMetric = "cosine" | "euclidean" | "dotProduct";

export type VectorStoreConfig =
  | { type: "in-memory"; dimensions: number; distanceMetric?: DistanceMetric }
  | { type: "indexeddb"; dimensions: number; databaseName?: string; distanceMetric?: DistanceMetric }
  | { type: "nedb"; dimensions: number; path?: string; distanceMetric?: DistanceMetric };

// ── Embedding ────────────────────────────────────────────────────────

export type EmbeddingConfig =
  | { type: "hash"; dimensions?: number }
  | { type: "webllm"; model?: string }
  | { type: "openai"; authRef: string; model: string; dimensions?: number; baseUrl?: string }
  | { type: "cohere"; authRef: string; model: string; dimensions?: number }
  | { type: "huggingface"; model?: string }
  | { type: "hf-inference"; authRef: string; model: string };

/** Fingerprint stored with each knowledge context to detect embedding incompatibilities */
export interface EmbeddingFingerprint {
  provider: string;
  model: string;
  dimensions: number;
  baseUrl?: string;
}

// ── Document Storage ─────────────────────────────────────────────────

export type DocumentStorageConfig =
  | { type: "in-memory" }
  | { type: "local"; basePath: string }
  | { type: "browser" };

// ── Retrieval ─────────────────────────────────────────────────────────

export type RetrievalConfig = {
  ranking?: "passthrough" | "mmr" | "cross-encoder";
  search?: "dense" | "hybrid";
  queryExpansion?: "none" | "multi-query" | "hyde";
  mmrLambda?: number;
  crossEncoderModel?: string;
};

// ── Infrastructure Profile ───────────────────────────────────────────

export interface InfrastructureProfile {
  id: string;
  name: string;
  persistence: PersistenceConfig;
  vectorStore: VectorStoreConfig;
  embedding: EmbeddingConfig;
  documentStorage: DocumentStorageConfig;
  retrieval?: RetrievalConfig;
}

// ── Preset Profiles ──────────────────────────────────────────────────

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
    vectorStore: { type: "indexeddb", dimensions: 128 },
    embedding: { type: "hash", dimensions: 128 },
    documentStorage: { type: "browser" },
  },
  server: {
    id: "server",
    name: "Server (NeDB)",
    persistence: { type: "nedb" },
    vectorStore: { type: "nedb", dimensions: 384 },
    embedding: { type: "huggingface", model: "Xenova/all-MiniLM-L6-v2" },
    documentStorage: { type: "local", basePath: "./data/uploads" },
  },
};

// ── defineConfig ─────────────────────────────────────────────────────

export interface KlayProfileConfig {
  persistence: PersistenceConfig;
  vectorStore: VectorStoreConfig;
  embedding: EmbeddingConfig;
  documentStorage: DocumentStorageConfig;
}

export interface KlayConfig {
  profiles: Record<string, KlayProfileConfig>;
}

/** Type-safe config helper for klay.config.ts files */
export function defineConfig(config: KlayConfig): KlayConfig {
  return config;
}
