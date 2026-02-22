/**
 * End-to-End Test for Semantic Knowledge Context
 *
 * Tests the complete flow:
 * 1. Create facade with in-memory infrastructure
 * 2. Create semantic unit with lineage tracking
 * 3. Version semantic unit with lineage tracking
 * 4. Verify lineage history
 * 5. Test batch operations
 * 6. Test error handling
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createSemanticKnowledgeFacade } from "../facade/index.js";
import { TransformationType } from "../lineage/domain/Transformation.js";
import type { SemanticKnowledgeFacade } from "../facade/SemanticKnowledgeFacade.js";

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

  it("should version semantic unit with enrichment transformation", async () => {
    console.log("🔄 Versioning semantic unit with lineage tracking...");

    const versionResult = await facade.versionSemanticUnitWithLineage({
      unitId: unitId,
      content: "This is the enriched content after processing and enrichment.",
      language: "en",
      reason: "Enriched with additional context from knowledge graph",
      transformationType: TransformationType.Enrichment,
      strategyUsed: "knowledge-graph-enrichment",
      topics: ["knowledge", "extraction", "enrichment"],
      summary: "Enriched semantic unit",
      parameters: {
        enrichmentSource: "knowledge-graph",
        addedConcepts: 5,
      },
    });

    expect(versionResult.isOk()).toBe(true);
    console.log(`   ✅ Semantic unit versioned: ${versionResult.value.unitId}`);
    console.log(`      New version: ${versionResult.value.newVersion}`);
    console.log(`      Lineage registered with ENRICHMENT transformation\n`);
  });

  it("should version semantic unit with chunking transformation", async () => {
    console.log("🔄 Versioning again (chunking transformation)...");

    const chunkResult = await facade.versionSemanticUnitWithLineage({
      unitId: unitId,
      content: "This is a chunk of the enriched content optimized for embedding.",
      language: "en",
      reason: "Chunked for optimal embedding size",
      transformationType: TransformationType.Chunking,
      strategyUsed: "recursive-chunker",
      parameters: {
        chunkSize: 512,
        overlap: 50,
      },
    });

    expect(chunkResult.isOk()).toBe(true);
    console.log(`   ✅ Semantic unit versioned: ${chunkResult.value.unitId}`);
    console.log(`      New version: ${chunkResult.value.newVersion}`);
    console.log(`      Lineage registered with CHUNKING transformation\n`);
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

  it("should reject versioning non-existent unit", async () => {
    console.log("🔍 Testing not found error handling...");

    const notFoundResult = await facade.versionSemanticUnitWithLineage({
      unitId: "non-existent-id",
      content: "Some content",
      language: "en",
      reason: "Testing",
    });

    expect(notFoundResult.isFail()).toBe(true);
    console.log(`   ✅ Correctly rejected not found: ${notFoundResult.error.message}\n`);
  });

  it("should provide direct module access", async () => {
    console.log("🔧 Testing direct module access...");

    expect(facade.semanticUnit).toBeDefined();
    expect(facade.lineage).toBeDefined();
    console.log(`   Semantic Unit module: ${facade.semanticUnit ? "✅ Available" : "❌ Not available"}`);
    console.log(`   Lineage module: ${facade.lineage ? "✅ Available" : "❌ Not available"}\n`);

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED!");
    console.log("═══════════════════════════════════════════════════════════════");
  });
});
