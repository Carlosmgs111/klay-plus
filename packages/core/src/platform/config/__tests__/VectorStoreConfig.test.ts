import { describe, it, expect } from "vitest";
import type { VectorStoreConfig, DistanceMetric } from "../VectorStoreConfig";

describe("VectorStoreConfig", () => {
  it("models in-memory vector store", () => {
    const cfg: VectorStoreConfig = { type: "in-memory", dimensions: 128, distanceMetric: "cosine" };
    expect(cfg.type).toBe("in-memory");
    expect(cfg.dimensions).toBe(128);
  });

  it("models IndexedDB vector store", () => {
    const cfg: VectorStoreConfig = { type: "indexeddb", dimensions: 384 };
    expect(cfg.dimensions).toBe(384);
  });

  it("models pgvector", () => {
    const cfg: VectorStoreConfig = {
      type: "pgvector",
      connection: { kind: "network", host: "localhost", port: 5432 },
      authRef: "PG_CREDENTIALS",
      dimensions: 1536,
      tableName: "embeddings",
      distanceMetric: "cosine",
      indexType: "hnsw",
    };
    if (cfg.type === "pgvector") {
      expect(cfg.indexType).toBe("hnsw");
      expect(cfg.tableName).toBe("embeddings");
    }
  });

  it("models Pinecone", () => {
    const cfg: VectorStoreConfig = {
      type: "pinecone",
      authRef: "PINECONE_API_KEY",
      indexName: "klay-prod",
      namespace: "production",
      dimensions: 1536,
      cloud: "aws",
      region: "us-east-1",
    };
    if (cfg.type === "pinecone") {
      expect(cfg.authRef).toBe("PINECONE_API_KEY");
      expect(cfg.namespace).toBe("production");
    }
  });

  it("supports all distance metrics", () => {
    const metrics: DistanceMetric[] = ["cosine", "euclidean", "dotProduct"];
    expect(metrics).toHaveLength(3);
  });
});
