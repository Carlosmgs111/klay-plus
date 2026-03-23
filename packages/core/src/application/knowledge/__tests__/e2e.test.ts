/**
 * Knowledge Orchestrator — E2E Tests
 *
 * Tests the complete unified orchestrator using in-memory infrastructure.
 * Validates pipeline flow, lifecycle operations, error tracking,
 * and architectural boundaries.
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

import { createKnowledgePlatform } from "../composition/knowledge.factory";
import type { KnowledgeCoordinator } from "../KnowledgeCoordinator";
import { OperationStep } from "../domain/OperationStep";
import { KnowledgeError } from "../domain/KnowledgeError";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, "../../../tests/integration/fixtures");

describe("Knowledge Orchestrator — E2E", () => {
  let knowledge: KnowledgeCoordinator;
  let profileId: string;

  beforeAll(async () => {
    knowledge = await createKnowledgePlatform({
      provider: "in-memory",
      embeddingDimensions: 128,
      defaultChunkingStrategy: "recursive",
    });

    // Create a processing profile for all tests
    profileId = "profile-test-001";
    const profileResult = await knowledge.createProfile({
      id: profileId,
      name: "Test Profile",
      preparation: { strategyId: "basic", config: {} },
      fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
      projection: { strategyId: "hash-embedding", config: {} },
    });
    expect(profileResult.isOk()).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════════
  // PIPELINE TESTS
  // ═══════════════════════════════════════════════════════════════════

  // 1. Full Pipeline via processKnowledge()

  describe("Full Pipeline — processKnowledge()", () => {
    it("should execute the complete pipeline: ingest -> process", async () => {
      const tmpFile = path.join(FIXTURES_DIR, "ddd-overview.txt");

      const result = await knowledge.process({
        sourceId: "src-ddd-001",
        sourceName: "DDD Overview",
        uri: tmpFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-ddd-001",
        projectionId: "proj-ddd-001",
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-ddd-001");
        expect(result.value.completedSteps).toContain("ingestion");
        expect(result.value.completedSteps).toContain("processing");
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

      const result = await knowledge.process({
        sourceId: "src-ddd-001",
        sourceName: "DDD Overview Duplicate",
        uri: tmpFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-ddd-dup",
        projectionId: "proj-ddd-dup",
        processingProfileId: profileId,
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeError);
        expect(result.error.step).toBe(OperationStep.Ingestion);
        expect(result.error.completedSteps).toEqual([]);
        expect(result.error.code).toBe("KNOWLEDGE_INGESTION_FAILED");
      }
    });

    it("should execute pipeline with contextId and add source to context", async () => {
      const contextResult = await knowledge.createContext({
        id: "ctx-test-001",
        name: "Test Context",
        description: "A context for testing",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(contextResult.isOk()).toBe(true);

      const result = await knowledge.process({
        sourceId: "src-ctx-001",
        sourceName: "Clean Arch for Context",
        uri: "Context test content: Clean Architecture separates business rules from infrastructure concerns using dependency inversion and boundary layers.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-ctx-001",
        projectionId: "proj-ctx-001",
        processingProfileId: profileId,
        contextId: "ctx-test-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe("ctx-test-001");
        expect(result.value.completedSteps).toContain("cataloging");
      }
    });
  });

  // 2. Granular Operations

  describe("Granular Operations", () => {
    it("should ingest a document independently", async () => {
      const tmpFile = path.join(FIXTURES_DIR, "clean-architecture.txt");

      const result = await knowledge.process({
        sourceId: "src-clean-001",
        sourceName: "Clean Architecture",
        uri: tmpFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-clean-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-clean-001");
        expect(result.value.completedSteps).toEqual(["ingestion"]);
        expect(result.value.extractedText).toBeTruthy();
        expect(result.value.contentHash).toBeTruthy();
      }
    });

    it("should process a document independently (sourceId-primary)", async () => {
      const ingestResult = await knowledge.process({
        sourceId: "src-clean-standalone",
        sourceName: "Clean Architecture Standalone",
        uri: "Clean Architecture standalone test: The Dependency Rule states that source code dependencies can only point inwards toward higher-level policies.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-clean-standalone",
      });
      expect(ingestResult.isOk()).toBe(true);

      const result = await knowledge.process({
        sourceId: "src-clean-standalone",
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.projectionId).toBeDefined();
        expect(result.value.chunksCount).toBeGreaterThan(0);
        expect(result.value.dimensions).toBe(128);
      }
    });

    it("should catalog a document (create context) independently", async () => {
      const result = await knowledge.createContext({
        id: "ctx-clean-001",
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

  // 3. Search

  describe("Search Knowledge", () => {
    it("should search the knowledge base after pipeline execution", async () => {
      const result = await knowledge.search({
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
      const result = await knowledge.search({
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

    it("search with retrievalOverride ranking:mmr returns results", async () => {
      // Verifies the override path doesn't throw and returns results
      // Uses the shared in-memory coordinator which already has vector data from beforeAll
      const result = await knowledge.search({
        queryText: "semantic knowledge",
        retrievalOverride: { ranking: "mmr", mmrLambda: 0.5 },
      });

      // Should succeed — MMR with InMemory infra
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toBeDefined();
        // MMR may return fewer results due to diversity filtering, but array must be present
        expect(Array.isArray(result.value.items)).toBe(true);
      }
    });
  });

  // 4. Error Tracking

  describe("Error Tracking", () => {
    it("should successfully process a second document with different sourceId", async () => {
      const esFile = path.join(FIXTURES_DIR, "event-sourcing.txt");

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "klay-pipeline-"));
      const esCopyFile = path.join(tmpDir, "event-sourcing-copy.txt");
      fs.copyFileSync(esFile, esCopyFile);

      const first = await knowledge.process({
        sourceId: "src-es-001",
        sourceName: "Event Sourcing",
        uri: esFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-es-001",
        projectionId: "proj-es-001",
        processingProfileId: profileId,
      });
      expect(first.isOk()).toBe(true);

      const second = await knowledge.process({
        sourceId: "src-es-002",
        sourceName: "Event Sourcing v2",
        uri: esCopyFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-es-002",
        projectionId: "proj-es-002",
        processingProfileId: profileId,
      });

      expect(second.isOk()).toBe(true);
    });

    it("KnowledgeError should extract info, handle unknown errors, and serialize to JSON", () => {
      const fromKnown = KnowledgeError.fromStep(
        OperationStep.Ingestion,
        { message: "Source not found", code: "SOURCE_NOT_FOUND" },
        [],
      );
      expect(fromKnown.step).toBe("ingestion");
      expect(fromKnown.code).toBe("KNOWLEDGE_INGESTION_FAILED");
      expect(fromKnown.originalCode).toBe("SOURCE_NOT_FOUND");
      expect(fromKnown.originalMessage).toBe("Source not found");
      expect(fromKnown.completedSteps).toEqual([]);

      const fromUnknown = KnowledgeError.fromStep(
        OperationStep.Processing,
        42,
        [OperationStep.Ingestion],
      );
      expect(fromUnknown.step).toBe("processing");
      expect(fromUnknown.originalCode).toBeUndefined();
      expect(fromUnknown.originalMessage).toBeUndefined();
      expect(fromUnknown.completedSteps).toEqual(["ingestion"]);

      const error = KnowledgeError.fromStep(
        OperationStep.Cataloging,
        new Error("Something went wrong"),
        [OperationStep.Ingestion, OperationStep.Processing],
      );
      const json = error.toJSON();
      expect(json.name).toBe("KnowledgeError");
      expect(json.step).toBe("cataloging");
      expect(json.code).toBe("KNOWLEDGE_CATALOGING_FAILED");
      expect(json.completedSteps).toEqual(["ingestion", "processing"]);
      expect(json.originalMessage).toBe("Something went wrong");
    });
  });

  // 5. Multiple Documents

  describe("Multiple Documents", () => {
    it("should process a second document through the full pipeline", async () => {
      const tmpFile = path.join(FIXTURES_DIR, "ddd-overview-updated.txt");

      const result = await knowledge.process({
        sourceId: "src-ddd-v2-001",
        sourceName: "DDD Overview Updated",
        uri: tmpFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-ddd-v2-001",
        projectionId: "proj-ddd-v2-001",
        processingProfileId: profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-ddd-v2-001");
        expect(result.value.completedSteps).toContain("ingestion");
        expect(result.value.completedSteps).toContain("processing");
        expect(result.value.chunksCount).toBeGreaterThan(0);
      }
    });
  });

  // 6. Context Details (replaces Content Manifest Tracking)

  describe("Context Details", () => {
    it("should get details for a context with sources and projections", async () => {
      const result = await knowledge.getContext({ contextId: "ctx-test-001" });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe("ctx-test-001");
        expect(result.value.name).toBe("Test Context");
        expect(result.value.state).toBe("ACTIVE");
        expect(result.value.sources.length).toBeGreaterThan(0);
        const source = result.value.sources[0];
        expect(source.sourceId).toBe("src-ctx-001");
        expect(source.sourceName).toBeTruthy();
        expect(source.projectionId).toBeTruthy();
        expect(source.chunksCount).toBeGreaterThan(0);
        expect(source.dimensions).toBe(128);
        expect(source.addedAt).toBeTruthy();
      }
    });

    it("should return empty status for context with no sources", async () => {
      const ctxResult = await knowledge.createContext({
        id: "ctx-empty-details-001",
        name: "Empty Details Context",
        description: "No sources",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      const result = await knowledge.getContext({ contextId: "ctx-empty-details-001" });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sources).toEqual([]);
        expect(result.value.status).toBe("empty");
      }
    });

    it("should fail for non-existent context", async () => {
      const result = await knowledge.getContext({ contextId: "non-existent" });
      expect(result.isFail()).toBe(true);
    });

    it("should list contexts summary with enriched data", async () => {
      const result = await knowledge.listContexts();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contexts.length).toBeGreaterThan(0);
        const ctx = result.value.contexts.find((c) => c.id === "ctx-test-001");
        expect(ctx).toBeDefined();
        expect(ctx!.sourceCount).toBeGreaterThan(0);
        expect(ctx!.projectionCount).toBeGreaterThan(0);
        expect(ctx!.status).toBe("complete");
      }
    });
  });

  // 7. Source Library

  describe("Source Library", () => {
    it("should list all sources in the ecosystem", async () => {
      const result = await knowledge.listSources();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.total).toBeGreaterThan(0);
        const first = result.value.sources[0];
        expect(first).toHaveProperty("id");
        expect(first).toHaveProperty("name");
        expect(first).toHaveProperty("type");
      }
    });

    it("should get detailed source information", async () => {
      const result = await knowledge.getSource({ sourceId: "src-ddd-001" });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const source = result.value.source;
        expect(source.id).toBe("src-ddd-001");
        expect(source.name).toBe("DDD Overview");
        expect(source.hasBeenExtracted).toBe(true);
        expect(source.versions.length).toBeGreaterThan(0);
      }
    });

    it("should return error for non-existent source", async () => {
      const result = await knowledge.getSource({ sourceId: "non-existent-source" });
      expect(result.isFail()).toBe(true);
    });

    it("should get contexts for a source", async () => {
      const result = await knowledge.getSourceContexts({ sourceId: "src-ctx-001" });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-ctx-001");
        expect(result.value.contexts.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should add an existing source to a new context", async () => {
      const catalogResult = await knowledge.createContext({
        id: "ctx-reuse-001",
        name: "Reuse Context",
        description: "Context for testing source reuse",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(catalogResult.isOk()).toBe(true);

      const result = await knowledge.process({
        sourceId: "src-ddd-001",
        contextId: "ctx-reuse-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("src-ddd-001");
        expect(result.value.contextId).toBe("ctx-reuse-001");
        expect(result.value.completedSteps).toContain("cataloging");
      }
    });
  });

  // 8. processKnowledge declarative

  describe("processKnowledge", () => {
    it("should execute full pipeline with new source + context", async () => {
      const ctxResult = await knowledge.createContext({
        id: "ctx-pk-full-001",
        name: "PK Full Test",
        description: "processKnowledge full pipeline test",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      const result = await knowledge.process({
        sourceId: "src-pk-full-001",
        sourceName: "PK Full Source",
        uri: "processKnowledge full test: Domain events capture meaningful state changes in a bounded context.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-pk-full-001",
        projectionId: "proj-pk-full-001",
        processingProfileId: profileId,
        contextId: "ctx-pk-full-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.completedSteps).toContain("ingestion");
        expect(result.value.completedSteps).toContain("processing");
        expect(result.value.completedSteps).toContain("cataloging");
        expect(result.value.extractedText).toBeUndefined();
      }
    });

    it("should ingest only (sourceName + no processingProfileId/contextId)", async () => {
      const result = await knowledge.process({
        sourceId: "src-pk-ingestonly-001",
        sourceName: "PK Ingest Only",
        uri: "processKnowledge ingest only test: Value Objects are immutable and compared by value.",
        sourceType: "PLAIN_TEXT",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.completedSteps).toEqual(["ingestion"]);
        expect(result.value.extractedText).toBeTruthy();
        expect(result.value.projectionId).toBeUndefined();
      }
    });

    it("should fail when source not found (existing source)", async () => {
      const result = await knowledge.process({
        sourceId: "non-existent-source-pk",
        processingProfileId: profileId,
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.code).toBe("KNOWLEDGE_INGESTION_FAILED");
      }
    });

    it("should be idempotent when source already in context (no error)", async () => {
      const result = await knowledge.process({
        sourceId: "src-pk-full-001",
        contextId: "ctx-pk-full-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.completedSteps).toContain("cataloging");
      }
    });
  });

  // 9. Processing Profile Management

  describe("Processing Profile Management", () => {
    it("should create a processing profile", async () => {
      const result = await knowledge.createProfile({
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

    it("should list all profiles", async () => {
      const result = await knowledge.listProfiles();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.profiles.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should update a profile", async () => {
      const result = await knowledge.updateProfile({
        id: "profile-custom-001",
        name: "Updated Custom Profile",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.version).toBe(2);
      }
    });

    it("should deprecate a profile", async () => {
      const result = await knowledge.deprecateProfile({
        id: "profile-custom-001",
        reason: "No longer needed",
      });

      expect(result.isOk()).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // LIFECYCLE TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe("removeSource", () => {
    it("should remove a source from a context with multiple sources", async () => {
      const ctxResult = await knowledge.createContext({
        id: "ctx-lc-rm-001",
        name: "Remove Source Test",
        description: "Context for testing source removal",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      const execResult = await knowledge.process({
        sourceId: "src-lc-rm-001",
        sourceName: "DDD Overview LC",
        uri: "LC remove source test 1: Domain-Driven Design emphasizes collaboration between domain experts and developers to model complex business domains.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-lc-rm-001",
        projectionId: "proj-lc-rm-001",
        contextId: "ctx-lc-rm-001",
        processingProfileId: profileId,
      });
      expect(execResult.isOk()).toBe(true);

      const addResult = await knowledge.process({
        contextId: "ctx-lc-rm-001",
        sourceId: "src-lc-rm-002",
        sourceName: "Clean Architecture LC",
        uri: "LC remove source test 2: Clean Architecture separates concerns through dependency inversion and layer boundaries.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-lc-rm-002",
        projectionId: "proj-lc-rm-002",
        processingProfileId: profileId,
      });
      expect(addResult.isOk()).toBe(true);

      const result = await knowledge.removeSourceFromContext({
        contextId: "ctx-lc-rm-001",
        sourceId: "src-lc-rm-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe("ctx-lc-rm-001");
      }
    });

    it("should fail when removing the last source", async () => {
      const ctxResult = await knowledge.createContext({
        id: "ctx-lc-rm-last-001",
        name: "Last Source Test",
        description: "Context for testing last source removal",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      const execResult = await knowledge.process({
        sourceId: "src-lc-rm-last-001",
        sourceName: "Event Sourcing",
        uri: "LC last source test: Event Sourcing captures all changes to application state as a sequence of events.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-lc-rm-last-001",
        projectionId: "proj-lc-rm-last-001",
        contextId: "ctx-lc-rm-last-001",
        processingProfileId: profileId,
      });
      expect(execResult.isOk()).toBe(true);

      const result = await knowledge.removeSourceFromContext({
        contextId: "ctx-lc-rm-last-001",
        sourceId: "src-lc-rm-last-001",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeError);
        expect(result.error.step).toBe(OperationStep.RemoveSource);
        expect(result.error.code).toBe("KNOWLEDGE_REMOVE_SOURCE_FAILED");
      }
    });
  });

  describe("reconcileProjections", () => {
    it("should reconcile projections for an existing context", async () => {
      const ctxResult = await knowledge.createContext({
        id: "ctx-lc-rp-001",
        name: "Reconcile Test",
        description: "Context for testing projection reconciliation",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      const execResult = await knowledge.process({
        sourceId: "src-lc-rp-001",
        sourceName: "DDD Updated",
        uri: "LC reconcile test: DDD Updated overview with strategic and tactical patterns for modeling complex domains.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-lc-rp-001",
        projectionId: "proj-lc-rp-001",
        contextId: "ctx-lc-rp-001",
        processingProfileId: profileId,
      });
      expect(execResult.isOk()).toBe(true);

      const result = await knowledge.reconcileProjections({
        contextId: "ctx-lc-rp-001",
        profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe("ctx-lc-rp-001");
        expect(result.value.processedCount).toBe(1);
        expect(result.value.failedCount).toBe(0);
      }
    });

    it("should fail when context does not exist", async () => {
      const result = await knowledge.reconcileProjections({
        contextId: "non-existent-context",
        profileId,
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeError);
        expect(result.error.step).toBe(OperationStep.ReconcileProjections);
        expect(result.error.code).toBe("KNOWLEDGE_RECONCILE_PROJECTIONS_FAILED");
      }
    });
  });

  describe("linkContexts", () => {
    it("should link two existing contexts", async () => {
      const result = await knowledge.linkContexts({
        sourceContextId: "ctx-lc-rm-001",
        targetContextId: "ctx-lc-rp-001",
        relationshipType: "related-to",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceContextId).toBe("ctx-lc-rm-001");
        expect(result.value.targetContextId).toBe("ctx-lc-rp-001");
      }
    });

    it("should fail when linking a context to itself", async () => {
      const result = await knowledge.linkContexts({
        sourceContextId: "ctx-lc-rm-001",
        targetContextId: "ctx-lc-rm-001",
        relationshipType: "self-ref",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.step).toBe(OperationStep.Link);
        expect(result.error.code).toBe("KNOWLEDGE_LINK_FAILED");
      }
    });
  });

  describe("unlinkContexts", () => {
    it("should unlink two previously linked contexts", async () => {
      const result = await knowledge.unlinkContexts({
        sourceContextId: "ctx-lc-rm-001",
        targetContextId: "ctx-lc-rp-001",
      });

      expect(result.isOk()).toBe(true);
    });

    it("should fail when link does not exist", async () => {
      const result = await knowledge.unlinkContexts({
        sourceContextId: "ctx-lc-rm-001",
        targetContextId: "ctx-lc-rp-001",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.step).toBe(OperationStep.Unlink);
        expect(result.error.code).toBe("KNOWLEDGE_UNLINK_FAILED");
      }
    });
  });

  describe("transitionContextState", () => {
    it("should archive a context", async () => {
      const ctxResult = await knowledge.createContext({
        id: "ctx-transition-archive-001",
        name: "Transition Archive Test",
        description: "Test transitionContextState archive",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      const result = await knowledge.transitionContextState({
        contextId: "ctx-transition-archive-001",
        targetState: "ARCHIVED",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.state).toBe("ARCHIVED");
      }
    });

    it("should deprecate a context", async () => {
      const ctxResult = await knowledge.createContext({
        id: "ctx-transition-deprecate-001",
        name: "Transition Deprecate Test",
        description: "Test transitionContextState deprecate",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      const result = await knowledge.transitionContextState({
        contextId: "ctx-transition-deprecate-001",
        targetState: "DEPRECATED",
        reason: "No longer needed",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.state).toBe("DEPRECATED");
      }
    });

    it("should activate a deprecated context", async () => {
      const result = await knowledge.transitionContextState({
        contextId: "ctx-transition-deprecate-001",
        targetState: "ACTIVE",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.state).toBe("ACTIVE");
      }
    });

    it("should fail for non-existent context", async () => {
      const result = await knowledge.transitionContextState({
        contextId: "non-existent-transition-ctx",
        targetState: "ARCHIVED",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.step).toBe("transition-state");
        expect(result.error.code).toBe("KNOWLEDGE_TRANSITION_STATE_FAILED");
      }
    });
  });

  describe("updateContextProfile", () => {
    let profileA: string;
    let profileB: string;

    beforeAll(async () => {
      profileA = "profile-enforce-A";
      profileB = "profile-enforce-B";

      const resultA = await knowledge.createProfile({
        id: profileA,
        name: "Enforce Profile A",
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
        projection: { strategyId: "hash-embedding", config: {} },
      });
      expect(resultA.isOk()).toBe(true);

      const resultB = await knowledge.createProfile({
        id: profileB,
        name: "Enforce Profile B",
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "sentence", config: {} },
        projection: { strategyId: "hash-embedding", config: {} },
      });
      expect(resultB.isOk()).toBe(true);
    });

    it("updateContextProfile should trigger automatic reconciliation", async () => {
      const ctxResult = await knowledge.createContext({
        id: "ctx-autoreconcile-001",
        name: "Auto-Reconcile Test",
        description: "Context for auto-reconciliation",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileA,
      });
      expect(ctxResult.isOk()).toBe(true);

      const addResult = await knowledge.process({
        contextId: "ctx-autoreconcile-001",
        sourceId: "src-autoreconcile-001",
        sourceName: "Auto Reconcile Clean Arch",
        uri: "Auto-reconcile test: Clean Architecture organizes code into layers where inner layers contain business rules and outer layers contain infrastructure.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-autoreconcile-001",
        projectionId: "proj-autoreconcile-001",
        processingProfileId: profileA,
      });
      expect(addResult.isOk()).toBe(true);

      const updateResult = await knowledge.updateContextProfile({
        contextId: "ctx-autoreconcile-001",
        profileId: profileB,
      });

      expect(updateResult.isOk()).toBe(true);
      if (updateResult.isOk()) {
        expect(updateResult.value.profileId).toBe(profileB);
        expect(updateResult.value.reconciled).toBeDefined();
        expect(updateResult.value.reconciled!.processedCount).toBe(1);
        expect(updateResult.value.reconciled!.failedCount).toBe(0);
      }
    });
  });

  describe("KnowledgeError", () => {
    it("should copy completedSteps (not reference)", () => {
      const steps: (typeof OperationStep)[keyof typeof OperationStep][] = [];
      const error = KnowledgeError.fromStep(
        OperationStep.Link,
        new Error("fail"),
        steps,
      );
      steps.push(OperationStep.RemoveSource);
      expect(error.completedSteps).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MULTI-PROJECTION VISIBILITY TESTS
  // ═══════════════════════════════════════════════════════════════════

  describe("reconcileAllProfiles", () => {
    let localKnowledge: KnowledgeCoordinator;
    const rapProfileA = "profile-rap-A";
    const rapProfileB = "profile-rap-B";
    const rapContextId = "ctx-rap-001";
    const rapSourceId = "src-rap-001";

    beforeAll(async () => {
      // Use a fresh isolated coordinator with exactly 2 profiles
      localKnowledge = await createKnowledgePlatform({
        provider: "in-memory",
        embeddingDimensions: 128,
        defaultChunkingStrategy: "recursive",
      });

      const rA = await localKnowledge.createProfile({
        id: rapProfileA,
        name: "RAP Profile A",
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
        projection: { strategyId: "hash-embedding", config: {} },
      });
      expect(rA.isOk()).toBe(true);

      const rB = await localKnowledge.createProfile({
        id: rapProfileB,
        name: "RAP Profile B",
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "sentence", config: {} },
        projection: { strategyId: "hash-embedding", config: {} },
      });
      expect(rB.isOk()).toBe(true);

      const ctxResult = await localKnowledge.createContext({
        id: rapContextId,
        name: "Reconcile All Profiles Test",
        description: "Context for reconcileAllProfiles",
        language: "en",
        createdBy: "test",
        requiredProfileId: rapProfileA,
      });
      expect(ctxResult.isOk()).toBe(true);

      const ingestResult = await localKnowledge.process({
        sourceId: rapSourceId,
        sourceName: "RAP Test Source",
        uri: "Reconcile all profiles test: Repository pattern abstracts data access behind a collection-like interface for aggregates.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-rap-001",
        contextId: rapContextId,
      });
      expect(ingestResult.isOk()).toBe(true);
    });

    it("should reconcile all active profiles for a context", async () => {
      const result = await localKnowledge.reconcileAllProfiles({ contextId: rapContextId });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe(rapContextId);
        expect(result.value.profileResults.length).toBe(2);
        for (const pr of result.value.profileResults) {
          expect(pr.processedCount).toBeGreaterThanOrEqual(1);
          expect(pr.failedCount).toBe(0);
        }
        expect(result.value.totalProcessed).toBeGreaterThanOrEqual(2);
        expect(result.value.totalFailed).toBe(0);
      }
    });

    it("should be idempotent — calling again yields failedCount === 0", async () => {
      const result = await localKnowledge.reconcileAllProfiles({ contextId: rapContextId });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.totalFailed).toBe(0);
        expect(result.value.profileResults.length).toBe(2);
        for (const pr of result.value.profileResults) {
          expect(pr.processedCount).toBeGreaterThanOrEqual(1);
          expect(pr.failedCount).toBe(0);
        }
      }
    });
  });

  describe("processSourceAllProfiles", () => {
    let localKnowledge: KnowledgeCoordinator;
    const psapProfileA = "profile-psap-A";
    const psapProfileB = "profile-psap-B";
    const psapSourceId = "src-psap-001";

    beforeAll(async () => {
      localKnowledge = await createKnowledgePlatform({
        provider: "in-memory",
        embeddingDimensions: 128,
        defaultChunkingStrategy: "recursive",
      });

      const rA = await localKnowledge.createProfile({
        id: psapProfileA,
        name: "PSAP Profile A",
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
        projection: { strategyId: "hash-embedding", config: {} },
      });
      expect(rA.isOk()).toBe(true);

      const rB = await localKnowledge.createProfile({
        id: psapProfileB,
        name: "PSAP Profile B",
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "sentence", config: {} },
        projection: { strategyId: "hash-embedding", config: {} },
      });
      expect(rB.isOk()).toBe(true);

      // Ingest source without projection
      const ingest = await localKnowledge.process({
        sourceId: psapSourceId,
        sourceName: "PSAP Test Source",
        uri: "processSourceAllProfiles test: Hexagonal architecture isolates the domain from external concerns via ports and adapters.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-psap-001",
      });
      expect(ingest.isOk()).toBe(true);
    });

    it("should generate projections for all active profiles for a single source", async () => {
      const result = await localKnowledge.processSourceAllProfiles({ sourceId: psapSourceId });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe(psapSourceId);
        expect(result.value.profileResults.length).toBe(2);
        expect(result.value.totalProcessed).toBe(2);
        expect(result.value.totalFailed).toBe(0);
        for (const pr of result.value.profileResults) {
          expect(pr.processedCount).toBe(1);
          expect(pr.failedCount).toBe(0);
        }
      }
    });

    it("should be idempotent — calling again yields same counts, no failures", async () => {
      const result = await localKnowledge.processSourceAllProfiles({ sourceId: psapSourceId });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.totalProcessed).toBe(2);
        expect(result.value.totalFailed).toBe(0);
      }
    });

    it("should fail for non-existent source", async () => {
      const result = await localKnowledge.processSourceAllProfiles({ sourceId: "non-existent-psap" });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.step).toBe("process-source-all-profiles");
      }
    });
  });

  describe("Multi-Profile Projections", () => {
    let profileX: string;
    let profileY: string;

    beforeAll(async () => {
      profileX = "profile-multi-X";
      profileY = "profile-multi-Y";

      const resultX = await knowledge.createProfile({
        id: profileX,
        name: "Multi Profile X",
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "recursive", config: { strategy: "recursive" } },
        projection: { strategyId: "hash-embedding", config: {} },
      });
      expect(resultX.isOk()).toBe(true);

      const resultY = await knowledge.createProfile({
        id: profileY,
        name: "Multi Profile Y",
        preparation: { strategyId: "basic", config: {} },
        fragmentation: { strategyId: "sentence", config: {} },
        projection: { strategyId: "hash-embedding", config: {} },
      });
      expect(resultY.isOk()).toBe(true);
    });

    it("should return multiple projections per source in context details", async () => {
      // Create context with profileX as required
      const ctxResult = await knowledge.createContext({
        id: "ctx-multi-proj-001",
        name: "Multi Projection Test",
        description: "Testing multi-profile projection visibility",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileX,
      });
      expect(ctxResult.isOk()).toBe(true);

      // Process source with profileX
      const proc1 = await knowledge.process({
        sourceId: "src-multi-proj-001",
        sourceName: "Multi Projection Source",
        uri: "Multi-projection test: Aggregate roots enforce invariants across a cluster of entities and value objects within a consistency boundary.",
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-multi-proj-001",
        projectionId: "proj-multi-X-001",
        processingProfileId: profileX,
        contextId: "ctx-multi-proj-001",
      });
      expect(proc1.isOk()).toBe(true);

      // Process same source with profileY (no re-ingestion needed)
      const proc2 = await knowledge.process({
        sourceId: "src-multi-proj-001",
        projectionId: "proj-multi-Y-001",
        processingProfileId: profileY,
      });
      expect(proc2.isOk()).toBe(true);

      // Get context details → source should have 2 projections
      const detailResult = await knowledge.getContext({ contextId: "ctx-multi-proj-001" });
      expect(detailResult.isOk()).toBe(true);
      if (detailResult.isOk()) {
        const source = detailResult.value.sources[0];
        expect(source.projections.length).toBe(2);

        const profileIds = source.projections.map((p) => p.processingProfileId).sort();
        expect(profileIds).toEqual([profileX, profileY].sort());

        // Each projection has stats
        for (const proj of source.projections) {
          expect(proj.projectionId).toBeTruthy();
          expect(proj.chunksCount).toBeGreaterThan(0);
          expect(proj.dimensions).toBe(128);
          expect(proj.model).toBeTruthy();
        }

        // Backward compat fields match requiredProfile (profileX)
        expect(source.projectionId).toBeTruthy();
        const requiredProj = source.projections.find((p) => p.processingProfileId === profileX);
        expect(source.projectionId).toBe(requiredProj!.projectionId);
      }
    });

    it("should filter search results by processingProfileId", async () => {
      // Search with profileX filter
      const resultX = await knowledge.search({
        queryText: "aggregate roots invariants",
        topK: 10,
        minScore: 0,
        filters: { processingProfileId: profileX },
      });
      expect(resultX.isOk()).toBe(true);

      // Search with profileY filter
      const resultY = await knowledge.search({
        queryText: "aggregate roots invariants",
        topK: 10,
        minScore: 0,
        filters: { processingProfileId: profileY },
      });
      expect(resultY.isOk()).toBe(true);

      // Both should return results, and results should have the correct profileId in metadata
      if (resultX.isOk() && resultX.value.items.length > 0) {
        for (const item of resultX.value.items) {
          expect(item.metadata.processingProfileId).toBe(profileX);
        }
      }
      if (resultY.isOk() && resultY.value.items.length > 0) {
        for (const item of resultY.value.items) {
          expect(item.metadata.processingProfileId).toBe(profileY);
        }
      }
    });

    it("should reflect total projection count in list summary", async () => {
      const listResult = await knowledge.listContexts();
      expect(listResult.isOk()).toBe(true);
      if (listResult.isOk()) {
        const ctx = listResult.value.contexts.find((c) => c.id === "ctx-multi-proj-001");
        expect(ctx).toBeDefined();
        // projectionCount should be total (2), not just requiredProfile (1)
        expect(ctx!.projectionCount).toBe(2);
        // status should still be complete (requiredProfile is covered)
        expect(ctx!.status).toBe("complete");
      }
    });
  });
});

