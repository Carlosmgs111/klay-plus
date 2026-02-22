/**
 * Knowledge Pipeline Orchestrator — E2E Tests
 *
 * Tests the complete orchestrator using in-memory infrastructure.
 * Validates the full pipeline flow, granular operations, error tracking,
 * and architectural boundaries.
 *
 * Run with:
 *   npx vitest run src/backend/klay+/application/knowledge-pipeline/__tests__/e2e.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

import { createKnowledgePipeline } from "../composition/knowledge-pipeline.factory.js";
import type { KnowledgePipelinePort } from "../contracts/KnowledgePipelinePort.js";
import { PipelineStep } from "../domain/PipelineStep.js";
import { KnowledgePipelineError } from "../domain/KnowledgePipelineError.js";

// ─── Load Test Fixtures ────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, "../../../tests/integration/fixtures");

function loadFixture(filename: string): string {
  const filePath = path.join(FIXTURES_DIR, filename);
  return fs.readFileSync(filePath, "utf-8").trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════════

describe("Knowledge Pipeline Orchestrator — E2E", () => {
  let pipeline: KnowledgePipelinePort;
  let profileId: string;

  // ─── Setup ──────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    pipeline = await createKnowledgePipeline({
      provider: "in-memory",
      embeddingDimensions: 128,
      defaultChunkingStrategy: "recursive",
    });

    // Create a processing profile for all tests
    profileId = "profile-test-001";
    const profileResult = await pipeline.createProcessingProfile({
      id: profileId,
      name: "Test Profile",
      chunkingStrategyId: "recursive",
      embeddingStrategyId: "hash-embedding",
      configuration: { embeddingDimensions: 128 },
    });
    expect(profileResult.isOk()).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Full Pipeline: execute()
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Full Pipeline — execute()", () => {
    it("should execute the complete pipeline: ingest → process → catalog", async () => {
      const tmpFile = path.join(FIXTURES_DIR, "ddd-overview.txt");

      const result = await pipeline.execute({
        sourceId: "src-ddd-001",
        sourceName: "DDD Overview",
        uri: tmpFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-ddd-001",
        projectionId: "proj-ddd-001",
        semanticUnitId: "unit-ddd-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-ddd-001");
        expect(result.value.unitId).toBe("unit-ddd-001");
        expect(result.value.projectionId).toBe("proj-ddd-001");
        expect(result.value.contentHash).toBeTruthy();
        expect(result.value.extractedTextLength).toBeGreaterThan(0);
        expect(result.value.chunksCount).toBeGreaterThan(0);
        expect(result.value.dimensions).toBe(128);
        expect(result.value.model).toBeTruthy();
      }
    });

    it("should fail at ingestion step for duplicate source", async () => {
      const tmpFile = path.join(FIXTURES_DIR, "ddd-overview.txt");

      const result = await pipeline.execute({
        sourceId: "src-ddd-001",
        sourceName: "DDD Overview Duplicate",
        uri: tmpFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-ddd-dup",
        projectionId: "proj-ddd-dup",
        semanticUnitId: "unit-ddd-dup",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgePipelineError);
        expect(result.error.step).toBe(PipelineStep.Ingestion);
        expect(result.error.completedSteps).toEqual([]);
        expect(result.error.code).toBe("PIPELINE_INGESTION_FAILED");
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Granular Operations
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Granular Operations", () => {
    it("should ingest a document independently", async () => {
      const tmpFile = path.join(FIXTURES_DIR, "clean-architecture.txt");

      const result = await pipeline.ingestDocument({
        sourceId: "src-clean-001",
        sourceName: "Clean Architecture",
        uri: tmpFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-clean-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-clean-001");
        expect(result.value.extractedText).toBeTruthy();
        expect(result.value.extractedText.length).toBeGreaterThan(0);
        expect(result.value.contentHash).toBeTruthy();
      }
    });

    it("should process a document independently", async () => {
      const content = loadFixture("clean-architecture.txt");

      const result = await pipeline.processDocument({
        projectionId: "proj-clean-001",
        semanticUnitId: "unit-clean-001",
        semanticUnitVersion: 1,
        content,
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.projectionId).toBe("proj-clean-001");
        expect(result.value.chunksCount).toBeGreaterThan(0);
        expect(result.value.dimensions).toBe(128);
      }
    });

    it("should catalog a document independently", async () => {
      const content = loadFixture("clean-architecture.txt");

      const result = await pipeline.catalogDocument({
        id: "unit-clean-001",
        sourceId: "src-clean-001",
        sourceType: "PLAIN_TEXT",
        content,
        language: "en",
        createdBy: "test",
        topics: ["architecture", "clean-code"],
        tags: ["software-design"],
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.unitId).toBe("unit-clean-001");
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Search — Independent from Construction Pipeline
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Search Knowledge", () => {
    it("should search the knowledge base after pipeline execution", async () => {
      const result = await pipeline.searchKnowledge({
        queryText: "domain driven design",
        topK: 5,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.queryText).toBe("domain driven design");
        expect(result.value.items).toBeDefined();
        expect(result.value.totalFound).toBeGreaterThanOrEqual(0);
      }
    });

    it("should return results with expected shape", async () => {
      const result = await pipeline.searchKnowledge({
        queryText: "software architecture patterns",
        topK: 3,
        minScore: 0.0,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        for (const item of result.value.items) {
          expect(item).toHaveProperty("semanticUnitId");
          expect(item).toHaveProperty("content");
          expect(item).toHaveProperty("score");
          expect(item).toHaveProperty("version");
          expect(item).toHaveProperty("metadata");
          expect(typeof item.score).toBe("number");
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Error Tracking: Step + CompletedSteps
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Error Tracking", () => {
    it("should track completed steps when cataloging fails (duplicate unit)", async () => {
      const esFile = path.join(FIXTURES_DIR, "event-sourcing.txt");

      // Create a temp copy of the same file with a unique path
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "klay-pipeline-"));
      const esCopyFile = path.join(tmpDir, "event-sourcing-copy.txt");
      fs.copyFileSync(esFile, esCopyFile);

      // First: full pipeline succeeds with event-sourcing document
      const first = await pipeline.execute({
        sourceId: "src-es-001",
        sourceName: "Event Sourcing",
        uri: esFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-es-001",
        projectionId: "proj-es-001",
        semanticUnitId: "unit-es-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });
      expect(first.isOk()).toBe(true);

      // Second: DIFFERENT source + URI but SAME semanticUnitId → should fail at cataloging
      const second = await pipeline.execute({
        sourceId: "src-es-002",
        sourceName: "Event Sourcing v2",
        uri: esCopyFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-es-002",
        projectionId: "proj-es-002",
        semanticUnitId: "unit-es-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });

      expect(second.isFail()).toBe(true);
      if (second.isFail()) {
        expect(second.error.step).toBe(PipelineStep.Cataloging);
        expect(second.error.completedSteps).toContain(PipelineStep.Ingestion);
        expect(second.error.completedSteps).toContain(PipelineStep.Processing);
        expect(second.error.completedSteps).not.toContain(PipelineStep.Cataloging);
      }
    });

    it("KnowledgePipelineError.fromStep should extract code and message from original error", () => {
      const originalError = {
        message: "Source not found",
        code: "SOURCE_NOT_FOUND",
      };

      const pipelineError = KnowledgePipelineError.fromStep(
        PipelineStep.Ingestion,
        originalError,
        [],
      );

      expect(pipelineError.step).toBe("ingestion");
      expect(pipelineError.code).toBe("PIPELINE_INGESTION_FAILED");
      expect(pipelineError.originalCode).toBe("SOURCE_NOT_FOUND");
      expect(pipelineError.originalMessage).toBe("Source not found");
      expect(pipelineError.completedSteps).toEqual([]);
    });

    it("KnowledgePipelineError.fromStep should handle unknown error types gracefully", () => {
      const pipelineError = KnowledgePipelineError.fromStep(
        PipelineStep.Processing,
        42,
        [PipelineStep.Ingestion],
      );

      expect(pipelineError.step).toBe("processing");
      expect(pipelineError.originalCode).toBeUndefined();
      expect(pipelineError.originalMessage).toBeUndefined();
      expect(pipelineError.completedSteps).toEqual(["ingestion"]);
    });

    it("KnowledgePipelineError.toJSON should produce serializable output", () => {
      const error = KnowledgePipelineError.fromStep(
        PipelineStep.Cataloging,
        new Error("Something went wrong"),
        [PipelineStep.Ingestion, PipelineStep.Processing],
      );

      const json = error.toJSON();
      expect(json.name).toBe("KnowledgePipelineError");
      expect(json.step).toBe("cataloging");
      expect(json.code).toBe("PIPELINE_CATALOGING_FAILED");
      expect(json.completedSteps).toEqual(["ingestion", "processing"]);
      expect(json.originalMessage).toBe("Something went wrong");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Full Pipeline with Second Document
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Multiple Documents", () => {
    it("should process a second document through the full pipeline", async () => {
      const tmpFile = path.join(FIXTURES_DIR, "ddd-overview-updated.txt");

      const result = await pipeline.execute({
        sourceId: "src-ddd-v2-001",
        sourceName: "DDD Overview Updated",
        uri: tmpFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-ddd-v2-001",
        projectionId: "proj-ddd-v2-001",
        semanticUnitId: "unit-ddd-v2-001",
        language: "en",
        createdBy: "test",
        topics: ["ddd", "architecture"],
        tags: ["updated"],
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-ddd-v2-001");
        expect(result.value.unitId).toBe("unit-ddd-v2-001");
        expect(result.value.chunksCount).toBeGreaterThan(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Content Manifest Tracking
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Content Manifest Tracking", () => {
    // Use inline text as URI to avoid URI uniqueness conflicts with other tests
    const MANIFEST_CONTENT_1 = "Manifest tracking test content: Domain modeling captures essential business concepts and rules within bounded contexts, enabling teams to build software aligned with domain expertise.";
    const MANIFEST_CONTENT_2 = "Manifest by ID test content: Clean Architecture promotes separation of concerns through concentric layers, where inner layers define business rules and outer layers handle infrastructure.";
    const MANIFEST_CONTENT_3 = "Manifest by source test content: Event Sourcing stores state changes as an immutable sequence of events, providing a complete audit trail and enabling temporal queries.";
    const MANIFEST_CONTENT_4 = "No manifest test content: Hexagonal Architecture uses ports and adapters to decouple business logic from external systems, enabling testability and flexibility.";

    it("should track manifest when resourceId is provided in execute()", async () => {
      const resourceId = "res-manifest-001";
      const sourceId = "src-manifest-001";

      const result = await pipeline.execute({
        sourceId,
        sourceName: "Manifest Tracking Test",
        uri: MANIFEST_CONTENT_1,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-manifest-001",
        projectionId: "proj-manifest-001",
        semanticUnitId: "unit-manifest-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
        resourceId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resourceId).toBe(resourceId);
        expect(result.value.manifestId).toBeTruthy();

        // Retrieve manifest by resourceId
        const manifestResult = await pipeline.getManifest({ resourceId });
        expect(manifestResult.isOk()).toBe(true);
        if (manifestResult.isOk()) {
          expect(manifestResult.value.manifests.length).toBeGreaterThan(0);
          const manifest = manifestResult.value.manifests[0];
          expect(manifest.resourceId).toBe(resourceId);
          expect(manifest.sourceId).toBe(sourceId);
          expect(manifest.status).toBe("complete");
          expect(manifest.completedSteps).toContain("ingestion");
          expect(manifest.completedSteps).toContain("processing");
          expect(manifest.contentHash).toBeTruthy();
          expect(manifest.extractedTextLength).toBeGreaterThan(0);
          expect(manifest.chunksCount).toBeGreaterThan(0);
        }
      }
    });

    it("should retrieve manifest by manifestId", async () => {
      const resourceId = "res-manifest-002";

      const result = await pipeline.execute({
        sourceId: "src-manifest-002",
        sourceName: "Manifest By ID Test",
        uri: MANIFEST_CONTENT_2,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-manifest-002",
        projectionId: "proj-manifest-002",
        semanticUnitId: "unit-manifest-002",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
        resourceId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const manifestId = result.value.manifestId!;
        expect(manifestId).toBeTruthy();

        const manifestResult = await pipeline.getManifest({ manifestId });
        expect(manifestResult.isOk()).toBe(true);
        if (manifestResult.isOk()) {
          expect(manifestResult.value.manifests).toHaveLength(1);
          expect(manifestResult.value.manifests[0].id).toBe(manifestId);
        }
      }
    });

    it("should retrieve manifest by sourceId", async () => {
      const sourceId = "src-manifest-003";

      const result = await pipeline.execute({
        sourceId,
        sourceName: "Manifest By Source Test",
        uri: MANIFEST_CONTENT_3,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-manifest-003",
        projectionId: "proj-manifest-003",
        semanticUnitId: "unit-manifest-003",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
        resourceId: "res-manifest-003",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const manifestResult = await pipeline.getManifest({ sourceId });
        expect(manifestResult.isOk()).toBe(true);
        if (manifestResult.isOk()) {
          expect(manifestResult.value.manifests.length).toBeGreaterThan(0);
          expect(manifestResult.value.manifests[0].sourceId).toBe(sourceId);
        }
      }
    });

    it("should NOT create manifest when resourceId is omitted", async () => {
      const result = await pipeline.execute({
        sourceId: "src-no-manifest-001",
        sourceName: "No Manifest Test",
        uri: MANIFEST_CONTENT_4,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-no-manifest-001",
        projectionId: "proj-no-manifest-001",
        semanticUnitId: "unit-no-manifest-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
        // No resourceId
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resourceId).toBeUndefined();
        expect(result.value.manifestId).toBeUndefined();
      }
    });

    it("should record failed manifest when pipeline fails at ingestion", async () => {
      const resourceId = "res-manifest-fail-001";

      // Use a duplicate sourceId to force ingestion failure
      const result = await pipeline.execute({
        sourceId: "src-ddd-001", // Already exists from earlier test
        sourceName: "Should Fail",
        uri: "duplicate-content-for-failure-test",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-fail-001",
        projectionId: "proj-fail-001",
        semanticUnitId: "unit-fail-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
        resourceId,
      });

      expect(result.isFail()).toBe(true);

      // The manifest should have been recorded with "failed" status
      const manifestResult = await pipeline.getManifest({ resourceId });
      expect(manifestResult.isOk()).toBe(true);
      if (manifestResult.isOk()) {
        expect(manifestResult.value.manifests.length).toBeGreaterThan(0);
        const manifest = manifestResult.value.manifests[0];
        expect(manifest.status).toBe("failed");
        expect(manifest.failedStep).toBe("ingestion");
        expect(manifest.completedSteps).toEqual([]);
      }
    });

    it("should return empty array for non-existent resourceId", async () => {
      const manifestResult = await pipeline.getManifest({
        resourceId: "non-existent-resource",
      });

      expect(manifestResult.isOk()).toBe(true);
      if (manifestResult.isOk()) {
        expect(manifestResult.value.manifests).toEqual([]);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Processing Profile Management
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Processing Profile Management", () => {
    it("should create a processing profile via the pipeline", async () => {
      const result = await pipeline.createProcessingProfile({
        id: "profile-custom-001",
        name: "Custom Profile",
        chunkingStrategyId: "sentence",
        embeddingStrategyId: "hash-embedding",
        configuration: { embeddingDimensions: 256 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.profileId).toBe("profile-custom-001");
        expect(result.value.version).toBe(1);
      }
    });

    it("should reject duplicate profile creation", async () => {
      const result = await pipeline.createProcessingProfile({
        id: profileId,
        name: "Duplicate",
        chunkingStrategyId: "recursive",
        embeddingStrategyId: "hash-embedding",
      });

      expect(result.isFail()).toBe(true);
    });
  });
});
