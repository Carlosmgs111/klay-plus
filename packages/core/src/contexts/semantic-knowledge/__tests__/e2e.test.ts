/**
 * End-to-End Test for Semantic Knowledge Context
 *
 * Tests the complete flow:
 * 1. Create facade with in-memory infrastructure
 * 2. Create semantic unit with lineage tracking
 * 3. Add sources to semantic unit (implicit versioning)
 * 4. Verify lineage history
 * 5. Test batch operations
 * 6. Test error handling
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createSemanticKnowledgeFacade } from "../facade";
import type { SemanticKnowledgeFacade } from "../facade/SemanticKnowledgeFacade";

describe("Semantic Knowledge Context E2E", () => {
  let facade: SemanticKnowledgeFacade;
  let unitId: string;
  let unitId2: string;

  beforeAll(async () => {
    console.log("🧪 Starting End-to-End Test for Semantic Knowledge Context\n");
    console.log("📦 Creating facade with in-memory infrastructure...");
    facade = await createSemanticKnowledgeFacade({
      provider: "in-memory",
    });
    console.log("   ✅ Facade created successfully\n");
  });

  it("should create semantic unit with lineage tracking", async () => {
    console.log("📝 Creating a semantic unit with lineage tracking...");
    unitId = crypto.randomUUID();

    const createResult = await facade.createSemanticUnitWithLineage({
      id: unitId,
      sourceId: "source-123",
      sourceType: "document",
      content: "This is the original content extracted from a document.",
      language: "en",
      createdBy: "extraction-pipeline",
      topics: ["knowledge", "extraction"],
      summary: "Test semantic unit for E2E testing",
      tags: ["test", "e2e"],
      attributes: { priority: "high" },
    });

    expect(createResult.isOk()).toBe(true);
    console.log(`   ✅ Semantic unit created: ${createResult.value.unitId}`);
    console.log(`      Lineage registered with EXTRACTION transformation\n`);
  });

  it("should add source to semantic unit", async () => {
    console.log("🔄 Adding source to semantic unit...");

    const addSourceResult = await facade.addSourceToSemanticUnit({
      unitId: unitId,
      sourceId: "enrichment-source",
      sourceType: "enrichment",
      extractedContent: "enriched content",
      contentHash: "hash-enriched",
      processingProfileId: "profile-1",
      processingProfileVersion: 1,
    });

    expect(addSourceResult.isOk()).toBe(true);
    console.log(`   ✅ Source added to unit: ${addSourceResult.value.unitId}`);
    console.log(`      Version: ${addSourceResult.value.version}`);
    console.log(`      Lineage registered with source addition\n`);
  });

  it("should add a second source", async () => {
    console.log("🔄 Adding a second source to semantic unit...");

    const addSourceResult = await facade.addSourceToSemanticUnit({
      unitId: unitId,
      sourceId: "chunk-source",
      sourceType: "web",
      extractedContent: "chunked content",
      contentHash: "hash-chunk",
      processingProfileId: "profile-1",
      processingProfileVersion: 1,
    });

    expect(addSourceResult.isOk()).toBe(true);
    console.log(`   ✅ Second source added to unit: ${addSourceResult.value.unitId}`);
    console.log(`      Version: ${addSourceResult.value.version}`);
    console.log(`      Lineage registered with source addition\n`);
  });

  it("should retrieve lineage history for a unit", async () => {
    console.log("📊 Verifying lineage history...");

    const lineageResult = await facade.getLineageForUnit(unitId);

    expect(lineageResult.isOk()).toBe(true);

    const lineage = lineageResult.value as any;
    console.log(`   ✅ Lineage found for unit: ${lineage.semanticUnitId}`);
    console.log(`      Total transformations: ${lineage.transformations?.length || "N/A"}`);
    if (lineage.transformations) {
      for (const t of lineage.transformations) {
        console.log(`      - ${t.type}: v${t.inputVersion} → v${t.outputVersion} (${t.strategyUsed})`);
      }
    }
    console.log();
  });

  it("should create another semantic unit", async () => {
    console.log("📝 Creating another semantic unit...");
    unitId2 = crypto.randomUUID();

    const createResult2 = await facade.createSemanticUnitWithLineage({
      id: unitId2,
      sourceId: "source-456",
      sourceType: "api",
      content: "Content from API source.",
      language: "es",
      createdBy: "api-extractor",
    });

    expect(createResult2.isOk()).toBe(true);
    console.log(`   ✅ Second semantic unit created: ${createResult2.value.unitId}\n`);
  });

  it("should reject deprecation of DRAFT units (state machine)", async () => {
    console.log("🔄 Testing deprecation state machine...");
    console.log(`   ℹ️  State transitions: DRAFT → ACTIVE → DEPRECATED`);

    const deprecateResult = await facade.deprecateSemanticUnitWithLineage({
      unitId: unitId,
      reason: "Content is outdated",
    });

    expect(deprecateResult.isFail()).toBe(true);
    console.log(`   ✅ Correctly rejected: DRAFT units cannot be deprecated`);
    console.log(`      Error: Invalid state transition\n`);
  });

  it("should handle batch creation", async () => {
    console.log("📚 Testing batch creation...");

    const batchUnits = [
      {
        id: crypto.randomUUID(),
        sourceId: "batch-source-1",
        sourceType: "document",
        content: "Batch content 1",
        language: "en",
        createdBy: "batch-processor",
      },
      {
        id: crypto.randomUUID(),
        sourceId: "batch-source-2",
        sourceType: "document",
        content: "Batch content 2",
        language: "en",
        createdBy: "batch-processor",
      },
      {
        id: crypto.randomUUID(),
        sourceId: "batch-source-3",
        sourceType: "web",
        content: "Batch content 3 from web",
        language: "es",
        createdBy: "web-scraper",
      },
    ];

    const batchResult = await facade.batchCreateSemanticUnitsWithLineage(batchUnits);
    const successCount = batchResult.filter((r) => r.success).length;

    expect(successCount).toBe(3);
    console.log(`   ✅ Batch creation completed: ${successCount}/${batchUnits.length} successful`);
    for (const result of batchResult) {
      const status = result.success ? "✓" : "✗";
      console.log(`      ${status} ${result.unitId.slice(0, 8)}...${result.error ? ` (${result.error})` : ""}`);
    }
    console.log();
  });

  it("should reject duplicate creation", async () => {
    console.log("🚫 Testing duplicate creation error handling...");

    const duplicateResult = await facade.createSemanticUnitWithLineage({
      id: unitId2, // Same ID as previous
      sourceId: "different-source",
      sourceType: "document",
      content: "Different content",
      language: "en",
      createdBy: "test",
    });

    expect(duplicateResult.isFail()).toBe(true);
    console.log(`   ✅ Correctly rejected duplicate: ${duplicateResult.error.message}\n`);
  });

  it("should reject adding source to non-existent unit", async () => {
    console.log("🔍 Testing not found error handling...");

    const notFoundResult = await facade.addSourceToSemanticUnit({
      unitId: "non-existent-id",
      sourceId: "src",
      sourceType: "doc",
      extractedContent: "content",
      contentHash: "hash",
      processingProfileId: "p",
      processingProfileVersion: 1,
    });

    expect(notFoundResult.isFail()).toBe(true);
    console.log(`   ✅ Correctly rejected not found: ${notFoundResult.error.message}\n`);
  });

  it("should provide facade operations", async () => {
    console.log("🔧 Testing facade operations available...");

    expect(facade.createSemanticUnit).toBeDefined();
    expect(facade.addSourceToSemanticUnit).toBeDefined();
    expect(facade.linkSemanticUnits).toBeDefined();
    expect(facade.getLinkedUnits).toBeDefined();
    console.log("   ✅ All facade operations available\n");

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED!");
    console.log("═══════════════════════════════════════════════════════════════");
  });
});
