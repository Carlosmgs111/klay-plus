/**
 * Knowledge Management Orchestrator — E2E Tests
 *
 * Tests the management orchestrator using in-memory infrastructure.
 * Validates the ingestAndAddSource multi-step flow and error tracking.
 *
 * Uses the combined platform factory to share services between
 * pipeline (for setup) and management (for testing).
 *
 * Updated for the new domain model:
 * - Context (context-management) manages source grouping + lineage
 * - SourceKnowledge (source-knowledge) manages per-source projection hubs
 * - SemanticProjection uses sourceId-primary
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

import { createKnowledgePlatform } from "../../composition/knowledge-platform.factory";
import type { KnowledgePipelinePort } from "../../knowledge-pipeline/contracts/KnowledgePipelinePort";
import type { KnowledgeManagementPort } from "../contracts/KnowledgeManagementPort";
import { KnowledgeManagementError } from "../domain/KnowledgeManagementError";
import { ManagementStep } from "../domain/ManagementStep";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, "../../../tests/integration/fixtures");

// TEST SUITE

describe("Knowledge Management Orchestrator — E2E", () => {
  let pipeline: KnowledgePipelinePort;
  let management: KnowledgeManagementPort;
  let profileId: string;

  beforeAll(async () => {
    const platform = await createKnowledgePlatform({
      provider: "in-memory",
      embeddingDimensions: 128,
      defaultChunkingStrategy: "recursive",
    });

    pipeline = platform.pipeline;
    management = platform.management;

    // Create a processing profile for all tests
    profileId = "profile-mgmt-001";
    const profileResult = await pipeline.createProcessingProfile({
      id: profileId,
      name: "Management Test Profile",
      chunkingStrategyId: "recursive",
      embeddingStrategyId: "hash-embedding",
      configuration: { embeddingDimensions: 128 },
    });
    expect(profileResult.isOk()).toBe(true);
  });

  // 1. ingestAndAddSource — Full Flow

  describe("ingestAndAddSource", () => {
    it("should ingest, create source-knowledge, process, and add to context", async () => {
      // Setup: create a context via pipeline's catalogDocument
      const ctxResult = await pipeline.catalogDocument({
        contextId: "ctx-mgmt-ias-001",
        name: "DDD Knowledge",
        description: "Domain-Driven Design concepts and patterns",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      // Act: add a source to the context via management (full multi-step flow)
      const cleanFile = path.join(FIXTURES_DIR, "clean-architecture.txt");
      const result = await management.ingestAndAddSource({
        contextId: "ctx-mgmt-ias-001",
        sourceId: "src-mgmt-ias-001",
        sourceName: "Clean Architecture",
        uri: cleanFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-mgmt-ias-001",
        projectionId: "proj-mgmt-ias-001",
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-mgmt-ias-001");
        expect(result.value.sourceKnowledgeId).toBe("sk-src-mgmt-ias-001");
        expect(result.value.contextId).toBe("ctx-mgmt-ias-001");
        expect(result.value.projectionId).toBe("proj-mgmt-ias-001");
        expect(result.value.contentHash).toBeTruthy();
        expect(result.value.extractedTextLength).toBeGreaterThan(0);
        expect(result.value.chunksCount).toBeGreaterThan(0);
        expect(result.value.dimensions).toBe(128);
        expect(result.value.model).toBeTruthy();
      }
    });

    it("should add a second source to the same context", async () => {
      // Act: add another source to the same context
      const dddFile = path.join(FIXTURES_DIR, "ddd-overview.txt");
      const result = await management.ingestAndAddSource({
        contextId: "ctx-mgmt-ias-001",
        sourceId: "src-mgmt-ias-002",
        sourceName: "DDD Overview",
        uri: dddFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-mgmt-ias-002",
        projectionId: "proj-mgmt-ias-002",
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-mgmt-ias-002");
        expect(result.value.contextId).toBe("ctx-mgmt-ias-001");
        expect(result.value.sourceKnowledgeId).toBe("sk-src-mgmt-ias-002");
      }
    });

    it("should support optional resourceId", async () => {
      // Setup: create another context
      const ctxResult = await pipeline.catalogDocument({
        contextId: "ctx-mgmt-ias-002",
        name: "Event Sourcing Knowledge",
        description: "Event sourcing concepts",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      // Act: add source with resourceId
      const esFile = path.join(FIXTURES_DIR, "event-sourcing.txt");
      const result = await management.ingestAndAddSource({
        contextId: "ctx-mgmt-ias-002",
        sourceId: "src-mgmt-ias-003",
        sourceName: "Event Sourcing",
        uri: esFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-mgmt-ias-003",
        projectionId: "proj-mgmt-ias-003",
        processingProfileId: profileId,
        resourceId: "res-mgmt-ias-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.resourceId).toBe("res-mgmt-ias-001");
      }
    });
  });

  // 2. Error at Ingestion Step

  describe("error at ingestion step", () => {
    it("should return error with step=ingestion and empty completedSteps", async () => {
      // Setup: create a context
      const ctxResult = await pipeline.catalogDocument({
        contextId: "ctx-mgmt-err-ing",
        name: "Error Test Context",
        description: "For error testing",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      // Act: try to register a source with a duplicate sourceId (already used in first test)
      // The ingestion step (registerSource) should fail due to the duplicate ID
      const dddFile = path.join(FIXTURES_DIR, "ddd-overview.txt");
      const result = await management.ingestAndAddSource({
        contextId: "ctx-mgmt-err-ing",
        sourceId: "src-mgmt-ias-001", // duplicate — already registered in first test
        sourceName: "Duplicate Source",
        uri: dddFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-mgmt-err-ing-001",
        projectionId: "proj-mgmt-err-ing-001",
        processingProfileId: profileId,
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeManagementError);
        expect(result.error.step).toBe(ManagementStep.Ingestion);
        expect(result.error.code).toBe("MANAGEMENT_INGESTION_FAILED");
        expect(result.error.completedSteps).toEqual([]);
      }
    });
  });

  // 3. Error at AddToContext Step

  describe("error at add-to-context step", () => {
    it("should auto-create context when it does not exist", async () => {
      // Act: ingest a file targeting a non-existent context — should auto-create it
      const tmpFile = path.join(os.tmpdir(), `klay-mgmt-test-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, "Temporary content for auto-create context test.");

      try {
        const result = await management.ingestAndAddSource({
          contextId: "auto-created-context-001",
          sourceId: "src-mgmt-auto-ctx-001",
          sourceName: "Temp Source",
          uri: tmpFile,
          sourceType: "PLAIN_TEXT",
          extractionJobId: "job-mgmt-auto-ctx-001",
          projectionId: "proj-mgmt-auto-ctx-001",
          processingProfileId: profileId,
        });

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.contextId).toBe("auto-created-context-001");
          expect(result.value.sourceId).toBe("src-mgmt-auto-ctx-001");
          expect(result.value.chunksCount).toBeGreaterThan(0);
        }
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });
  });

  // 4. KnowledgeManagementError Type Verification

  describe("KnowledgeManagementError", () => {
    it("should extract info, handle unknown errors, serialize to JSON, and copy completedSteps", () => {
      // fromStep with structured error
      const fromKnown = KnowledgeManagementError.fromStep(
        ManagementStep.AddToContext,
        { message: "Context not found", code: "CONTEXT_NOT_FOUND" },
        [ManagementStep.Ingestion, ManagementStep.CreateSourceKnowledge, ManagementStep.Processing, ManagementStep.RegisterProjection],
      );
      expect(fromKnown.step).toBe("add-to-context");
      expect(fromKnown.code).toBe("MANAGEMENT_ADD_TO_CONTEXT_FAILED");
      expect(fromKnown.completedSteps).toEqual([
        "ingestion",
        "create-source-knowledge",
        "processing",
        "register-projection",
      ]);
      expect(fromKnown.originalCode).toBe("CONTEXT_NOT_FOUND");
      expect(fromKnown.originalMessage).toBe("Context not found");

      // fromStep with unknown error type
      const fromUnknown = KnowledgeManagementError.fromStep(
        ManagementStep.Processing,
        42,
        [ManagementStep.Ingestion, ManagementStep.CreateSourceKnowledge],
      );
      expect(fromUnknown.step).toBe("processing");
      expect(fromUnknown.code).toBe("MANAGEMENT_PROCESSING_FAILED");
      expect(fromUnknown.completedSteps).toEqual(["ingestion", "create-source-knowledge"]);
      expect(fromUnknown.originalCode).toBeUndefined();
      expect(fromUnknown.originalMessage).toBeUndefined();

      // toJSON serialization
      const error = KnowledgeManagementError.fromStep(
        ManagementStep.Ingestion,
        new Error("Something went wrong"),
        [],
      );
      const json = error.toJSON();
      expect(json.name).toBe("KnowledgeManagementError");
      expect(json.step).toBe("ingestion");
      expect(json.code).toBe("MANAGEMENT_INGESTION_FAILED");
      expect(json.completedSteps).toEqual([]);
      expect(json.originalMessage).toBe("Something went wrong");

      // completedSteps is a copy (not a reference)
      const steps: ManagementStep[] = [ManagementStep.Ingestion];
      const copyError = KnowledgeManagementError.fromStep(
        ManagementStep.CreateSourceKnowledge,
        new Error("fail"),
        steps,
      );
      steps.push(ManagementStep.Processing);
      expect(copyError.completedSteps).toEqual(["ingestion"]);
    });
  });
});
