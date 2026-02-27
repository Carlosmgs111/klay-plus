/**
 * Knowledge Management Orchestrator — E2E Tests
 *
 * Tests the management orchestrator using in-memory infrastructure.
 * Validates the ingestAndAddSource multi-step flow and error tracking.
 *
 * Uses the combined platform factory to share services between
 * pipeline (for setup) and management (for testing).
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
    it("should ingest, add source, and process for an existing unit", async () => {
      // Setup: create a unit via pipeline
      const dddFile = path.join(FIXTURES_DIR, "ddd-overview.txt");
      const execResult = await pipeline.execute({
        sourceId: "src-mgmt-ias-001",
        sourceName: "DDD Overview",
        uri: dddFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-mgmt-ias-001",
        projectionId: "proj-mgmt-ias-001",
        semanticUnitId: "unit-mgmt-ias-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });
      expect(execResult.isOk()).toBe(true);

      // Act: add a second source via management (full multi-step flow)
      const cleanFile = path.join(FIXTURES_DIR, "clean-architecture.txt");
      const result = await management.ingestAndAddSource({
        unitId: "unit-mgmt-ias-001",
        sourceId: "src-mgmt-ias-002",
        sourceName: "Clean Architecture",
        uri: cleanFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-mgmt-ias-002",
        projectionId: "proj-mgmt-ias-002",
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-mgmt-ias-002");
        expect(result.value.unitId).toBe("unit-mgmt-ias-001");
        expect(result.value.version).toBeGreaterThan(1);
        expect(result.value.projectionId).toBe("proj-mgmt-ias-002");
        expect(result.value.contentHash).toBeTruthy();
        expect(result.value.extractedTextLength).toBeGreaterThan(0);
        expect(result.value.chunksCount).toBeGreaterThan(0);
        expect(result.value.dimensions).toBe(128);
        expect(result.value.model).toBeTruthy();
      }
    });

    it("should support optional resourceId", async () => {
      // Setup: create another unit
      const esFile = path.join(FIXTURES_DIR, "event-sourcing.txt");
      const execResult = await pipeline.execute({
        sourceId: "src-mgmt-ias-003",
        sourceName: "Event Sourcing",
        uri: esFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-mgmt-ias-003",
        projectionId: "proj-mgmt-ias-003",
        semanticUnitId: "unit-mgmt-ias-002",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });
      expect(execResult.isOk()).toBe(true);

      // Act: add source with resourceId
      const dddUpdFile = path.join(FIXTURES_DIR, "ddd-overview-updated.txt");
      const result = await management.ingestAndAddSource({
        unitId: "unit-mgmt-ias-002",
        sourceId: "src-mgmt-ias-004",
        sourceName: "DDD Updated",
        uri: dddUpdFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-mgmt-ias-004",
        projectionId: "proj-mgmt-ias-004",
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
      // Act: try to register a source with a duplicate sourceId (already used in first test)
      // The ingestion step (registerSource) should fail due to the duplicate ID
      const dddFile = path.join(FIXTURES_DIR, "ddd-overview.txt");
      const result = await management.ingestAndAddSource({
        unitId: "unit-mgmt-ias-001",
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

  // 3. Error at AddSource Step

  describe("error at add-source step", () => {
    it("should return error with step=add-source and completedSteps=[ingestion]", async () => {
      // Act: ingest a file that hasn't been used yet, targeting a non-existent unit
      // Ingestion succeeds (valid file), but addSource fails (unit doesn't exist)
      const tmpFile = path.join(os.tmpdir(), `klay-mgmt-test-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, "Temporary content for add-source error test.");

      try {
        const result = await management.ingestAndAddSource({
          unitId: "non-existent-unit-for-add-source",
          sourceId: "src-mgmt-err-add-001",
          sourceName: "Temp Source",
          uri: tmpFile,
          sourceType: "PLAIN_TEXT",
          extractionJobId: "job-mgmt-err-add-001",
          projectionId: "proj-mgmt-err-add-001",
          processingProfileId: profileId,
        });

        expect(result.isFail()).toBe(true);
        if (result.isFail()) {
          expect(result.error).toBeInstanceOf(KnowledgeManagementError);
          expect(result.error.step).toBe(ManagementStep.AddSource);
          expect(result.error.code).toBe("MANAGEMENT_ADD_SOURCE_FAILED");
          expect(result.error.completedSteps).toEqual([ManagementStep.Ingestion]);
        }
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });
  });

  // 4. KnowledgeManagementError Type Verification

  describe("KnowledgeManagementError", () => {
    it("fromStep should extract code and message from original error", () => {
      const originalError = {
        message: "Unit not found",
        code: "UNIT_NOT_FOUND",
      };

      const mgmtError = KnowledgeManagementError.fromStep(
        ManagementStep.AddSource,
        originalError,
        [ManagementStep.Ingestion],
      );

      expect(mgmtError.step).toBe("add-source");
      expect(mgmtError.code).toBe("MANAGEMENT_ADD_SOURCE_FAILED");
      expect(mgmtError.completedSteps).toEqual(["ingestion"]);
      expect(mgmtError.originalCode).toBe("UNIT_NOT_FOUND");
      expect(mgmtError.originalMessage).toBe("Unit not found");
    });

    it("fromStep should handle unknown error types gracefully", () => {
      const mgmtError = KnowledgeManagementError.fromStep(
        ManagementStep.Processing,
        42,
        [ManagementStep.Ingestion, ManagementStep.AddSource],
      );

      expect(mgmtError.step).toBe("processing");
      expect(mgmtError.code).toBe("MANAGEMENT_PROCESSING_FAILED");
      expect(mgmtError.completedSteps).toEqual(["ingestion", "add-source"]);
      expect(mgmtError.originalCode).toBeUndefined();
      expect(mgmtError.originalMessage).toBeUndefined();
    });

    it("toJSON should produce serializable output with step and completedSteps", () => {
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
    });

    it("completedSteps should be a copy (not a reference)", () => {
      const steps: ManagementStep[] = [ManagementStep.Ingestion];
      const error = KnowledgeManagementError.fromStep(
        ManagementStep.AddSource,
        new Error("fail"),
        steps,
      );

      // Mutating the original array should not affect the error
      steps.push(ManagementStep.Processing);
      expect(error.completedSteps).toEqual(["ingestion"]);
    });
  });
});
