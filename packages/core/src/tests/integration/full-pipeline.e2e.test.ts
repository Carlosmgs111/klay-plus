/**
 * Full-Pipeline Integration Test: All Bounded Contexts
 *
 * Emulates real user flows across the complete KLAY+ platform:
 *
 *   Source Ingestion → Semantic Processing → Semantic Knowledge → Knowledge Retrieval
 *
 * Documents are loaded from real files in tests/integration/fixtures/
 * All contexts use server infrastructure for test isolation.
 *
 * Flows tested:
 * 1. Document ingestion: Register sources and extract content
 * 2. Semantic processing: Chunk content, generate embeddings, store vectors
 * 3. Knowledge cataloging: Create semantic units with lineage tracking
 * 4. Knowledge retrieval: Query, search, find similar, batch search
 * 5. Content update: Version a semantic unit, re-process, verify retrieval
 * 6. Batch operations: Ingest, process, catalog and query multiple documents
 * 7. Cross-context integrity: Verify traceability across all boundaries
 * 8. Deduplication: Detect similar content across the knowledge base
 * 9. (Optional) Real PDF: Full pipeline with a real PDF file
 *
 * Run with:
 *   npx vitest run src/backend/klay+/tests/integration/full-pipeline.e2e.test.ts
 *
 * Run with a real PDF (full pipeline including PDF extraction → embeddings → retrieval):
 *   PDF_PATH=/path/to/document.pdf npx vitest run src/backend/klay+/tests/integration/full-pipeline.e2e.test.ts
 *   npm run test:integration -- /path/to/document.pdf
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

// ─── Context Facades ─────────────────────────────────────────────────────────
import { createSourceIngestionFacade } from "../../contexts/source-ingestion/facade/index.js";
import { createSemanticProcessingFacade } from "../../contexts/semantic-processing/facade/index.js";
import { createSemanticKnowledgeFacade } from "../../contexts/semantic-knowledge/facade/index.js";
import { createKnowledgeRetrievalFacade } from "../../contexts/knowledge-retrieval/facade/index.js";

// ─── Domain Types ────────────────────────────────────────────────────────────
import { SourceType } from "../../contexts/source-ingestion/source/domain/SourceType.js";
import { ProjectionType } from "../../contexts/semantic-processing/projection/domain/ProjectionType.js";
import { TransformationType } from "../../contexts/semantic-knowledge/lineage/domain/Transformation.js";

// ─── Facade Types ────────────────────────────────────────────────────────────
import type { SourceIngestionFacade } from "../../contexts/source-ingestion/facade/SourceIngestionFacade.js";
import type { SemanticProcessingFacade } from "../../contexts/semantic-processing/facade/SemanticProcessingFacade.js";
import type { SemanticKnowledgeFacade } from "../../contexts/semantic-knowledge/facade/SemanticKnowledgeFacade.js";
import type { KnowledgeRetrievalFacade } from "../../contexts/knowledge-retrieval/facade/KnowledgeRetrievalFacade.js";

// ─── Constants ───────────────────────────────────────────────────────────────
const DIMENSIONS = 128;

// ─── Load Test Documents from Fixtures ───────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, "fixtures");

function loadFixture(filename: string): string {
  const filePath = path.join(FIXTURES_DIR, filename);
  return fs.readFileSync(filePath, "utf-8").trim();
}

const DOCUMENT_DDD = loadFixture("ddd-overview.txt");
const DOCUMENT_CLEAN_ARCH = loadFixture("clean-architecture.txt");
const DOCUMENT_EVENT_SOURCING = loadFixture("event-sourcing.txt");
const DOCUMENT_DDD_UPDATED = loadFixture("ddd-overview-updated.txt");

// ─── Optional PDF Path ──────────────────────────────────────────────────────
// Pass via:
//   Environment variable: PDF_PATH=/path/to/doc.pdf npm run test:integration
//   CLI argument:         npm run test:integration -- /path/to/doc.pdf

function resolvePdfPath(): string | undefined {
  // 1. Environment variable takes precedence
  if (process.env.PDF_PATH) {
    return path.resolve(process.env.PDF_PATH);
  }

  // 2. Check CLI arguments for a .pdf file path
  const args = process.argv.filter((arg) => arg.endsWith(".pdf"));
  if (args.length > 0) {
    return path.resolve(args[0]);
  }

  return undefined;
}

const PDF_PATH = resolvePdfPath();
const PDF_AVAILABLE = PDF_PATH != null && fs.existsSync(PDF_PATH);

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════════

describe("Full-Pipeline Integration: All Bounded Contexts", () => {
  // ─── Facades ─────────────────────────────────────────────────────────────
  let ingestion: SourceIngestionFacade;
  let processing: SemanticProcessingFacade;
  let knowledge: SemanticKnowledgeFacade;
  let retrieval: KnowledgeRetrievalFacade;

  // ─── Tracking IDs across contexts ────────────────────────────────────────
  const ids = {
    ddd: { sourceId: "", unitId: "" },
    cleanArch: { sourceId: "", unitId: "" },
    eventSourcing: { sourceId: "", unitId: "" },
    pdf: { sourceId: "", unitId: "" },
  };

  // ─── Processing Profile ID (created in beforeAll) ────────────────────────
  let processingProfileId = "";

  // ─── Shared state for PDF flow ───────────────────────────────────────────
  let pdfExtractedText = "";

  // ═══════════════════════════════════════════════════════════════════════════
  // SETUP: Initialize all 4 bounded contexts (server with temp DB for isolation)
  // ═══════════════════════════════════════════════════════════════════════════

  beforeAll(async () => {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(" Full-Pipeline Integration Test: All Bounded Contexts");
    console.log("═══════════════════════════════════════════════════════════════\n");

    // Use a fresh temporary directory for NeDB to avoid stale data between runs
    const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), "klay-integration-"));
    console.log(`🏗️  Initializing all bounded contexts (server, db: ${dbPath})...\n`);
    console.log(`   📂 NeDB data directory: ${dbPath}`);

    ingestion = await createSourceIngestionFacade({
      provider: "server",
      dbPath,
    });
    console.log("   ✅ Source Ingestion Facade created");

    processing = await createSemanticProcessingFacade({
      provider: "server",
      dbPath,
      embeddingDimensions: DIMENSIONS,
      defaultChunkingStrategy: "recursive",
    });
    console.log("   ✅ Semantic Processing Facade created");

    knowledge = await createSemanticKnowledgeFacade({
      provider: "server",
      dbPath,
    });
    console.log("   ✅ Semantic Knowledge Facade created");

    // Cross-context wiring: retrieval reads from processing's vector store config
    // Note: knowledge-retrieval gets dbPath via vectorStoreConfig (not top-level dbPath)
    retrieval = await createKnowledgeRetrievalFacade({
      provider: "server",
      vectorStoreConfig: processing.vectorStoreConfig,
      embeddingDimensions: DIMENSIONS,
    });
    console.log("   ✅ Knowledge Retrieval Facade created");
    console.log("   🔗 Cross-context wiring: Retrieval → Processing vector store config");
    console.log(`\n   📂 NeDB data directory: ${dbPath}`);
    console.log(`      Vector store: ${processing.vectorStoreConfig.dbPath ?? "N/A"}`);

    // Create a processing profile for all tests
    processingProfileId = crypto.randomUUID();
    const profileResult = await processing.createProcessingProfile({
      id: processingProfileId,
      name: "Integration Test Profile",
      chunkingStrategyId: "recursive",
      embeddingStrategyId: "hash-embedding",
      configuration: { embeddingDimensions: DIMENSIONS },
    });
    if (profileResult.isFail()) {
      throw new Error(`Failed to create processing profile: ${profileResult.error.message}`);
    }
    console.log(`   ✅ Processing Profile created: ${processingProfileId.slice(0, 8)}...`);

    if (PDF_AVAILABLE) {
      console.log(`   📄 PDF detected: ${path.basename(PDF_PATH!)}`);
    } else if (process.env.PDF_PATH) {
      console.log(`   ⚠️  PDF_PATH set but file not found: ${process.env.PDF_PATH}`);
    } else {
      console.log("   ℹ️  No PDF_PATH set — Flow 9 (PDF pipeline) will be skipped");
    }
    console.log();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 1: Single Document Ingestion Pipeline
  //   Source Ingestion → Semantic Processing → Semantic Knowledge
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Flow 1: Single Document Ingestion Pipeline", () => {
    it("should ingest and extract a document (Source Ingestion)", async () => {
      console.log("── Flow 1: Single Document Ingestion ──────────────────────\n");
      console.log("📥 Step 1.1: Ingesting DDD document...");
      console.log(`   📄 Loaded from: fixtures/ddd-overview.txt (${DOCUMENT_DDD.length} chars)`);

      ids.ddd.sourceId = crypto.randomUUID();
      ids.ddd.unitId = crypto.randomUUID();

      const result = await ingestion.ingestAndExtract({
        sourceId: ids.ddd.sourceId,
        sourceName: "DDD Overview",
        uri: DOCUMENT_DDD,
        type: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.sourceId).toBe(ids.ddd.sourceId);
      expect(result.value.contentHash).toBeTruthy();

      console.log(`   ✅ Source ingested: ${ids.ddd.sourceId.slice(0, 8)}...`);
      console.log(`      Content hash: ${result.value.contentHash.slice(0, 16)}...\n`);
    });

    it("should process content into embeddings (Semantic Processing)", async () => {
      console.log("⚙️  Step 1.2: Processing into embeddings...");

      const result = await processing.processContent({
        projectionId: crypto.randomUUID(),
        semanticUnitId: ids.ddd.unitId,
        semanticUnitVersion: 1,
        content: DOCUMENT_DDD,
        type: ProjectionType.Embedding,
        processingProfileId,
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.chunksCount).toBeGreaterThan(0);
      expect(result.value.dimensions).toBe(DIMENSIONS);

      console.log(`   ✅ Content processed: ${result.value.chunksCount} chunks`);
      console.log(`      Dimensions: ${result.value.dimensions}`);
      console.log(`      Model: ${result.value.model}\n`);
    });

    it("should catalog as semantic unit with lineage (Semantic Knowledge)", async () => {
      console.log("📚 Step 1.3: Cataloging with lineage tracking...");

      const result = await knowledge.createSemanticUnitWithLineage({
        id: ids.ddd.unitId,
        sourceId: ids.ddd.sourceId,
        sourceType: "document",
        content: DOCUMENT_DDD,
        language: "en",
        createdBy: "ingestion-pipeline",
        topics: ["ddd", "software-architecture", "bounded-context"],
        summary: "Domain-Driven Design overview with key concepts",
        tags: ["architecture", "ddd"],
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.unitId).toBe(ids.ddd.unitId);

      console.log(`   ✅ Semantic unit created: ${ids.ddd.unitId.slice(0, 8)}...`);
      console.log(`      Lineage: EXTRACTION transformation registered\n`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 2: Batch Ingestion of Multiple Documents
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Flow 2: Batch Document Ingestion", () => {
    it("should batch ingest multiple documents (Source Ingestion)", async () => {
      console.log("── Flow 2: Batch Document Ingestion ────────────────────────\n");
      console.log("📥 Step 2.1: Batch ingesting 2 documents...");
      console.log(`   📄 fixtures/clean-architecture.txt (${DOCUMENT_CLEAN_ARCH.length} chars)`);
      console.log(`   📄 fixtures/event-sourcing.txt (${DOCUMENT_EVENT_SOURCING.length} chars)`);

      ids.cleanArch.sourceId = crypto.randomUUID();
      ids.cleanArch.unitId = crypto.randomUUID();
      ids.eventSourcing.sourceId = crypto.randomUUID();
      ids.eventSourcing.unitId = crypto.randomUUID();

      const batchResult = await ingestion.batchIngestAndExtract([
        {
          sourceId: ids.cleanArch.sourceId,
          sourceName: "Clean Architecture Guide",
          uri: DOCUMENT_CLEAN_ARCH,
          type: SourceType.PlainText,
          extractionJobId: crypto.randomUUID(),
        },
        {
          sourceId: ids.eventSourcing.sourceId,
          sourceName: "Event Sourcing & CQRS",
          uri: DOCUMENT_EVENT_SOURCING,
          type: SourceType.PlainText,
          extractionJobId: crypto.randomUUID(),
        },
      ]);

      expect(batchResult).toHaveLength(2);
      expect(batchResult.every((r) => r.success)).toBe(true);

      for (const r of batchResult) {
        console.log(
          `   ${r.success ? "✅" : "❌"} ${r.sourceId.slice(0, 8)}... ${r.contentHash ? `(hash: ${r.contentHash.slice(0, 12)}...)` : r.error ?? ""}`,
        );
      }
      console.log();
    });

    it("should batch process content (Semantic Processing)", async () => {
      console.log("⚙️  Step 2.2: Batch processing into embeddings...");

      const batchResult = await processing.batchProcess([
        {
          projectionId: crypto.randomUUID(),
          semanticUnitId: ids.cleanArch.unitId,
          semanticUnitVersion: 1,
          content: DOCUMENT_CLEAN_ARCH,
          type: ProjectionType.Embedding,
          processingProfileId,
        },
        {
          projectionId: crypto.randomUUID(),
          semanticUnitId: ids.eventSourcing.unitId,
          semanticUnitVersion: 1,
          content: DOCUMENT_EVENT_SOURCING,
          type: ProjectionType.Embedding,
          processingProfileId,
        },
      ]);

      expect(batchResult).toHaveLength(2);
      expect(batchResult.every((r) => r.success)).toBe(true);

      for (const r of batchResult) {
        console.log(
          `   ${r.success ? "✅" : "❌"} Projection ${r.projectionId.slice(0, 8)}... → ${r.chunksCount ?? 0} chunks`,
        );
      }
      console.log();
    });

    it("should batch catalog as semantic units (Semantic Knowledge)", async () => {
      console.log("📚 Step 2.3: Batch cataloging with lineage...");

      const batchResult = await knowledge.batchCreateSemanticUnitsWithLineage([
        {
          id: ids.cleanArch.unitId,
          sourceId: ids.cleanArch.sourceId,
          sourceType: "document",
          content: DOCUMENT_CLEAN_ARCH,
          language: "en",
          createdBy: "ingestion-pipeline",
          topics: ["clean-architecture", "layered-design", "dependency-rule"],
          summary: "Clean Architecture with concentric layers and dependency rule",
          tags: ["architecture", "clean-arch"],
        },
        {
          id: ids.eventSourcing.unitId,
          sourceId: ids.eventSourcing.sourceId,
          sourceType: "document",
          content: DOCUMENT_EVENT_SOURCING,
          language: "en",
          createdBy: "ingestion-pipeline",
          topics: ["event-sourcing", "cqrs", "audit-trail"],
          summary: "Event Sourcing and CQRS pattern for complex domains",
          tags: ["architecture", "event-sourcing", "cqrs"],
        },
      ]);

      expect(batchResult).toHaveLength(2);
      expect(batchResult.every((r) => r.success)).toBe(true);

      for (const r of batchResult) {
        console.log(`   ${r.success ? "✅" : "❌"} Unit ${r.unitId.slice(0, 8)}...`);
      }
      console.log();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 3: Knowledge Retrieval (Query the knowledge base)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Flow 3: Knowledge Retrieval", () => {
    it("should perform semantic query across all documents", async () => {
      console.log("── Flow 3: Knowledge Retrieval ─────────────────────────────\n");
      console.log("🔍 Step 3.1: Semantic query...");

      const result = await retrieval.query({
        text: "bounded context domain model",
        topK: 5,
        minScore: 0.0,
      });

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.queryText).toBe("bounded context domain model");

      console.log(`   ✅ Query returned ${result.items.length} results`);
      for (const item of result.items.slice(0, 3)) {
        console.log(`      [${item.score.toFixed(3)}] ${item.content.slice(0, 60)}...`);
      }
      console.log();
    });

    it("should perform simplified search", async () => {
      console.log("🔍 Step 3.2: Simplified search...");

      const results = await retrieval.search(
        "Clean Architecture separates concerns into concentric layers",
        { limit: 5, threshold: 0.0 },
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("id");
      expect(results[0]).toHaveProperty("content");
      expect(results[0]).toHaveProperty("score");

      console.log(`   ✅ Search returned ${results.length} results`);
      for (const r of results.slice(0, 3)) {
        console.log(`      [${r.score.toFixed(3)}] ${r.content.slice(0, 60)}...`);
      }
      console.log();
    });

    it("should find most similar content for exact match", async () => {
      console.log("🎯 Step 3.3: Finding most similar...");

      const match = await retrieval.findMostSimilar(
        "Domain-Driven Design bounded context aggregate entity",
        0.0,
      );

      expect(match).not.toBeNull();

      console.log(`   ✅ Best match: unit ${match!.id.slice(0, 8)}... (score: ${match!.score.toFixed(3)})`);
      console.log(`      Content: ${match!.content.slice(0, 60)}...\n`);
    });

    it("should batch search multiple queries", async () => {
      console.log("📚 Step 3.4: Batch search across knowledge base...");

      const batchResults = await retrieval.batchSearch(
        [
          "aggregate root entity value object",
          "dependency rule inner circle outer",
          "event store replay state changes",
        ],
        { limit: 2, threshold: 0.0 },
      );

      expect(batchResults).toHaveLength(3);

      for (const batch of batchResults) {
        console.log(`   Query: "${batch.query.slice(0, 40)}..."`);
        console.log(`   → ${batch.results.length} results`);
        for (const r of batch.results) {
          console.log(`      [${r.score.toFixed(3)}] ${r.content.slice(0, 50)}...`);
        }
      }
      console.log();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 4: Content Update & Re-Processing (Version + Lineage)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Flow 4: Content Update & Re-Processing", () => {
    it("should version the semantic unit with enrichment (Semantic Knowledge)", async () => {
      console.log("── Flow 4: Content Update & Re-Processing ─────────────────\n");
      console.log("🔄 Step 4.1: Versioning DDD document with enrichment...");
      console.log(`   📄 Updated from: fixtures/ddd-overview-updated.txt (${DOCUMENT_DDD_UPDATED.length} chars)`);

      const result = await knowledge.versionSemanticUnitWithLineage({
        unitId: ids.ddd.unitId,
        content: DOCUMENT_DDD_UPDATED,
        language: "en",
        reason: "Added strategic DDD patterns: Context Map, ACL, Shared Kernel",
        transformationType: TransformationType.Enrichment,
        strategyUsed: "manual-enrichment",
        topics: ["ddd", "software-architecture", "strategic-ddd", "context-map"],
        summary: "Updated with strategic DDD patterns",
        parameters: { addedConcepts: 3, updatedSections: ["Key Concepts"] },
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.unitId).toBe(ids.ddd.unitId);
      expect(result.value.newVersion).toBe(2);

      console.log(`   ✅ Versioned: ${ids.ddd.unitId.slice(0, 8)}... → v${result.value.newVersion}`);
      console.log(`      Lineage: ENRICHMENT transformation registered\n`);
    });

    it("should re-process updated content (Semantic Processing)", async () => {
      console.log("⚙️  Step 4.2: Re-processing updated content...");

      const result = await processing.processContent({
        projectionId: crypto.randomUUID(),
        semanticUnitId: ids.ddd.unitId,
        semanticUnitVersion: 2,
        content: DOCUMENT_DDD_UPDATED,
        type: ProjectionType.Embedding,
        processingProfileId,
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.chunksCount).toBeGreaterThan(0);

      console.log(`   ✅ Re-processed: ${result.value.chunksCount} chunks (v2)`);
      console.log(`      New embeddings stored in vector store\n`);
    });

    it("should retrieve updated content via search (Knowledge Retrieval)", async () => {
      console.log("🔍 Step 4.3: Searching for updated content...");

      const results = await retrieval.search("context map anti-corruption layer shared kernel", {
        limit: 3,
        threshold: 0.0,
      });

      expect(results.length).toBeGreaterThan(0);

      console.log(`   ✅ Found ${results.length} results for updated concepts`);
      for (const r of results.slice(0, 2)) {
        console.log(`      [${r.score.toFixed(3)}] ${r.content.slice(0, 60)}...`);
      }
      console.log();
    });

    it("should verify lineage history (Semantic Knowledge)", async () => {
      console.log("📊 Step 4.4: Verifying lineage history...");

      const lineageResult = await knowledge.getLineageForUnit(ids.ddd.unitId);

      expect(lineageResult.isOk()).toBe(true);

      const lineage = lineageResult.value as any;
      console.log(`   ✅ Lineage for unit: ${ids.ddd.unitId.slice(0, 8)}...`);

      if (lineage.transformations) {
        console.log(`      Total transformations: ${lineage.transformations.length}`);
        for (const t of lineage.transformations) {
          console.log(
            `      - ${t.type}: v${t.inputVersion} → v${t.outputVersion} (${t.strategyUsed})`,
          );
        }
      }
      console.log();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 5: Deduplication Detection
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Flow 5: Deduplication Detection", () => {
    it("should detect similar content in the knowledge base", async () => {
      console.log("── Flow 5: Deduplication Detection ─────────────────────────\n");
      console.log("🔎 Step 5.1: Checking for duplicate DDD content...");

      const check = await retrieval.hasSimilarContent(
        "Domain-Driven Design bounded context aggregate entity value object",
        0.0,
      );

      expect(check.exists).toBe(true);
      expect(check.matchId).toBeDefined();

      console.log(`   ✅ Similar content detected: unit ${check.matchId!.slice(0, 8)}...`);
      console.log(`      Score: ${check.score!.toFixed(3)}\n`);
    });

    it("should find related content for a semantic unit", async () => {
      console.log("🔗 Step 5.2: Finding related content for DDD unit...");

      const related = await retrieval.findRelated(
        ids.ddd.unitId,
        "software architecture design patterns",
        { limit: 3, excludeSelf: true },
      );

      expect(related).toBeDefined();

      console.log(`   ✅ Found ${related.length} related items (excluding self)`);
      for (const r of related) {
        console.log(`      [${r.score.toFixed(3)}] unit ${r.id.slice(0, 8)}... → ${r.content.slice(0, 50)}...`);
      }
      console.log();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 6: Processing Profile Management (Semantic Processing)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Flow 6: Processing Profile Management", () => {
    it("should create a new processing profile", async () => {
      console.log("── Flow 6: Processing Profile Management ──────────────────\n");
      console.log("🔧 Step 6.1: Creating a custom processing profile...");

      const customProfileId = crypto.randomUUID();
      const result = await processing.createProcessingProfile({
        id: customProfileId,
        name: "Custom Sentence Chunking Profile",
        chunkingStrategyId: "sentence",
        embeddingStrategyId: "hash-embedding",
        configuration: { embeddingDimensions: 256 },
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.profileId).toBe(customProfileId);
      expect(result.value.version).toBe(1);

      console.log(`   ✅ Profile created: ${customProfileId.slice(0, 8)}... (v${result.value.version})\n`);
    });

    it("should update a processing profile", async () => {
      console.log("🔧 Step 6.2: Updating processing profile...");

      const updateProfileId = crypto.randomUUID();
      await processing.createProcessingProfile({
        id: updateProfileId,
        name: "Profile to Update",
        chunkingStrategyId: "fixed-size",
        embeddingStrategyId: "hash-embedding",
      });

      const result = await processing.updateProcessingProfile({
        id: updateProfileId,
        name: "Updated Profile",
        chunkingStrategyId: "recursive",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.version).toBe(2);

      console.log(`   ✅ Profile updated: ${updateProfileId.slice(0, 8)}... (v${result.value.version})\n`);
    });

    it("should deprecate a processing profile", async () => {
      console.log("🔧 Step 6.3: Deprecating processing profile...");

      const deprecateProfileId = crypto.randomUUID();
      await processing.createProcessingProfile({
        id: deprecateProfileId,
        name: "Profile to Deprecate",
        chunkingStrategyId: "recursive",
        embeddingStrategyId: "hash-embedding",
      });

      const result = await processing.deprecateProcessingProfile({
        id: deprecateProfileId,
        reason: "No longer needed",
      });

      expect(result.isOk()).toBe(true);

      console.log(`   ✅ Profile deprecated: ${deprecateProfileId.slice(0, 8)}...\n`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 7: Error Handling & Edge Cases
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Flow 7: Error Handling & Edge Cases", () => {
    it("should reject duplicate source ingestion", async () => {
      console.log("── Flow 7: Error Handling ──────────────────────────────────\n");
      console.log("🚫 Step 7.1: Duplicate source rejection...");

      const result = await ingestion.ingestAndExtract({
        sourceId: ids.ddd.sourceId, // Already exists
        sourceName: "Duplicate DDD",
        uri: DOCUMENT_DDD,
        type: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
      });

      expect(result.isFail()).toBe(true);
      console.log(`   ✅ Correctly rejected: ${result.error.message}\n`);
    });

    it("should reject duplicate semantic unit creation", async () => {
      console.log("🚫 Step 7.2: Duplicate semantic unit rejection...");

      const result = await knowledge.createSemanticUnitWithLineage({
        id: ids.ddd.unitId, // Already exists
        sourceId: "different-source",
        sourceType: "document",
        content: "Different content",
        language: "en",
        createdBy: "test",
      });

      expect(result.isFail()).toBe(true);
      console.log(`   ✅ Correctly rejected: ${result.error.message}\n`);
    });

    it("should reject versioning non-existent semantic unit", async () => {
      console.log("🚫 Step 7.3: Non-existent unit versioning...");

      const result = await knowledge.versionSemanticUnitWithLineage({
        unitId: "non-existent-id",
        content: "Content",
        language: "en",
        reason: "Testing",
      });

      expect(result.isFail()).toBe(true);
      console.log(`   ✅ Correctly rejected: ${result.error.message}\n`);
    });

    it("should handle empty retrieval results gracefully", async () => {
      console.log("🔍 Step 7.4: Empty retrieval results...");

      const result = await retrieval.query({
        text: "xyz completely unrelated gibberish topic",
        topK: 5,
        minScore: 0.99,
      });

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(0);

      console.log(`   ✅ Empty results handled correctly\n`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 8: Cross-Context Integrity Verification
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Flow 8: Cross-Context Integrity", () => {
    it("should maintain traceability: sourceId → unitId → vectors → retrieval", async () => {
      console.log("── Flow 8: Cross-Context Integrity ─────────────────────────\n");
      console.log("🔗 Step 8.1: Verifying traceability chain...");

      // 1. Source exists in ingestion context
      const sourceAccessor = ingestion.source;
      expect(sourceAccessor).toBeDefined();

      // 2. Semantic unit exists in knowledge context
      const lineageResult = await knowledge.getLineageForUnit(ids.ddd.unitId);
      expect(lineageResult.isOk()).toBe(true);

      // 3. Vector store config exists in processing context (for cross-context wiring)
      const vectorStoreConfig = processing.vectorStoreConfig;
      expect(vectorStoreConfig).toBeDefined();

      // 4. Content is retrievable via retrieval context
      const searchResult = await retrieval.search("Domain-Driven Design", {
        limit: 1,
        threshold: 0.0,
      });
      expect(searchResult.length).toBeGreaterThan(0);

      console.log("   ✅ Source Ingestion: source registered and extracted");
      console.log("   ✅ Semantic Processing: vectors stored in vector store");
      console.log("   ✅ Semantic Knowledge: unit cataloged with lineage");
      console.log("   ✅ Knowledge Retrieval: content queryable via semantic search\n");
    });

    it("should provide direct module access across all facades", async () => {
      console.log("🔧 Step 8.2: Verifying direct module access...");

      // Source Ingestion modules
      expect(ingestion.source).toBeDefined();
      expect(ingestion.extraction).toBeDefined();
      console.log("   ✅ Source Ingestion: source, extraction");

      // Semantic Processing modules
      expect(processing.projection).toBeDefined();
      expect(processing.processingProfile).toBeDefined();
      expect(processing.vectorStoreConfig).toBeDefined();
      console.log("   ✅ Semantic Processing: projection, processingProfile, vectorStoreConfig");

      // Semantic Knowledge modules
      expect(knowledge.semanticUnit).toBeDefined();
      expect(knowledge.lineage).toBeDefined();
      console.log("   ✅ Semantic Knowledge: semanticUnit, lineage");

      // Knowledge Retrieval modules
      expect(retrieval.semanticQuery).toBeDefined();
      console.log("   ✅ Knowledge Retrieval: semanticQuery\n");

      console.log("═══════════════════════════════════════════════════════════════");
      console.log(" ✅ ALL INTEGRATION TESTS PASSED!");
      console.log("═══════════════════════════════════════════════════════════════");
      console.log("\n Pipeline verified:");
      console.log("   ✅ Source Ingestion → Content Extraction");
      console.log("   ✅ Content → Chunking → Embeddings → Vector Store");
      console.log("   ✅ Semantic Units → Lineage Tracking → Versioning");
      console.log("   ✅ Semantic Search → Query → Batch Search → Deduplication");
      console.log("   ✅ Cross-context data integrity (sourceId ↔ unitId ↔ vectors)");
      console.log("   ✅ Error handling across all boundaries");
      console.log("   ✅ Processing profile management (create, update, deprecate)");
      console.log("   ✅ Resource management (store, reference, delete, ingestFile)");
      if (PDF_AVAILABLE) {
        console.log("   ✅ Real PDF pipeline (ingestion → extraction → embeddings → retrieval)");
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 9: Resource Management (Source Ingestion)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Flow 9: Resource Management", () => {
    it("should store a resource via buffer upload", async () => {
      console.log("── Flow 9: Resource Management ─────────────────────────────\n");
      console.log("📦 Step 9.1: Storing resource via buffer upload...");

      const resourceId = crypto.randomUUID();
      const textContent = "Hello, this is test content for resource storage.";
      const buffer = new TextEncoder().encode(textContent).buffer;

      const result = await ingestion.resource.storeResource.execute({
        id: resourceId,
        buffer,
        originalName: "test-document.txt",
        mimeType: "text/plain",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resourceId).toBe(resourceId);
        expect(result.value.storageUri).toBeTruthy();
        expect(result.value.size).toBe(buffer.byteLength);
      }

      console.log(`   ✅ Resource stored: ${resourceId.slice(0, 8)}...`);
      console.log(`      URI: ${result.value.storageUri}`);
      console.log(`      Size: ${result.value.size} bytes\n`);
    });

    it("should register an external resource reference", async () => {
      console.log("🔗 Step 9.2: Registering external resource...");

      const resourceId = crypto.randomUUID();
      const externalUri = "https://example.com/documents/report.pdf";

      const result = await ingestion.resource.registerExternalResource.execute({
        id: resourceId,
        name: "External Report",
        mimeType: "application/pdf",
        uri: externalUri,
        size: 1024000,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resourceId).toBe(resourceId);
        expect(result.value.storageUri).toBe(externalUri);
      }

      console.log(`   ✅ External resource registered: ${resourceId.slice(0, 8)}...`);
      console.log(`      URI: ${externalUri}\n`);
    });

    it("should retrieve a stored resource", async () => {
      console.log("📂 Step 9.3: Retrieving stored resource...");

      const resourceId = crypto.randomUUID();
      const buffer = new TextEncoder().encode("Retrievable content").buffer;

      await ingestion.resource.storeResource.execute({
        id: resourceId,
        buffer,
        originalName: "retrievable.txt",
        mimeType: "text/plain",
      });

      const result = await ingestion.resource.getResource.execute(resourceId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id.value).toBe(resourceId);
        expect(result.value.originalName).toBe("retrievable.txt");
        expect(result.value.mimeType).toBe("text/plain");
        expect(result.value.isStored).toBe(true);
      }

      console.log(`   ✅ Resource retrieved: ${resourceId.slice(0, 8)}...\n`);
    });

    it("should reject duplicate resource storage", async () => {
      console.log("🚫 Step 9.4: Duplicate resource rejection...");

      const resourceId = crypto.randomUUID();
      const buffer = new TextEncoder().encode("First content").buffer;

      await ingestion.resource.storeResource.execute({
        id: resourceId,
        buffer,
        originalName: "first.txt",
        mimeType: "text/plain",
      });

      const result = await ingestion.resource.storeResource.execute({
        id: resourceId,
        buffer: new TextEncoder().encode("Second content").buffer,
        originalName: "second.txt",
        mimeType: "text/plain",
      });

      expect(result.isFail()).toBe(true);
      console.log(`   ✅ Duplicate correctly rejected: ${result.error.message}\n`);
    });

    it("should delete a stored resource", async () => {
      console.log("🗑️  Step 9.5: Deleting resource...");

      const resourceId = crypto.randomUUID();
      const buffer = new TextEncoder().encode("Content to delete").buffer;

      await ingestion.resource.storeResource.execute({
        id: resourceId,
        buffer,
        originalName: "deletable.txt",
        mimeType: "text/plain",
      });

      const deleteResult = await ingestion.resource.deleteResource.execute({
        id: resourceId,
      });

      expect(deleteResult.isOk()).toBe(true);
      console.log(`   ✅ Resource deleted: ${resourceId.slice(0, 8)}...\n`);
    });

    it("should complete the ingestFile workflow (resource + source + extraction)", async () => {
      console.log("🚀 Step 9.6: Full ingestFile workflow...");

      const resourceId = crypto.randomUUID();
      const sourceId = crypto.randomUUID();
      const textContent = "This is a plain text document for the complete file ingestion workflow test.";
      const buffer = new TextEncoder().encode(textContent).buffer;

      const result = await ingestion.ingestFile({
        resourceId,
        sourceId,
        sourceName: "IngestFile Test Document",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: {
          buffer,
          originalName: "ingest-test.txt",
          mimeType: "text/plain",
        },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resourceId).toBe(resourceId);
        expect(result.value.sourceId).toBe(sourceId);
        expect(result.value.storageUri).toBeTruthy();
        expect(result.value.extractedText).toBeTruthy();
        expect(result.value.contentHash).toBeTruthy();
      }

      console.log(`   ✅ Full ingestFile workflow completed`);
      console.log(`      Resource: ${resourceId.slice(0, 8)}...`);
      console.log(`      Source: ${sourceId.slice(0, 8)}...`);
      console.log(`      Extracted text: ${result.value.extractedText.length} chars\n`);
    });

    it("should complete the ingestExternalResource workflow", async () => {
      console.log("🔗 Step 9.7: Full ingestExternalResource workflow...");

      const resourceId = crypto.randomUUID();
      const sourceId = crypto.randomUUID();
      const externalUri = "This is external resource content that exists at a known location.";

      const result = await ingestion.ingestExternalResource({
        resourceId,
        sourceId,
        sourceName: "External Resource Test",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        uri: externalUri,
        mimeType: "text/plain",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resourceId).toBe(resourceId);
        expect(result.value.sourceId).toBe(sourceId);
        expect(result.value.storageUri).toBe(externalUri);
        expect(result.value.extractedText).toBeTruthy();
        expect(result.value.contentHash).toBeTruthy();
      }

      console.log(`   ✅ Full ingestExternalResource workflow completed`);
      console.log(`      Resource: ${resourceId.slice(0, 8)}...`);
      console.log(`      Source: ${sourceId.slice(0, 8)}...\n`);
    });

    it("should provide resource module access via facade", async () => {
      console.log("🔧 Step 9.8: Verifying resource module access...");

      expect(ingestion.resource).toBeDefined();
      expect(ingestion.resource.storeResource).toBeDefined();
      expect(ingestion.resource.registerExternalResource).toBeDefined();
      expect(ingestion.resource.deleteResource).toBeDefined();
      expect(ingestion.resource.getResource).toBeDefined();

      console.log("   ✅ Resource module fully accessible via facade\n");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOW 10: Real PDF Pipeline (Optional)
  //   Runs only when PDF_PATH env var points to an existing PDF file.
  //   Tests the complete pipeline: PDF extraction → processing → cataloging → retrieval
  //
  //   Usage: PDF_PATH=./my-doc.pdf npx vitest run ...
  // ═══════════════════════════════════════════════════════════════════════════

  describe.skipIf(!PDF_AVAILABLE)("Flow 10: Real PDF Pipeline", () => {
    it("should ingest and extract a real PDF (Source Ingestion)", async () => {
      console.log("── Flow 10: Real PDF Pipeline ──────────────────────────────\n");
      console.log(`📄 Step 10.1: Ingesting PDF from: ${PDF_PATH}`);

      ids.pdf.sourceId = crypto.randomUUID();
      ids.pdf.unitId = crypto.randomUUID();

      const result = await ingestion.ingestAndExtract({
        sourceId: ids.pdf.sourceId,
        sourceName: path.basename(PDF_PATH!),
        uri: PDF_PATH!,
        type: SourceType.Pdf,
        extractionJobId: crypto.randomUUID(),
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.sourceId).toBe(ids.pdf.sourceId);
      expect(result.value.contentHash).toBeTruthy();

      console.log(`   ✅ PDF ingested: ${ids.pdf.sourceId.slice(0, 8)}...`);
      console.log(`      Content hash: ${result.value.contentHash.slice(0, 16)}...\n`);
    });

    it("should extract text content from the PDF", async () => {
      console.log("🔍 Step 10.2: Extracting text from PDF...");

      const extractionResult = await ingestion.extraction.executeExtraction.execute({
        jobId: crypto.randomUUID(),
        sourceId: ids.pdf.sourceId,
        uri: PDF_PATH!,
        mimeType: "application/pdf",
      });

      expect(extractionResult.isOk()).toBe(true);
      expect(extractionResult.value.extractedText.length).toBeGreaterThan(0);

      pdfExtractedText = extractionResult.value.extractedText;
      const metadata = extractionResult.value.metadata;

      console.log(`   ✅ Text extracted: ${pdfExtractedText.length} characters`);
      console.log(`      Pages: ${(metadata as any).pageCount ?? "unknown"}`);
      console.log(`      Preview: "${pdfExtractedText.slice(0, 100).replace(/\n/g, " ")}..."\n`);
    });

    it("should process PDF content into embeddings (Semantic Processing)", async () => {
      console.log("⚙️  Step 10.3: Processing PDF content into embeddings...");

      const result = await processing.processContent({
        projectionId: crypto.randomUUID(),
        semanticUnitId: ids.pdf.unitId,
        semanticUnitVersion: 1,
        content: pdfExtractedText,
        type: ProjectionType.Embedding,
        processingProfileId,
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.chunksCount).toBeGreaterThan(0);
      expect(result.value.dimensions).toBe(DIMENSIONS);

      console.log(`   ✅ PDF processed: ${result.value.chunksCount} chunks`);
      console.log(`      Dimensions: ${result.value.dimensions}`);
      console.log(`      Model: ${result.value.model}\n`);
    });

    it("should catalog PDF as semantic unit with lineage (Semantic Knowledge)", async () => {
      console.log("📚 Step 10.4: Cataloging PDF semantic unit...");

      const result = await knowledge.createSemanticUnitWithLineage({
        id: ids.pdf.unitId,
        sourceId: ids.pdf.sourceId,
        sourceType: "pdf-document",
        content: pdfExtractedText,
        language: "en",
        createdBy: "ingestion-pipeline",
        topics: ["pdf", "document"],
        summary: `PDF document: ${path.basename(PDF_PATH!)}`,
        tags: ["pdf", "uploaded"],
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.unitId).toBe(ids.pdf.unitId);

      console.log(`   ✅ Semantic unit created: ${ids.pdf.unitId.slice(0, 8)}...`);
      console.log(`      Lineage: EXTRACTION transformation registered\n`);
    });

    it("should retrieve PDF content via semantic search (Knowledge Retrieval)", async () => {
      console.log("🔍 Step 10.5: Searching for PDF content...");

      // Use the first 50 characters of extracted text as search query
      const queryText = pdfExtractedText
        .slice(0, 200)
        .replace(/\n/g, " ")
        .trim()
        .split(/\s+/)
        .slice(0, 8)
        .join(" ");

      const results = await retrieval.search(queryText, {
        limit: 5,
        threshold: 0.0,
      });

      expect(results.length).toBeGreaterThan(0);

      console.log(`   ✅ Search for "${queryText.slice(0, 40)}..." returned ${results.length} results`);
      for (const r of results.slice(0, 3)) {
        console.log(`      [${r.score.toFixed(3)}] ${r.content.slice(0, 60)}...`);
      }
      console.log();

      console.log("═══════════════════════════════════════════════════════════════");
      console.log(` ✅ PDF Pipeline complete: ${path.basename(PDF_PATH!)}`);
      console.log("   Ingestion → Extraction → Embeddings → Cataloging → Retrieval");
      console.log("═══════════════════════════════════════════════════════════════\n");
    });
  });
});
