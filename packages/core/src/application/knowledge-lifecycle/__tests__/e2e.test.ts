/**
 * Knowledge Lifecycle Orchestrator -- E2E Tests
 *
 * Tests lifecycle operations on existing contexts using in-memory infrastructure.
 * Validates removeSource, reprocessContext, rollbackContext, linkContexts, and unlinkContexts.
 *
 * Updated for the new domain model:
 * - Context (context-management) replaces SemanticUnit grouping
 * - SourceKnowledge (source-knowledge) manages per-source projection hubs
 * - ContextManagementService replaces SemanticKnowledgeService
 * - linkContexts/unlinkContexts use lineage sub-domain within context-management
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as path from "path";
import { fileURLToPath } from "url";

import { createKnowledgePlatform } from "../../composition/knowledge-platform.factory";
import type { KnowledgePipelinePort } from "../../knowledge-pipeline/contracts/KnowledgePipelinePort";
import type { KnowledgeManagementPort } from "../../knowledge-management/contracts/KnowledgeManagementPort";
import type { KnowledgeLifecyclePort } from "../contracts/KnowledgeLifecyclePort";
import { KnowledgeLifecycleError } from "../domain/KnowledgeLifecycleError";
import { LifecycleStep } from "../domain/LifecycleStep";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, "../../../tests/integration/fixtures");

describe("Knowledge Lifecycle Orchestrator -- E2E", () => {
  let pipeline: KnowledgePipelinePort;
  let management: KnowledgeManagementPort;
  let lifecycle: KnowledgeLifecyclePort;
  let profileId: string;

  beforeAll(async () => {
    const platform = await createKnowledgePlatform({
      provider: "in-memory",
      embeddingDimensions: 128,
      defaultChunkingStrategy: "recursive",
    });

    pipeline = platform.pipeline;
    management = platform.management;
    lifecycle = platform.lifecycle;

    profileId = "profile-lifecycle-001";
    const profileResult = await pipeline.createProcessingProfile({
      id: profileId,
      name: "Lifecycle Test Profile",
      chunkingStrategyId: "recursive",
      embeddingStrategyId: "hash-embedding",
      configuration: { embeddingDimensions: 128 },
    });
    expect(profileResult.isOk()).toBe(true);
  });

  describe("removeSource", () => {
    it("should remove a source from a context with multiple sources", async () => {
      // Create a context
      const ctxResult = await pipeline.catalogDocument({
        contextId: "ctx-lc-rm-001",
        name: "Remove Source Test",
        description: "Context for testing source removal",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      // Add first source via pipeline (creates source-knowledge + adds to context)
      const dddFile = path.join(FIXTURES_DIR, "ddd-overview.txt");
      const execResult = await pipeline.execute({
        sourceId: "src-lc-rm-001",
        sourceName: "DDD Overview",
        uri: dddFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-lc-rm-001",
        projectionId: "proj-lc-rm-001",
        contextId: "ctx-lc-rm-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });
      expect(execResult.isOk()).toBe(true);

      // Add a second source via management
      const cleanFile = path.join(FIXTURES_DIR, "clean-architecture.txt");
      const addResult = await management.ingestAndAddSource({
        contextId: "ctx-lc-rm-001",
        sourceId: "src-lc-rm-002",
        sourceName: "Clean Architecture",
        uri: cleanFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-lc-rm-002",
        projectionId: "proj-lc-rm-002",
        processingProfileId: profileId,
      });
      expect(addResult.isOk()).toBe(true);

      // Now remove the first source (context has 2 sources, so this should work)
      const result = await lifecycle.removeSource({
        contextId: "ctx-lc-rm-001",
        sourceId: "src-lc-rm-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe("ctx-lc-rm-001");
        expect(typeof result.value.version).toBe("number");
      }
    });

    it("should fail when removing the last source", async () => {
      // Create a context with only one source
      const ctxResult = await pipeline.catalogDocument({
        contextId: "ctx-lc-rm-last-001",
        name: "Last Source Test",
        description: "Context for testing last source removal",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      const esFile = path.join(FIXTURES_DIR, "event-sourcing.txt");
      const execResult = await pipeline.execute({
        sourceId: "src-lc-rm-last-001",
        sourceName: "Event Sourcing",
        uri: esFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-lc-rm-last-001",
        projectionId: "proj-lc-rm-last-001",
        contextId: "ctx-lc-rm-last-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });
      expect(execResult.isOk()).toBe(true);

      const result = await lifecycle.removeSource({
        contextId: "ctx-lc-rm-last-001",
        sourceId: "src-lc-rm-last-001",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeLifecycleError);
        expect(result.error.step).toBe(LifecycleStep.RemoveSource);
        expect(result.error.code).toBe("LIFECYCLE_REMOVE_SOURCE_FAILED");
      }
    });

    it("should fail when context does not exist", async () => {
      const result = await lifecycle.removeSource({
        contextId: "non-existent-context",
        sourceId: "some-source",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeLifecycleError);
        expect(result.error.step).toBe(LifecycleStep.RemoveSource);
        expect(result.error.code).toBe("LIFECYCLE_REMOVE_SOURCE_FAILED");
      }
    });
  });

  describe("reprocessContext", () => {
    it("should reprocess an existing context", async () => {
      // Create a context with a source
      const ctxResult = await pipeline.catalogDocument({
        contextId: "ctx-lc-rp-001",
        name: "Reprocess Test",
        description: "Context for testing reprocessing",
        language: "en",
        createdBy: "test",
        requiredProfileId: profileId,
      });
      expect(ctxResult.isOk()).toBe(true);

      const dddUpdFile = path.join(FIXTURES_DIR, "ddd-overview-updated.txt");
      const execResult = await pipeline.execute({
        sourceId: "src-lc-rp-001",
        sourceName: "DDD Updated",
        uri: dddUpdFile,
        sourceType: "PLAIN_TEXT",
        extractionJobId: "job-lc-rp-001",
        projectionId: "proj-lc-rp-001",
        contextId: "ctx-lc-rp-001",
        language: "en",
        createdBy: "test",
        processingProfileId: profileId,
      });
      expect(execResult.isOk()).toBe(true);

      const result = await lifecycle.reprocessContext({
        contextId: "ctx-lc-rp-001",
        profileId,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe("ctx-lc-rp-001");
        expect(typeof result.value.version).toBe("number");
      }
    });

    it("should fail when context does not exist", async () => {
      const result = await lifecycle.reprocessContext({
        contextId: "non-existent-context",
        profileId,
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeLifecycleError);
        expect(result.error.step).toBe(LifecycleStep.Reprocess);
        expect(result.error.code).toBe("LIFECYCLE_REPROCESS_FAILED");
      }
    });
  });

  describe("rollbackContext", () => {
    it("should rollback a context to a previous version", async () => {
      // ctx-lc-rp-001 has version 1 from the source addition
      const result = await lifecycle.rollbackContext({
        contextId: "ctx-lc-rp-001",
        targetVersion: 1,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.contextId).toBe("ctx-lc-rp-001");
        expect(result.value.currentVersion).toBe(1);
      }
    });

    it("should fail when context does not exist", async () => {
      const result = await lifecycle.rollbackContext({
        contextId: "non-existent-context",
        targetVersion: 1,
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeLifecycleError);
        expect(result.error.step).toBe(LifecycleStep.Rollback);
        expect(result.error.code).toBe("LIFECYCLE_ROLLBACK_FAILED");
      }
    });
  });

  describe("linkContexts", () => {
    it("should link two existing contexts", async () => {
      const result = await lifecycle.linkContexts({
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
      const result = await lifecycle.linkContexts({
        sourceContextId: "ctx-lc-rm-001",
        targetContextId: "ctx-lc-rm-001",
        relationshipType: "self-ref",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeLifecycleError);
        expect(result.error.step).toBe(LifecycleStep.Link);
        expect(result.error.code).toBe("LIFECYCLE_LINK_FAILED");
      }
    });
  });

  describe("unlinkContexts", () => {
    it("should unlink two previously linked contexts", async () => {
      const result = await lifecycle.unlinkContexts({
        sourceContextId: "ctx-lc-rm-001",
        targetContextId: "ctx-lc-rp-001",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceContextId).toBe("ctx-lc-rm-001");
        expect(result.value.targetContextId).toBe("ctx-lc-rp-001");
      }
    });

    it("should fail when link does not exist", async () => {
      const result = await lifecycle.unlinkContexts({
        sourceContextId: "ctx-lc-rm-001",
        targetContextId: "ctx-lc-rp-001",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error).toBeInstanceOf(KnowledgeLifecycleError);
        expect(result.error.step).toBe(LifecycleStep.Unlink);
        expect(result.error.code).toBe("LIFECYCLE_UNLINK_FAILED");
      }
    });
  });

  describe("KnowledgeLifecycleError", () => {
    it("should extract info, handle unknown errors, and serialize to JSON", () => {
      const fromKnown = KnowledgeLifecycleError.fromStep(
        LifecycleStep.RemoveSource,
        { message: "Context not found", code: "CONTEXT_NOT_FOUND" },
        [],
      );
      expect(fromKnown.step).toBe("remove-source");
      expect(fromKnown.code).toBe("LIFECYCLE_REMOVE_SOURCE_FAILED");
      expect(fromKnown.completedSteps).toEqual([]);
      expect(fromKnown.originalCode).toBe("CONTEXT_NOT_FOUND");
      expect(fromKnown.originalMessage).toBe("Context not found");

      const fromUnknown = KnowledgeLifecycleError.fromStep(
        LifecycleStep.Reprocess,
        42,
        [],
      );
      expect(fromUnknown.step).toBe("reprocess");
      expect(fromUnknown.code).toBe("LIFECYCLE_REPROCESS_FAILED");
      expect(fromUnknown.originalCode).toBeUndefined();
      expect(fromUnknown.originalMessage).toBeUndefined();

      const error = KnowledgeLifecycleError.fromStep(
        LifecycleStep.Rollback,
        new Error("Something went wrong"),
        [],
      );
      const json = error.toJSON();
      expect(json.name).toBe("KnowledgeLifecycleError");
      expect(json.step).toBe("rollback");
      expect(json.code).toBe("LIFECYCLE_ROLLBACK_FAILED");
      expect(json.completedSteps).toEqual([]);
      expect(json.originalMessage).toBe("Something went wrong");
    });

    it("should copy completedSteps (not reference)", () => {
      const steps: LifecycleStep[] = [];
      const error = KnowledgeLifecycleError.fromStep(
        LifecycleStep.Link,
        new Error("fail"),
        steps,
      );
      steps.push(LifecycleStep.RemoveSource);
      expect(error.completedSteps).toEqual([]);
    });
  });
});
