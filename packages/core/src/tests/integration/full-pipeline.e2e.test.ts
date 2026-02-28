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

import { createSourceIngestionService } from "../../contexts/source-ingestion/service";
import { createSemanticProcessingService } from "../../contexts/semantic-processing/service";
import { createSemanticKnowledgeService } from "../../contexts/semantic-knowledge/service";
import { createKnowledgeRetrievalService } from "../../contexts/knowledge-retrieval/service";

import { SourceType } from "../../contexts/source-ingestion/source/domain/SourceType";
import { ProjectionType } from "../../contexts/semantic-processing/projection/domain/ProjectionType";
import type { SourceIngestionService } from "../../contexts/source-ingestion/service/SourceIngestionService";
import type { SemanticProcessingService } from "../../contexts/semantic-processing/service/SemanticProcessingService";
import type { SemanticKnowledgeService } from "../../contexts/semantic-knowledge/service/SemanticKnowledgeService";
import type { KnowledgeRetrievalService } from "../../contexts/knowledge-retrieval/service/KnowledgeRetrievalService";

const DIMENSIONS = 128;

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

function resolvePdfPath(): string | undefined {
  if (process.env.PDF_PATH) {
    return path.resolve(process.env.PDF_PATH);
  }
  const args = process.argv.filter((arg) => arg.endsWith(".pdf"));
  if (args.length > 0) {
    return path.resolve(args[0]);
  }
  return undefined;
}

const PDF_PATH = resolvePdfPath();
const PDF_AVAILABLE = PDF_PATH != null && fs.existsSync(PDF_PATH);

