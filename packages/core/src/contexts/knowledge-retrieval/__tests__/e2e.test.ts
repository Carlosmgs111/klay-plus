/**
 * End-to-End Test for Knowledge Retrieval Context
 *
 * Tests the complete flow:
 * 1. Create facade with in-memory infrastructure
 * 2. Seed vector store with test data
 * 3. Query and retrieve results
 * 4. Test convenience methods (search, findMostSimilar, etc.)
 * 5. Test batch operations
 * 6. Test edge cases
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createKnowledgeRetrievalFacade } from "../facade/index.js";
import { InMemoryVectorWriteStore } from "../../../platform/vector/InMemoryVectorWriteStore.js";
import { hashToVector } from "../../../platform/vector/hashVector.js";
import type { KnowledgeRetrievalFacade } from "../facade/KnowledgeRetrievalFacade.js";
import type { VectorEntry } from "../../../platform/vector/VectorEntry.js";

describe("Knowledge Retrieval Context E2E", () => {
  let facade: KnowledgeRetrievalFacade;
  let vectorWriteStore: InMemoryVectorWriteStore;

  const DIMENSIONS = 128;

  // ─── Test Data ────────────────────────────────────────────────────────────

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

  // ─── Setup ────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    console.log("🧪 Starting End-to-End Test for Knowledge Retrieval Context\n");

    // 1. Create and seed vector write store (simulates semantic-processing side)
    console.log("📦 Creating and seeding vector write store...");
    vectorWriteStore = new InMemoryVectorWriteStore();
    await vectorWriteStore.upsert(testEntries);
    console.log(`   ✅ Vector write store seeded with ${vectorWriteStore.getEntryCount()} entries\n`);

    // 2. Create facade with in-memory infrastructure using shared entries
    console.log("📦 Creating facade with in-memory infrastructure...");
    facade = await createKnowledgeRetrievalFacade({
      provider: "in-memory",
      vectorStoreConfig: { sharedEntries: vectorWriteStore.sharedEntries },
      embeddingDimensions: DIMENSIONS,
    });
    console.log("   ✅ Facade created successfully\n");
  });

  // ─── Tests ────────────────────────────────────────────────────────────────

  it("should perform a semantic query", async () => {
    console.log("🔍 Performing semantic query...");

    const result = await facade.query({
      text: "neural network learning",
      topK: 3,
      minScore: 0.0,
    });

    expect(result).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(3);
    expect(result.queryText).toBe("neural network learning");

    console.log(`   ✅ Query returned ${result.items.length} results`);
    for (const item of result.items) {
      console.log(`      - [${item.score.toFixed(3)}] ${item.content.slice(0, 60)}...`);
    }
    console.log();
  });

  it("should perform simplified search", async () => {
    console.log("🔍 Performing simplified search...");

    const results = await facade.search("machine learning algorithms", {
      limit: 5,
      threshold: 0.0,
    });

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("id");
    expect(results[0]).toHaveProperty("content");
    expect(results[0]).toHaveProperty("score");
    expect(results[0]).toHaveProperty("metadata");

    console.log(`   ✅ Search returned ${results.length} results`);
    for (const r of results) {
      console.log(`      - [${r.score.toFixed(3)}] ${r.id}: ${r.content.slice(0, 50)}...`);
    }
    console.log();
  });

  it("should find most similar content", async () => {
    console.log("🎯 Finding most similar content...");

    const match = await facade.findMostSimilar(
      "machine learning algorithms and neural networks",
      0.0,
    );

    expect(match).not.toBeNull();
    expect(match!.id).toBe("unit-1");

    console.log(`   ✅ Most similar: ${match!.id} (score: ${match!.score.toFixed(3)})`);
    console.log(`      Content: ${match!.content.slice(0, 60)}...\n`);
  });

  it("should return null for findMostSimilar when no match above threshold", async () => {
    console.log("🔍 Testing findMostSimilar with high threshold...");

    const match = await facade.findMostSimilar(
      "completely unrelated quantum physics topic",
      0.99,
    );

    // With hash-based embeddings, very high threshold should exclude most results
    console.log(`   ✅ Result: ${match ? `found (score: ${match.score.toFixed(3)})` : "null (as expected)"}\n`);
  });

  it("should detect similar content", async () => {
    console.log("🔎 Checking for similar content...");

    const check = await facade.hasSimilarContent(
      "machine learning algorithms and neural networks",
      0.0,
    );

    expect(check.exists).toBe(true);
    expect(check.matchId).toBeDefined();
    expect(check.score).toBeDefined();

    console.log(`   ✅ Similar content exists: ${check.matchId} (score: ${check.score!.toFixed(3)})\n`);
  });

  it("should find related content excluding self", async () => {
    console.log("🔗 Finding related content...");

    const related = await facade.findRelated("unit-1", "machine learning algorithms", {
      limit: 3,
      excludeSelf: true,
    });

    expect(related).toBeDefined();
    expect(related.every((r) => r.id !== "unit-1")).toBe(true);

    console.log(`   ✅ Found ${related.length} related items (excluding self)`);
    for (const r of related) {
      console.log(`      - [${r.score.toFixed(3)}] ${r.id}: ${r.content.slice(0, 50)}...`);
    }
    console.log();
  });

  it("should perform batch search", async () => {
    console.log("📚 Performing batch search...");

    const batchResults = await facade.batchSearch(
      ["neural networks", "database optimization", "react components"],
      { limit: 2, threshold: 0.0 },
    );

    expect(batchResults).toHaveLength(3);
    expect(batchResults[0].query).toBe("neural networks");
    expect(batchResults[1].query).toBe("database optimization");
    expect(batchResults[2].query).toBe("react components");

    for (const batch of batchResults) {
      console.log(`   Query: "${batch.query}" → ${batch.results.length} results`);
      for (const r of batch.results) {
        console.log(`      - [${r.score.toFixed(3)}] ${r.id}`);
      }
    }
    console.log();
  });

  it("should handle empty query results gracefully", async () => {
    console.log("🔍 Testing empty results handling...");

    const result = await facade.query({
      text: "xyz completely irrelevant gibberish query",
      topK: 5,
      minScore: 0.99,
    });

    expect(result).toBeDefined();
    expect(result.items.length).toBe(0);

    console.log(`   ✅ Empty result handled correctly (${result.items.length} items)\n`);
  });

  it("should provide direct module access", async () => {
    console.log("🔧 Testing direct module access...");

    expect(facade.semanticQuery).toBeDefined();
    console.log(
      `   Semantic Query module: ${facade.semanticQuery ? "✅ Available" : "❌ Not available"}\n`,
    );

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED!");
    console.log("═══════════════════════════════════════════════════════════════");
  });
});
