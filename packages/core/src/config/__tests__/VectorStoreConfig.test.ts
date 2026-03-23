import { describe, it, expect } from "vitest";
import type { VectorStoreConfig, DistanceMetric } from "../InfrastructureProfile";

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

  it("models NeDB vector store", () => {
    const cfg: VectorStoreConfig = { type: "nedb", dimensions: 128, path: "./data" };
    expect(cfg.type).toBe("nedb");
    expect(cfg.dimensions).toBe(128);
  });

  it("supports all distance metrics", () => {
    const metrics: DistanceMetric[] = ["cosine", "euclidean", "dotProduct"];
    expect(metrics).toHaveLength(3);
  });
});