describe("Full-Pipeline Integration: All Bounded Contexts", () => {
  let ingestion: SourceIngestionService;
  let processing: SemanticProcessingService;
  let knowledge: SemanticKnowledgeService;
  let retrieval: KnowledgeRetrievalService;

  const ids = {
    ddd: { sourceId: "", unitId: "" },
    cleanArch: { sourceId: "", unitId: "" },
    eventSourcing: { sourceId: "", unitId: "" },
    pdf: { sourceId: "", unitId: "" },
  };

  let processingProfileId = "";

  let pdfExtractedText = "";

  // SETUP

  beforeAll(async () => {
    const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), "klay-integration-"));

    ingestion = await createSourceIngestionService({
      provider: "server",
      dbPath,
    });

    processing = await createSemanticProcessingService({
      provider: "server",
      dbPath,
      embeddingDimensions: DIMENSIONS,
      defaultChunkingStrategy: "recursive",
    });

    knowledge = await createSemanticKnowledgeService({
      provider: "server",
      dbPath,
    });

    retrieval = await createKnowledgeRetrievalService({
      provider: "server",
      vectorStoreConfig: processing.vectorStoreConfig,
      embeddingDimensions: DIMENSIONS,
    });

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
  });

  // FLOW 1: Single Document Ingestion Pipeline

  describe("Flow 1: Single Document Ingestion Pipeline", () => {
    it("should ingest, extract, and catalog a document with lineage", async () => {
      ids.ddd.sourceId = crypto.randomUUID();
      ids.ddd.unitId = crypto.randomUUID();

      // Ingest and extract
      const ingestResult = await ingestion.ingestAndExtract({
        sourceId: ids.ddd.sourceId,
        sourceName: "DDD Overview",
        uri: DOCUMENT_DDD,
        type: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
      });

      expect(ingestResult.isOk()).toBe(true);
      expect(ingestResult.value.sourceId).toBe(ids.ddd.sourceId);
      expect(ingestResult.value.contentHash).toBeTruthy();

      // Catalog with lineage
      const catalogResult = await knowledge.createSemanticUnitWithLineage({
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

      expect(catalogResult.isOk()).toBe(true);
      expect(catalogResult.value.unitId).toBe(ids.ddd.unitId);
    });

    it("should process content into embeddings (Semantic Processing)", async () => {
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
    });
  });

  // FLOW 2: Batch Ingestion of Multiple Documents

  describe("Flow 2: Batch Document Ingestion", () => {
    it("should batch ingest multiple documents (Source Ingestion)", async () => {
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
    });

    it("should batch process content (Semantic Processing)", async () => {
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
    });

    it("should batch catalog as semantic units (Semantic Knowledge)", async () => {
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
    });
  });

  // FLOW 3: Knowledge Retrieval

  describe("Flow 3: Knowledge Retrieval", () => {
    it("should perform semantic query and find best match", async () => {
      // Broad query
      const result = await retrieval.query({
        text: "bounded context domain model",
        topK: 5,
        minScore: 0.0,
      });

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.queryText).toBe("bounded context domain model");

      // Best match with topK=1
      const bestMatch = await retrieval.query({
        text: "Domain-Driven Design bounded context aggregate entity",
        topK: 1,
        minScore: 0.0,
      });

      expect(bestMatch.items.length).toBe(1);
    });

    it("should batch query multiple queries", async () => {
      const batchResults = await retrieval.batchQuery([
        { text: "aggregate root entity value object", topK: 2, minScore: 0.0 },
        { text: "dependency rule inner circle outer", topK: 2, minScore: 0.0 },
        { text: "event store replay state changes", topK: 2, minScore: 0.0 },
      ]);

      expect(batchResults).toHaveLength(3);
    });
  });

  // FLOW 4: Content Update & Re-Processing

  describe("Flow 4: Content Update & Re-Processing", () => {
    it("should add enrichment source to semantic unit (Semantic Knowledge)", async () => {
      const result = await knowledge.addSourceToSemanticUnit({
        unitId: ids.ddd.unitId,
        sourceId: "enrichment-source-1",
        sourceType: "enrichment",
        extractedContent: DOCUMENT_DDD_UPDATED,
        contentHash: "hash-enriched",
        processingProfileId: processingProfileId,
        processingProfileVersion: 1,
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.unitId).toBe(ids.ddd.unitId);
      expect(result.value.version).toBeGreaterThanOrEqual(1);
    });

    it("should re-process updated content (Semantic Processing)", async () => {
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
    });

    it("should retrieve updated content via query (Knowledge Retrieval)", async () => {
      const result = await retrieval.query({
        text: "context map anti-corruption layer shared kernel",
        topK: 3,
        minScore: 0.0,
      });

      expect(result.items.length).toBeGreaterThan(0);
    });

    it("should verify lineage history (Semantic Knowledge)", async () => {
      const lineageResult = await knowledge.getLineageForUnit(ids.ddd.unitId);
      expect(lineageResult.isOk()).toBe(true);
    });
  });

  // FLOW 5: Similarity Detection

  describe("Flow 5: Similarity Detection", () => {
    it("should detect similar content and query across multiple semantic units", async () => {
      // Similarity detection
      const similar = await retrieval.query({
        text: "Domain-Driven Design bounded context aggregate entity value object",
        topK: 1,
        minScore: 0.0,
      });

      expect(similar.items.length).toBeGreaterThan(0);

      // Cross-unit query
      const crossUnit = await retrieval.query({
        text: "bounded context aggregate entity",
        topK: 10,
        minScore: 0.0,
      });

      expect(crossUnit.items.length).toBeGreaterThan(0);
      const unitIds = new Set(crossUnit.items.map((item) => item.semanticUnitId));
      expect(unitIds.size).toBeGreaterThanOrEqual(1);
    });
  });

  // FLOW 6: Processing Profile Management

  describe("Flow 6: Processing Profile Management", () => {
    it("should create and update a processing profile", async () => {
      // Create
      const customProfileId = crypto.randomUUID();
      const createResult = await processing.createProcessingProfile({
        id: customProfileId,
        name: "Custom Sentence Chunking Profile",
        chunkingStrategyId: "sentence",
        embeddingStrategyId: "hash-embedding",
        configuration: { embeddingDimensions: 256 },
      });

      expect(createResult.isOk()).toBe(true);
      expect(createResult.value.profileId).toBe(customProfileId);
      expect(createResult.value.version).toBe(1);

      // Update
      const updateResult = await processing.updateProcessingProfile({
        id: customProfileId,
        name: "Updated Profile",
        chunkingStrategyId: "recursive",
      });

      expect(updateResult.isOk()).toBe(true);
      expect(updateResult.value.version).toBe(2);
    });

    it("should deprecate a processing profile", async () => {
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
    });
  });

  // FLOW 7: Error Handling & Edge Cases

  describe("Flow 7: Error Handling & Edge Cases", () => {
    it("should reject duplicate source ingestion and duplicate semantic unit creation", async () => {
      // Duplicate source
      const sourceResult = await ingestion.ingestAndExtract({
        sourceId: ids.ddd.sourceId, // Already exists
        sourceName: "Duplicate DDD",
        uri: DOCUMENT_DDD,
        type: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
      });

      expect(sourceResult.isFail()).toBe(true);

      // Duplicate semantic unit
      const unitResult = await knowledge.createSemanticUnitWithLineage({
        id: ids.ddd.unitId, // Already exists
        sourceId: "different-source",
        sourceType: "document",
        content: "Different content",
        language: "en",
        createdBy: "test",
      });

      expect(unitResult.isFail()).toBe(true);
    });

    it("should handle non-existent unit and empty retrieval results gracefully", async () => {
      // Non-existent unit
      const addResult = await knowledge.addSourceToSemanticUnit({
        unitId: "non-existent-id",
        sourceId: "src",
        sourceType: "doc",
        extractedContent: "content",
        contentHash: "hash",
        processingProfileId: "p",
        processingProfileVersion: 1,
      });

      expect(addResult.isFail()).toBe(true);

      // Empty retrieval
      const searchResult = await retrieval.query({
        text: "xyz completely unrelated gibberish topic",
        topK: 5,
        minScore: 0.99,
      });

      expect(searchResult).toBeDefined();
      expect(searchResult.items).toHaveLength(0);
    });
  });

  // FLOW 8: Cross-Context Integrity Verification

  describe("Flow 8: Cross-Context Integrity", () => {
    it("should maintain traceability: sourceId → unitId → vectors → retrieval", async () => {
      // Extraction module exists in ingestion context
      expect(ingestion.extraction).toBeDefined();

      // Semantic unit exists in knowledge context
      const lineageResult = await knowledge.getLineageForUnit(ids.ddd.unitId);
      expect(lineageResult.isOk()).toBe(true);

      // Vector store config exists in processing context
      const vectorStoreConfig = processing.vectorStoreConfig;
      expect(vectorStoreConfig).toBeDefined();

      // Content is retrievable via retrieval context
      const searchResult = await retrieval.query({
        text: "Domain-Driven Design",
        topK: 1,
        minScore: 0.0,
      });
      expect(searchResult.items.length).toBeGreaterThan(0);
    });

    it("should provide direct module access across all services", async () => {
      expect(ingestion.extraction).toBeDefined();
      expect(processing.projection).toBeDefined();
      expect(processing.vectorStoreConfig).toBeDefined();
      expect(processing.createProcessingProfile).toBeDefined();
      expect(knowledge.createSemanticUnit).toBeDefined();
      expect(knowledge.linkSemanticUnits).toBeDefined();
      expect(retrieval.semanticQuery).toBeDefined();
    });
  });

  // FLOW 9: Resource Management

  describe("Flow 9: Resource Management", () => {
    it("should complete resource lifecycle: store → retrieve → delete", async () => {
      // Store
      const resourceId = crypto.randomUUID();
      const textContent = "Hello, this is test content for resource storage.";
      const buffer = new TextEncoder().encode(textContent).buffer;

      const storeResult = await ingestion.storeResource({
        id: resourceId,
        buffer,
        originalName: "test-document.txt",
        mimeType: "text/plain",
      });

      expect(storeResult.isOk()).toBe(true);
      expect(storeResult.value.resourceId).toBe(resourceId);
      expect(storeResult.value.storageUri).toBeTruthy();
      expect(storeResult.value.size).toBe(buffer.byteLength);

      // Retrieve
      const getResult = await ingestion.getResource(resourceId);
      expect(getResult.isOk()).toBe(true);
      expect(getResult.value.id.value).toBe(resourceId);
      expect(getResult.value.originalName).toBe("test-document.txt");
      expect(getResult.value.isStored).toBe(true);

      // Delete
      const deleteResult = await ingestion.deleteResource({ id: resourceId });
      expect(deleteResult.isOk()).toBe(true);
    });

    it("should register external resource and reject duplicate storage", async () => {
      // External resource
      const externalId = crypto.randomUUID();
      const externalUri = "https://example.com/documents/report.pdf";

      const externalResult = await ingestion.registerExternalResource({
        id: externalId,
        name: "External Report",
        mimeType: "application/pdf",
        uri: externalUri,
        size: 1024000,
      });

      expect(externalResult.isOk()).toBe(true);
      expect(externalResult.value.resourceId).toBe(externalId);
      expect(externalResult.value.storageUri).toBe(externalUri);

      // Duplicate rejection
      const dupId = crypto.randomUUID();
      const dupBuffer = new TextEncoder().encode("First content").buffer;

      await ingestion.storeResource({
        id: dupId,
        buffer: dupBuffer,
        originalName: "first.txt",
        mimeType: "text/plain",
      });

      const dupResult = await ingestion.storeResource({
        id: dupId,
        buffer: new TextEncoder().encode("Second content").buffer,
        originalName: "second.txt",
        mimeType: "text/plain",
      });

      expect(dupResult.isFail()).toBe(true);
    });

    it("should complete ingestFile and ingestExternalResource workflows", async () => {
      // ingestFile
      const fileResourceId = crypto.randomUUID();
      const fileSourceId = crypto.randomUUID();
      const textContent = "This is a plain text document for the complete file ingestion workflow test.";
      const buffer = new TextEncoder().encode(textContent).buffer;

      const fileResult = await ingestion.ingestFile({
        resourceId: fileResourceId,
        sourceId: fileSourceId,
        sourceName: "IngestFile Test Document",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: {
          buffer,
          originalName: "ingest-test.txt",
          mimeType: "text/plain",
        },
      });

      expect(fileResult.isOk()).toBe(true);
      expect(fileResult.value.resourceId).toBe(fileResourceId);
      expect(fileResult.value.sourceId).toBe(fileSourceId);
      expect(fileResult.value.storageUri).toBeTruthy();
      expect(fileResult.value.extractedText).toBeTruthy();
      expect(fileResult.value.contentHash).toBeTruthy();

      // ingestExternalResource
      const extResourceId = crypto.randomUUID();
      const extSourceId = crypto.randomUUID();
      const externalUri = "This is external resource content that exists at a known location.";

      const extResult = await ingestion.ingestExternalResource({
        resourceId: extResourceId,
        sourceId: extSourceId,
        sourceName: "External Resource Test",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        uri: externalUri,
        mimeType: "text/plain",
      });

      expect(extResult.isOk()).toBe(true);
      expect(extResult.value.resourceId).toBe(extResourceId);
      expect(extResult.value.sourceId).toBe(extSourceId);
      expect(extResult.value.storageUri).toBe(externalUri);
      expect(extResult.value.extractedText).toBeTruthy();
    });
  });

  // FLOW 10: Real PDF Pipeline (Optional)

  describe.skipIf(!PDF_AVAILABLE)("Flow 10: Real PDF Pipeline", () => {
    it("should process real PDF through complete pipeline: ingest → extract → process → catalog", async () => {
      ids.pdf.sourceId = crypto.randomUUID();
      ids.pdf.unitId = crypto.randomUUID();

      // Ingest and extract
      const ingestResult = await ingestion.ingestAndExtract({
        sourceId: ids.pdf.sourceId,
        sourceName: path.basename(PDF_PATH!),
        uri: PDF_PATH!,
        type: SourceType.Pdf,
        extractionJobId: crypto.randomUUID(),
      });

      expect(ingestResult.isOk()).toBe(true);
      expect(ingestResult.value.sourceId).toBe(ids.pdf.sourceId);
      expect(ingestResult.value.contentHash).toBeTruthy();

      // Extract text
      const extractionResult = await ingestion.extraction.executeExtraction.execute({
        jobId: crypto.randomUUID(),
        sourceId: ids.pdf.sourceId,
        uri: PDF_PATH!,
        mimeType: "application/pdf",
      });

      expect(extractionResult.isOk()).toBe(true);
      expect(extractionResult.value.extractedText.length).toBeGreaterThan(0);
      pdfExtractedText = extractionResult.value.extractedText;

      // Process into embeddings
      const processResult = await processing.processContent({
        projectionId: crypto.randomUUID(),
        semanticUnitId: ids.pdf.unitId,
        semanticUnitVersion: 1,
        content: pdfExtractedText,
        type: ProjectionType.Embedding,
        processingProfileId,
      });

      expect(processResult.isOk()).toBe(true);
      expect(processResult.value.chunksCount).toBeGreaterThan(0);
      expect(processResult.value.dimensions).toBe(DIMENSIONS);

      // Catalog
      const catalogResult = await knowledge.createSemanticUnitWithLineage({
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

      expect(catalogResult.isOk()).toBe(true);
      expect(catalogResult.value.unitId).toBe(ids.pdf.unitId);
    });

    it("should retrieve PDF content via semantic search (Knowledge Retrieval)", async () => {
      const queryText = pdfExtractedText
        .slice(0, 200)
        .replace(/\n/g, " ")
        .trim()
        .split(/\s+/)
        .slice(0, 8)
        .join(" ");

      const result = await retrieval.query({
        text: queryText,
        topK: 5,
        minScore: 0.0,
      });

      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});
