/**
 * Knowledge Pipeline Orchestrator — E2E Tests
 *
 * Tests the complete orchestrator using in-memory infrastructure.
 * Validates the full pipeline flow, granular operations, error tracking,
 * and architectural boundaries.
 *
 * Updated for the new domain model:
 * - Context (context-management context) manages source grouping + lineage
 * - SemanticProjection uses sourceId-primary
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

import { createKnowledgePipeline } from "../composition/knowledge-pipeline.factory";
import type { KnowledgePipelinePort } from "../contracts/KnowledgePipelinePort";
import { PipelineStep } from "../domain/PipelineStep";
import { KnowledgePipelineError } from "../domain/KnowledgePipelineError";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, "../../../tests/integration/fixtures");

function loadFixture(filename: string): string {
  const filePath = path.join(FIXTURES_DIR, filename);
  return fs.readFileSync(filePath, "utf-8").trim();
}

describe("Knowledge Pipeline Orchestrator — E2E", () => {
  let pipeline: KnowledgePipelinePort;
  let profileId: string;

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
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
      projection: { strategyId: "hash-embedding", config: {} },
    });
    expect(profileResult.isOk()).toBe(true);
  });

  // 1. Full Pipeline: execute()

  describe("Full Pipeline — execute()", () => {
    it("should execute the complete pipeline: ingest -> process", async () => {
      const tmpFile = path.join(FIXTURES_DIR, "ddd-overview.txt");

      const result = await pipeline.execute({
        sourceId: "src-ddd-001",
        sourceName: "DDD Overview",
        uri: tmpFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-ddd-001",
        projectionId: "proj-ddd-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-ddd-001");
        expect(result.value.sourceKnowledgeId).toBe("sk-src-ddd-001");
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

    it("should execute pipeline with contextId and add source to context", async () => {
      // First create a context
      const contextResult = await pipeline.catalogDocument({
        contextId: "ctx-test-001",
        name: "Test Context",
        description: "A context for testing",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(contextResult.isOk()).toBe(true);

      // Execute pipeline with contextId — use inline text to avoid URI conflicts with other tests
      const result = await pipeline.execute({
        sourceId: "src-ctx-001",
        sourceName: "Clean Arch for Context",
        uri: "Context test content: Clean Architecture separates business rules from infrastructure concerns using dependency inversion and boundary layers.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-ctx-001",
        projectionId: "proj-ctx-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
        contextId: "ctx-test-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe("ctx-test-001");
        expect(result.value.sourceKnowledgeId).toBeTruthy();
      }
    });
  });

  // 2. Granular Operations

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

    it("should process a document independently (sourceId-primary)", async () => {
      const content = loadFixture("clean-architecture.txt");

      const result = await pipeline.processDocument({
        projectionId: "proj-clean-001",
        sourceId: "src-clean-standalone",
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

    it("should catalog a document (create context) independently", async () => {
      const result = await pipeline.catalogDocument({
        contextId: "ctx-clean-001",
        name: "Clean Architecture",
        description: "Clean Architecture principles and patterns",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
        tags: ["software-design"],
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe("ctx-clean-001");
      }
    });
  });

  // 3. Search — Independent from Construction Pipeline

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
          expect(item).toHaveProperty("sourceId");
          expect(item).toHaveProperty("content");
          expect(item).toHaveProperty("score");
          expect(item).toHaveProperty("metadata");
          expect(typeof item.score).toBe("number");
        }
      }
    });
  });

  // 4. Error Tracking: Step + CompletedSteps

  describe("Error Tracking", () => {
    it("should successfully process a second document with different sourceId", async () => {
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
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });
      expect(first.isOk()).toBe(true);

      // Second: DIFFERENT source but SAME sourceId pattern would fail at ingestion (source already exists)
      // Use a truly different source to get past ingestion, but same sourceKnowledgeId to fail at cataloging
      const second = await pipeline.execute({
        sourceId: "src-es-002",
        sourceName: "Event Sourcing v2",
        uri: esCopyFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-es-002",
        projectionId: "proj-es-002",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });

      // This should succeed because src-es-002 is a new source
      expect(second.isOk()).toBe(true);
    });

    it("KnowledgePipelineError should extract info, handle unknown errors, and serialize to JSON", () => {
      // fromStep with structured error
      const fromKnown = KnowledgePipelineError.fromStep(
        PipelineStep.Ingestion,
        { message: "Source not found", code: "SOURCE_NOT_FOUND" },
        [],
      );
      expect(fromKnown.step).toBe("ingestion");
      expect(fromKnown.code).toBe("PIPELINE_INGESTION_FAILED");
      expect(fromKnown.originalCode).toBe("SOURCE_NOT_FOUND");
      expect(fromKnown.originalMessage).toBe("Source not found");
      expect(fromKnown.completedSteps).toEqual([]);

      // fromStep with unknown error type
      const fromUnknown = KnowledgePipelineError.fromStep(
        PipelineStep.Processing,
        42,
        [PipelineStep.Ingestion],
      );
      expect(fromUnknown.step).toBe("processing");
      expect(fromUnknown.originalCode).toBeUndefined();
      expect(fromUnknown.originalMessage).toBeUndefined();
      expect(fromUnknown.completedSteps).toEqual(["ingestion"]);

      // toJSON serialization
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

  // 5. Full Pipeline with Second Document

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
        language: "en",
        createdBy: "test",
        topics: ["ddd", "architecture"],
        tags: ["updated"],
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-ddd-v2-001");
        expect(result.value.sourceKnowledgeId).toBe("sk-src-ddd-v2-001");
        expect(result.value.chunksCount).toBeGreaterThan(0);
      }
    });
  });

  // 6. Content Manifest Tracking

  describe("Content Manifest Tracking", () => {
    // Use inline text as URI to avoid URI uniqueness conflicts with other tests
    const MANIFEST_CONTENT_1 = "Manifest tracking test content: Domain modeling captures essential business concepts and rules within bounded contexts, enabling teams to build software aligned with domain expertise.";
    const MANIFEST_CONTENT_3 = "Manifest by source test content: Event Sourcing stores state changes as an immutable sequence of events, providing a complete audit trail and enabling temporal queries.";
    const MANIFEST_CONTENT_4 = "No manifest test content: Hexagonal Architecture uses ports and adapters to decouple business logic from external systems, enabling testability and flexibility.";

    it("should track manifest and retrieve by resourceId or manifestId", async () => {
      // Execute with resourceId
      const resourceId = "res-manifest-001";
      const sourceId = "src-manifest-001";

      const result = await pipeline.execute({
        sourceId,
        sourceName: "Manifest Tracking Test",
        uri: MANIFEST_CONTENT_1,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-manifest-001",
        projectionId: "proj-manifest-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
        resourceId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resourceId).toBe(resourceId);
        expect(result.value.manifestId).toBeTruthy();

        // Retrieve by resourceId
        const byResource = await pipeline.getManifest({ resourceId });
        expect(byResource.isOk()).toBe(true);
        if (byResource.isOk()) {
          expect(byResource.value.manifests.length).toBeGreaterThan(0);
          const manifest = byResource.value.manifests[0];
          expect(manifest.resourceId).toBe(resourceId);
          expect(manifest.sourceId).toBe(sourceId);
          expect(manifest.status).toBe("complete");
          expect(manifest.completedSteps).toContain("ingestion");
          expect(manifest.completedSteps).toContain("processing");
          expect(manifest.contentHash).toBeTruthy();
          expect(manifest.extractedTextLength).toBeGreaterThan(0);
          expect(manifest.chunksCount).toBeGreaterThan(0);
        }

        // Retrieve by manifestId
        const manifestId = result.value.manifestId!;
        const byManifest = await pipeline.getManifest({ manifestId });
        expect(byManifest.isOk()).toBe(true);
        if (byManifest.isOk()) {
          expect(byManifest.value.manifests).toHaveLength(1);
          expect(byManifest.value.manifests[0].id).toBe(manifestId);
        }
      }
    });

    it("should retrieve manifest by sourceId and return empty for unknown", async () => {
      const sourceId = "src-manifest-003";

      const result = await pipeline.execute({
        sourceId,
        sourceName: "Manifest By Source Test",
        uri: MANIFEST_CONTENT_3,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-manifest-003",
        projectionId: "proj-manifest-003",
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

      // Non-existent resourceId returns empty
      const emptyResult = await pipeline.getManifest({ resourceId: "non-existent-resource" });
      expect(emptyResult.isOk()).toBe(true);
      if (emptyResult.isOk()) {
        expect(emptyResult.value.manifests).toEqual([]);
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
  });

  // 7. Processing Profile Management

  describe("Processing Profile Management", () => {
    it("should create a processing profile via the pipeline", async () => {
      const result = await pipeline.createProcessingProfile({
        id: "profile-custom-001",
        name: "Custom Profile",
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "sentence", config: {} },
        projection: { strategyId: "hash-embedding", config: {} },
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
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
        projection: { strategyId: "hash-embedding", config: {} },
      });

      expect(result.isFail()).toBe(true);
    });

    it("should list all profiles via the pipeline", async () => {
      const result = await pipeline.listProfiles();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.profiles.length).toBeGreaterThanOrEqual(2);
        const profile = result.value.profiles.find((p) => p.id === "profile-custom-001");
        expect(profile).toBeDefined();
        expect(profile!.name).toBe("Custom Profile");
        expect(profile!.fragmentation.strategyId).toBe("sentence");
        expect(profile!.status).toBe("ACTIVE");
        expect(profile!.createdAt).toBeTruthy();
      }
    });

    it("should update a profile via the pipeline", async () => {
      const result = await pipeline.updateProfile({
        id: "profile-custom-001",
        name: "Updated Custom Profile",
        fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.profileId).toBe("profile-custom-001");
        expect(result.value.version).toBe(2);
      }
    });

    it("should deprecate a profile via the pipeline", async () => {
      const result = await pipeline.deprecateProfile({
        id: "profile-custom-001",
        reason: "No longer needed",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.profileId).toBe("profile-custom-001");
      }

      // Verify it shows as deprecated in the list
      const listResult = await pipeline.listProfiles();
      expect(listResult.isOk()).toBe(true);
      if (listResult.isOk()) {
        const deprecatedProfile = listResult.value.profiles.find(
          (p) => p.id === "profile-custom-001",
        );
        expect(deprecatedProfile).toBeDefined();
        expect(deprecatedProfile!.status).toBe("DEPRECATED");
      }
    });

    it("should fail to update a deprecated profile", async () => {
      const result = await pipeline.updateProfile({
        id: "profile-custom-001",
        name: "Should Fail",
      });

      expect(result.isFail()).toBe(true);
    });

    it("should fail to deprecate an already deprecated profile", async () => {
      const result = await pipeline.deprecateProfile({
        id: "profile-custom-001",
        reason: "Again",
      });

      expect(result.isFail()).toBe(true);
    });
  });
});
