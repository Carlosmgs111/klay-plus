import { describe, it, expect, beforeAll } from "vitest";
import { semanticQueryFactory } from "../semantic-query/composition/factory";
import { InMemoryVectorWriteStore } from "../../../shared/vector/InMemoryVectorWriteStore";
import { hashToVector } from "../../../shared/vector/hashVector";
import type { ExecuteSemanticQuery } from "../semantic-query/application/use-cases/ExecuteSemanticQuery";
import type { VectorEntry } from "../../../shared/vector/VectorEntry";
import { MMRRankingStrategy } from "../semantic-query/infrastructure/ranking/MMRRankingStrategy";
import type { SearchHit } from "../semantic-query/domain/ports/VectorReadStore";

describe("Knowledge Retrieval Context E2E", () => {
  let executeQuery: ExecuteSemanticQuery;
  let vectorWriteStore: InMemoryVectorWriteStore;

  const DIMENSIONS = 128;

  const testEntries: VectorEntry[] = [
    {
      id: "entry-1",
      sourceId: "unit-1",
      vector: hashToVector("machine learning algorithms and neural networks", DIMENSIONS),
      content: "Machine learning algorithms and neural networks are used for pattern recognition.",
      metadata: { domain: "ai", version: 1 },
    },
    {
      id: "entry-2",
      sourceId: "unit-2",
      vector: hashToVector("deep learning neural network training", DIMENSIONS),
      content: "Deep learning involves training neural networks with multiple layers.",
      metadata: { domain: "ai", version: 1 },
    },
    {
      id: "entry-3",
      sourceId: "unit-3",
      vector: hashToVector("database indexing and query optimization", DIMENSIONS),
      content: "Database indexing improves query performance through efficient data structures.",
      metadata: { domain: "databases", version: 2 },
    },
    {
      id: "entry-4",
      sourceId: "unit-4",
      vector: hashToVector("frontend react component architecture", DIMENSIONS),
      content: "React components follow a declarative architecture pattern.",
      metadata: { domain: "frontend", version: 1 },
    },
    {
      id: "entry-5",
      sourceId: "unit-5",
      vector: hashToVector("machine learning model training optimization", DIMENSIONS),
      content: "Model training optimization techniques improve convergence speed.",
      metadata: { domain: "ai", version: 3 },
    },
  ];

  beforeAll(async () => {
    vectorWriteStore = new InMemoryVectorWriteStore();
    await vectorWriteStore.upsert(testEntries);

    const { useCases } = await semanticQueryFactory({
      provider: "in-memory",
      vectorStoreConfig: { sharedEntries: vectorWriteStore.sharedEntries },
      embeddingDimensions: DIMENSIONS,
    });

    executeQuery = useCases.executeSemanticQuery;
  });

  it("should perform a semantic query", async () => {
    const result = await executeQuery.execute({
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
    const result = await executeQuery.execute({
      text: "machine learning algorithms and neural networks",
      topK: 1,
      minScore: 0.0,
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].sourceId).toBe("unit-1");
  });

  it("should filter low-scoring results with high relative threshold", async () => {
    // minScore is a relative threshold (normalized to best match = 1.0).
    // A high minScore keeps only results very close to the best match.
    const result = await executeQuery.execute({
      text: "machine learning algorithms and neural networks",
      topK: 5,
      minScore: 0.95,
    });

    expect(result).toBeDefined();
    // Should return fewer results than the full set — entries about
    // databases and frontend score much lower than the best AI match.
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThan(5);
  });

  it("should perform batch queries", async () => {
    const results = await Promise.all([
      executeQuery.execute({ text: "neural networks", topK: 2, minScore: 0.0 }),
      executeQuery.execute({ text: "database optimization", topK: 2, minScore: 0.0 }),
      executeQuery.execute({ text: "react components", topK: 2, minScore: 0.0 }),
    ]);

    expect(results).toHaveLength(3);
    expect(results[0].queryText).toBe("neural networks");
    expect(results[1].queryText).toBe("database optimization");
    expect(results[2].queryText).toBe("react components");
  });

  it("should expose executeSemanticQuery use case", async () => {
    expect(executeQuery).toBeDefined();
  });
});

// ── MMR Diversity Unit Test ───────────────────────────────────────────
// Tests MMRRankingStrategy directly with known synthetic vectors,
// bypassing the e2e normalization to verify the core algorithm.

describe("MMR Ranking Strategy", () => {
  it("should prioritize diverse results by penalizing redundant hits", async () => {
    const mmr = new MMRRankingStrategy(0.3); // diversity-heavy

    // Use exact unit vectors to make math deterministic:
    // queryVector = [1, 0, 0, 0]
    // hitA = [1, 0, 0, 0]       → cos(q,a) = 1.0  (perfect match)
    // hitB = [0.9, 0.44, 0, 0]  → |b|≈1, cos(q,b)≈0.9 (near-duplicate of A)
    // hitC = [0.5, 0, 0.866, 0] → |c|=1, cos(q,c)=0.5 (diverse direction)
    //
    // MMR round 1: A wins (0.3*1.0=0.30 > 0.3*0.9=0.27 > 0.3*0.5=0.15)
    // MMR round 2: C wins over B because B is highly similar to A
    //   B: 0.3*0.9 - 0.7*0.9 = -0.36
    //   C: 0.3*0.5 - 0.7*0.5 = -0.20  → C wins
    const queryVector = [1, 0, 0, 0];

    const hitA: SearchHit = {
      id: "a",
      sourceId: "src-a",
      content: "A",
      score: 0.9,
      vector: [1, 0, 0, 0],        // identical direction to query → cos = 1.0
      metadata: {},
    };
    const hitB: SearchHit = {
      id: "b",
      sourceId: "src-b",
      content: "B",
      score: 0.88,
      vector: [0.9, 0.44, 0, 0],   // near-duplicate of A (cos≈0.9), |b|≈1.0
      metadata: {},
    };
    const hitC: SearchHit = {
      id: "c",
      sourceId: "src-c",
      content: "C",
      score: 0.6,
      vector: [0.5, 0, 0.866, 0],  // diverse direction (cos=0.5, orthogonal to B's 2nd dim)
      metadata: {},
    };

    const ranked = await mmr.rerank("query", queryVector, [hitA, hitB, hitC]);

    // hitA must be first (cos=1.0, highest relevance with no redundancy yet)
    expect(ranked[0].id).toBe("a");

    // hitC (diverse) should rank before hitB (near-duplicate of A)
    const cIdx = ranked.findIndex((h) => h.id === "c");
    const bIdx = ranked.findIndex((h) => h.id === "b");
    expect(cIdx).toBeLessThan(bIdx);
  });
});

// ── Hybrid Search Test ────────────────────────────────────────────────

describe("Hybrid Search Strategy (BM25 + Dense)", () => {
  const DIMENSIONS = 128;

  it("should surface exact keyword match via BM25 contribution", async () => {
    const writeStore = new InMemoryVectorWriteStore();

    // A chunk with a very specific rare term ("quetzalcoatl") that BM25 will rank highly
    const exactMatchChunk: VectorEntry = {
      id: "exact-match",
      sourceId: "source-exact",
      vector: hashToVector("quetzalcoatl aztec mythology serpent deity", DIMENSIONS),
      content: "Quetzalcoatl is a feathered serpent deity in Aztec mythology.",
      metadata: {},
    };

    // Several semantically similar but non-matching chunks
    const otherChunks: VectorEntry[] = [
      {
        id: "other-1",
        sourceId: "source-other-1",
        vector: hashToVector("greek mythology zeus olympus gods", DIMENSIONS),
        content: "Zeus is the king of the gods in Greek mythology.",
        metadata: {},
      },
      {
        id: "other-2",
        sourceId: "source-other-2",
        vector: hashToVector("norse mythology odin thor vikings", DIMENSIONS),
        content: "Odin and Thor are central figures in Norse mythology.",
        metadata: {},
      },
      {
        id: "other-3",
        sourceId: "source-other-3",
        vector: hashToVector("egyptian mythology ra osiris pharaoh", DIMENSIONS),
        content: "Ra is the sun god in ancient Egyptian mythology.",
        metadata: {},
      },
    ];

    await writeStore.upsert([exactMatchChunk, ...otherChunks]);

    const { useCases } = await semanticQueryFactory({
      provider: "in-memory",
      vectorStoreConfig: { sharedEntries: writeStore.sharedEntries },
      embeddingDimensions: DIMENSIONS,
      retrieval: { search: "hybrid" },
    });

    const result = await useCases.executeSemanticQuery.execute({
      text: "quetzalcoatl",
      topK: 4,
      minScore: 0.0,
    });

    // The exact keyword match should appear in results due to BM25
    const sourceIds = result.items.map((item) => item.sourceId);
    expect(sourceIds).toContain("source-exact");
    // And it should rank first or near the top since BM25 heavily rewards exact term match
    expect(result.items[0].sourceId).toBe("source-exact");
  });
});
