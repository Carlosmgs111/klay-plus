import { describe, it, expect, beforeEach, vi } from "vitest";
import { SourceKnowledgeService } from "../SourceKnowledgeService";
import { InMemorySourceKnowledgeRepository } from "../../source/infrastructure/InMemorySourceKnowledgeRepository";
import { SourceKnowledge } from "../../source/domain/SourceKnowledge";
import { SourceKnowledgeId } from "../../source/domain/SourceKnowledgeId";
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

describe("SourceKnowledgeService", () => {
  let repository: InMemorySourceKnowledgeRepository;
  let eventPublisher: ReturnType<typeof createMockEventPublisher>;
  let service: SourceKnowledgeService;

  beforeEach(() => {
    repository = new InMemorySourceKnowledgeRepository();
    eventPublisher = createMockEventPublisher();
    service = new SourceKnowledgeService({
      sourceKnowledgeRepository: repository,
      sourceKnowledgeEventPublisher: eventPublisher,
    });
  });

  // ── createSourceKnowledge ────────────────────────────────────────

  describe("createSourceKnowledge", () => {
    it("creates and persists SourceKnowledge, publishes events", async () => {
      const result = await service.createSourceKnowledge({
        id: "sk-1",
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sourceId).toBe("source-1");
        expect(result.value.contentHash).toBe("hash-abc");
        expect(result.value.defaultProfileId).toBe("profile-default");
      }

      // Verify persisted
      const persisted = await repository.findBySourceId("source-1");
      expect(persisted).not.toBeNull();
      expect(persisted!.id.value).toBe("sk-1");

      // Verify events published
      expect(eventPublisher.publishedEvents.length).toBeGreaterThanOrEqual(1);
      expect(eventPublisher.publishedEvents[0].eventType).toBe(
        "source-knowledge.source-knowledge.created",
      );
    });

    it("returns error on duplicate sourceId", async () => {
      await service.createSourceKnowledge({
        id: "sk-1",
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });

      const result = await service.createSourceKnowledge({
        id: "sk-2",
        sourceId: "source-1",
        contentHash: "hash-xyz",
        defaultProfileId: "profile-default",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.message).toContain("already exists");
      }
    });
  });

  // ── registerProjection ───────────────────────────────────────────

  describe("registerProjection", () => {
    it("finds, updates, saves, and publishes events", async () => {
      await service.createSourceKnowledge({
        id: "sk-1",
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });

      // Clear events from creation
      eventPublisher.publishedEvents.length = 0;

      const result = await service.registerProjection({
        sourceId: "source-1",
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "COMPLETED",
      });

      expect(result.isOk()).toBe(true);

      // Verify hub updated in persistence
      const persisted = await repository.findBySourceId("source-1");
      expect(persisted!.hub.projections).toHaveLength(1);
      expect(persisted!.hub.projections[0].projectionId).toBe("proj-1");
      expect(persisted!.hub.projections[0].status).toBe("COMPLETED");

      // Verify events published
      expect(eventPublisher.publishedEvents.length).toBeGreaterThanOrEqual(1);
      expect(eventPublisher.publishedEvents[0].eventType).toBe(
        "source-knowledge.projection.registered",
      );
    });

    it("returns NotFoundError for non-existent sourceId", async () => {
      const result = await service.registerProjection({
        sourceId: "non-existent",
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "COMPLETED",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.message).toContain("not found");
      }
    });
  });

  // ── satisfiesProfile ─────────────────────────────────────────────

  describe("satisfiesProfile", () => {
    it("returns { satisfied: true } when projection is COMPLETED", async () => {
      await service.createSourceKnowledge({
        id: "sk-1",
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });

      await service.registerProjection({
        sourceId: "source-1",
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "COMPLETED",
      });

      const result = await service.satisfiesProfile({
        sourceId: "source-1",
        profileId: "profile-default",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.satisfied).toBe(true);
      }
    });

    it("returns { satisfied: false } when projection is not COMPLETED", async () => {
      await service.createSourceKnowledge({
        id: "sk-1",
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });

      await service.registerProjection({
        sourceId: "source-1",
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "PENDING",
      });

      const result = await service.satisfiesProfile({
        sourceId: "source-1",
        profileId: "profile-default",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.satisfied).toBe(false);
      }
    });

    it("returns NotFoundError when sourceId not found", async () => {
      const result = await service.satisfiesProfile({
        sourceId: "non-existent",
        profileId: "profile-default",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.message).toContain("not found");
      }
    });
  });

  // ── getBySourceId ────────────────────────────────────────────────

  describe("getBySourceId", () => {
    it("returns entity when found", async () => {
      await service.createSourceKnowledge({
        id: "sk-1",
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });

      const result = await service.getBySourceId({ sourceId: "source-1" });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id.value).toBe("sk-1");
        expect(result.value.sourceId).toBe("source-1");
      }
    });

    it("returns NotFoundError when not found", async () => {
      const result = await service.getBySourceId({ sourceId: "non-existent" });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.message).toContain("not found");
      }
    });
  });

  // ── ensureProfileSatisfied ───────────────────────────────────────

  describe("ensureProfileSatisfied", () => {
    it("returns { satisfied: true } when profile has COMPLETED projection", async () => {
      await service.createSourceKnowledge({
        id: "sk-1",
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });

      await service.registerProjection({
        sourceId: "source-1",
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "COMPLETED",
      });

      const result = await service.ensureProfileSatisfied({
        sourceId: "source-1",
        profileId: "profile-default",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.satisfied).toBe(true);
      }
    });

    it("returns { satisfied: false, sourceKnowledgeId } when profile not satisfied", async () => {
      await service.createSourceKnowledge({
        id: "sk-1",
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });

      const result = await service.ensureProfileSatisfied({
        sourceId: "source-1",
        profileId: "profile-default",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.satisfied).toBe(false);
        expect(result.value.sourceKnowledgeId).toBe("sk-1");
      }
    });

    it("returns { satisfied: false, sourceKnowledgeId } when projection is PENDING", async () => {
      await service.createSourceKnowledge({
        id: "sk-1",
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });

      await service.registerProjection({
        sourceId: "source-1",
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "PENDING",
      });

      const result = await service.ensureProfileSatisfied({
        sourceId: "source-1",
        profileId: "profile-default",
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.satisfied).toBe(false);
        expect(result.value.sourceKnowledgeId).toBe("sk-1");
      }
    });

    it("returns NotFoundError when sourceId not found", async () => {
      const result = await service.ensureProfileSatisfied({
        sourceId: "non-existent",
        profileId: "profile-default",
      });

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.error.message).toContain("not found");
      }
    });
  });
});
