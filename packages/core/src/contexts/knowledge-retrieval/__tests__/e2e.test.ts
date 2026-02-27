import { describe, it, expect, beforeAll } from "vitest";
import { createKnowledgeRetrievalFacade } from "../facade";
import { InMemoryVectorWriteStore } from "../../../platform/vector/InMemoryVectorWriteStore";
import { hashToVector } from "../../../platform/vector/hashVector";
import type { KnowledgeRetrievalFacade } from "../facade/KnowledgeRetrievalFacade";
import type { VectorEntry } from "../../../platform/vector/VectorEntry";

describe("Knowledge Retrieval Context E2E", () => {
  let facade: KnowledgeRetrievalFacade;
  let vectorWriteStore: InMemoryVectorWriteStore;

  const DIMENSIONS = 128;

  const testEntries: VectorEntry[] = [
    {
      id: "entry-1",
      semanticUnitId: "unit-1",
      vector: hashToVector("machine learning algorithms and neural networks", DIMENSIONS),
      content: "Machine learning algorithms and neural networks are used for pattern recognition.",
      metadata: { domain: "ai", version: 1 },
    },
    {
      id: "entry-2",
      semanticUnitId: "unit-2",
      vector: hashToVector("deep learning neural network training", DIMENSIONS),
      content: "Deep learning involves training neural networks with multiple layers.",
      metadata: { domain: "ai", version: 1 },
    },
    {
      id: "entry-3",
      semanticUnitId: "unit-3",
      vector: hashToVector("database indexing and query optimization", DIMENSIONS),
      content: "Database indexing improves query performance through efficient data structures.",
      metadata: { domain: "databases", version: 2 },
    },
    {
      id: "entry-4",
      semanticUnitId: "unit-4",
      vector: hashToVector("frontend react component architecture", DIMENSIONS),
      content: "React components follow a declarative architecture pattern.",
      metadata: { domain: "frontend", version: 1 },
    },
    {
      id: "entry-5",
      semanticUnitId: "unit-5",
      vector: hashToVector("machine learning model training optimization", DIMENSIONS),
      content: "Model training optimization techniques improve convergence speed.",
      metadata: { domain: "ai", version: 3 },
    },
  ];

  beforeAll(async () => {
    vectorWriteStore = new InMemoryVectorWriteStore();
    await vectorWriteStore.upsert(testEntries);

    facade = await createKnowledgeRetrievalFacade({
      provider: "in-memory",
      vectorStoreConfig: { sharedEntries: vectorWriteStore.sharedEntries },
      embeddingDimensions: DIMENSIONS,
    });
  });

  it("should perform a semantic query", async () => {
    const result = await facade.query({
      text: "neural network learning",
      topK: 3,
      minScore: 0.0,
    });

    expect(result).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(3);
    expect(result.queryText).toBe("neural network learning");
  });

  it("should find best match with topK=1", async () => {
    const result = await facade.query({
      text: "machine learning algorithms and neural networks",
      topK: 1,
      minScore: 0.0,
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].semanticUnitId).toBe("unit-1");
  });

  it("should return empty results for high threshold", async () => {
    const result = await facade.query({
      text: "xyz completely irrelevant gibberish query",
      topK: 5,
      minScore: 0.99,
    });

    expect(result).toBeDefined();
    expect(result.items.length).toBe(0);
  });

  it("should perform batch queries", async () => {
    const results = await facade.batchQuery([
      { text: "neural networks", topK: 2, minScore: 0.0 },
      { text: "database optimization", topK: 2, minScore: 0.0 },
      { text: "react components", topK: 2, minScore: 0.0 },
    ]);

    expect(results).toHaveLength(3);
    expect(results[0].queryText).toBe("neural networks");
    expect(results[1].queryText).toBe("database optimization");
    expect(results[2].queryText).toBe("react components");
  });

  it("should provide direct module access", async () => {
    expect(facade.semanticQuery).toBeDefined();
  });
});
