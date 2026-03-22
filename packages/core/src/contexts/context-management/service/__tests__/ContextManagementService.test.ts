import { describe, it, expect, beforeEach } from "vitest";
import { ContextManagementService } from "../ContextManagementService";
import { InMemoryContextRepository } from "../../context/infrastructure/InMemoryContextRepository";
import { ContextId } from "../../context/domain/ContextId";
import { ContextState } from "../../context/domain/ContextState";
import { ContextCreated } from "../../context/domain/events/ContextCreated";
import { ContextSourceAdded } from "../../context/domain/events/ContextSourceAdded";
import { ContextSourceRemoved } from "../../context/domain/events/ContextSourceRemoved";

import { ContextDeprecated } from "../../context/domain/events/ContextDeprecated";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { DomainEvent } from "../../../../shared/domain";

function createMockEventPublisher(): EventPublisher & {
  publishedEvents: DomainEvent[];
} {
  const publishedEvents: DomainEvent[] = [];
  return {
    publishedEvents,
    async publish(event: DomainEvent) {
      publishedEvents.push(event);
    },
    async publishAll(events: DomainEvent[]) {
      publishedEvents.push(...events);
    },
  };
}

describe("ContextManagementService", () => {
  let repository: InMemoryContextRepository;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let service: ContextManagementService;

  beforeEach(() => {
    repository = new InMemoryContextRepository();
    eventPublisher = createMockEventPublisher();
    service = new ContextManagementService({
      contextRepository: repository,
      contextEventPublisher: eventPublisher,
    });
  });

  // ── createContext ───────────────────────────────────────────────

  describe("createContext", () => {
    it("creates and persists a context, publishes events", async () => {
      const result = await service.createContext({
        id: "ctx-1",
        name: "My Context",
        description: "A test context",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "test-user",
        tags: ["tag1"],
        attributes: { key: "value" },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("My Context");
        expect(result.value.description).toBe("A test context");
        expect(result.value.language).toBe("en");
        expect(result.value.requiredProfileId).toBe("profile-1");
        expect(result.value.state).toBe(ContextState.Draft);
        expect(result.value.metadata.createdBy).toBe("test-user");
        expect(result.value.metadata.tags).toEqual(["tag1"]);
        expect(result.value.metadata.attributes).toEqual({ key: "value" });
      }

      // Verify persisted
      const persisted = await repository.findById(ContextId.create("ctx-1"));
      expect(persisted).not.toBeNull();
      expect(persisted!.name).toBe("My Context");

      // Verify events published
      expect(eventPublisher.publishedEvents.length).toBeGreaterThanOrEqual(1);
      expect(eventPublisher.publishedEvents[0].eventType).toBe(
        ContextCreated.EVENT_TYPE,
      );
    });
  });

  // ── addSourceToContext ──────────────────────────────────────────

  describe("addSourceToContext", () => {
    it("adds source to context", async () => {
      await service.createContext({
        id: "ctx-1",
        name: "My Context",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });

      eventPublisher.publishedEvents.length = 0;

      const result = await service.addSourceToContext({
        contextId: "ctx-1",
        sourceId: "src-1",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.allSources).toHaveLength(1);
        expect(result.value.allSources[0].sourceId).toBe("src-1");
        expect(result.value.currentVersion).not.toBeNull();
        expect(result.value.currentVersion!.version).toBe(1);
      }

      // Verify events published (ContextSourceAdded + ContextVersioned)
      expect(eventPublisher.publishedEvents.length).toBeGreaterThanOrEqual(1);
      const eventTypes = eventPublisher.publishedEvents.map((e) => e.eventType);
      expect(eventTypes).toContain(ContextSourceAdded.EVENT_TYPE);
    });

    it("derives sourceKnowledgeId from sourceId when not provided", async () => {
      await service.createContext({
        id: "ctx-1",
        name: "My Context",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });

      const result = await service.addSourceToContext({
        contextId: "ctx-1",
        sourceId: "src-1",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.allSources[0].sourceKnowledgeId).toBe("sk-src-1");
      }
    });

    it("stores projectionId when provided", async () => {
      await service.createContext({
        id: "ctx-1",
        name: "My Context",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });

      const result = await service.addSourceToContext({
        contextId: "ctx-1",
        sourceId: "src-1",
        projectionId: "proj-1",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.allSources[0].projectionId).toBe("proj-1");
      }
    });

    it("returns NotFoundError for non-existent context", async () => {
      const result = await service.addSourceToContext({
        contextId: "non-existent",
        sourceId: "src-1",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.message).toContain("not found");
      }
    });
  });

  // ── listContexts ─────────────────────────────────────────────────

  describe("listContexts", () => {
    it("returns all contexts", async () => {
      await service.createContext({
        id: "ctx-1",
        name: "First",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });
      await service.createContext({
        id: "ctx-2",
        name: "Second",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });

      const result = await service.listContexts();

      expect(result).toHaveLength(2);
      const ids = result.map((c) => c.id.value).sort();
      expect(ids).toEqual(["ctx-1", "ctx-2"]);
    });

    it("returns empty array when no contexts exist", async () => {
      const result = await service.listContexts();

      expect(result).toEqual([]);
    });
  });

  // ── getContextsForSource ────────────────────────────────────────

  describe("getContextsForSource", () => {
    it("returns contexts containing the source", async () => {
      await service.createContext({
        id: "ctx-1",
        name: "First",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });
      await service.createContext({
        id: "ctx-2",
        name: "Second",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });

      await service.addSourceToContext({ contextId: "ctx-1", sourceId: "src-A" });
      await service.addSourceToContext({ contextId: "ctx-2", sourceId: "src-A" });

      const result = await service.getContextsForSource("src-A");

      expect(result).toHaveLength(2);
      const ids = result.map((c) => c.id.value).sort();
      expect(ids).toEqual(["ctx-1", "ctx-2"]);
    });

    it("returns empty array for unknown source", async () => {
      const result = await service.getContextsForSource("non-existent");

      expect(result).toEqual([]);
    });
  });

  // ── removeSourceFromContext ─────────────────────────────────────

  describe("removeSourceFromContext", () => {
    it("removes source and publishes events", async () => {
      await service.createContext({
        id: "ctx-1",
        name: "My Context",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });

      await service.addSourceToContext({
        contextId: "ctx-1",
        sourceId: "src-1",
      });
      await service.addSourceToContext({
        contextId: "ctx-1",
        sourceId: "src-2",
      });

      eventPublisher.publishedEvents.length = 0;

      const result = await service.removeSourceFromContext({
        contextId: "ctx-1",
        sourceId: "src-1",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.activeSources).toHaveLength(1);
        expect(result.value.activeSources[0].sourceId).toBe("src-2");
      }

      // Verify events
      const eventTypes = eventPublisher.publishedEvents.map((e) => e.eventType);
      expect(eventTypes).toContain(ContextSourceRemoved.EVENT_TYPE);
    });
  });

  // ── deprecateContext ────────────────────────────────────────────

  describe("deprecateContext", () => {
    it("deprecates an active context", async () => {
      await service.createContext({
        id: "ctx-1",
        name: "My Context",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });
      await service.activateContext({ contextId: "ctx-1" });

      eventPublisher.publishedEvents.length = 0;

      const result = await service.deprecateContext({
        contextId: "ctx-1",
        reason: "outdated content",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.state).toBe(ContextState.Deprecated);
      }

      // Verify events
      const eventTypes = eventPublisher.publishedEvents.map((e) => e.eventType);
      expect(eventTypes).toContain(ContextDeprecated.EVENT_TYPE);
    });
  });

  // ── activateContext ─────────────────────────────────────────────

  describe("activateContext", () => {
    it("activates a draft context", async () => {
      await service.createContext({
        id: "ctx-1",
        name: "My Context",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });

      eventPublisher.publishedEvents.length = 0;

      const result = await service.activateContext({ contextId: "ctx-1" });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.state).toBe(ContextState.Active);
      }
    });
  });

  // ── archiveContext ──────────────────────────────────────────────

  describe("archiveContext", () => {
    it("archives an active context", async () => {
      await service.createContext({
        id: "ctx-1",
        name: "My Context",
        description: "Test",
        language: "en",
        requiredProfileId: "profile-1",
        createdBy: "user",
      });
      await service.activateContext({ contextId: "ctx-1" });

      eventPublisher.publishedEvents.length = 0;

      const result = await service.archiveContext({ contextId: "ctx-1" });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.state).toBe(ContextState.Archived);
      }

      // Verify persisted
      const persisted = await repository.findById(ContextId.create("ctx-1"));
      expect(persisted!.state).toBe(ContextState.Archived);
    });
  });
});
