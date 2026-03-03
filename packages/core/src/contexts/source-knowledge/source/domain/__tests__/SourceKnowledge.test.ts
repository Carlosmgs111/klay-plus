import { describe, it, expect } from "vitest";
import { SourceKnowledge } from "../SourceKnowledge";
import { SourceKnowledgeId } from "../SourceKnowledgeId";
import type { ProjectionEntry } from "../ProjectionHub";

describe("SourceKnowledge", () => {
  const defaultParams = {
    id: SourceKnowledgeId.create("sk-1"),
    sourceId: "source-1",
    contentHash: "hash-abc",
    defaultProfileId: "profile-default",
  };

  describe("create()", () => {
    it("creates with empty hub and emits SourceKnowledgeCreated", () => {
      const sk = SourceKnowledge.create(defaultParams);

      expect(sk.id.value).toBe("sk-1");
      expect(sk.sourceId).toBe("source-1");
      expect(sk.contentHash).toBe("hash-abc");
      expect(sk.defaultProfileId).toBe("profile-default");
      expect(sk.hub.projections).toEqual([]);
      expect(sk.createdAt).toBeInstanceOf(Date);

      const events = sk.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("source-knowledge.source-knowledge.created");
      expect(events[0].aggregateId).toBe("sk-1");
      expect(events[0].payload).toMatchObject({
        sourceId: "source-1",
        contentHash: "hash-abc",
        defaultProfileId: "profile-default",
      });
    });
  });

  describe("getters", () => {
    it("return correct values", () => {
      const sk = SourceKnowledge.create(defaultParams);

      expect(sk.sourceId).toBe("source-1");
      expect(sk.contentHash).toBe("hash-abc");
      expect(sk.defaultProfileId).toBe("profile-default");
      expect(sk.hub).toBeDefined();
      expect(sk.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("registerProjection()", () => {
    it("updates hub and emits ProjectionRegistered", () => {
      const sk = SourceKnowledge.create(defaultParams);
      sk.clearEvents();

      sk.registerProjection({
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "COMPLETED",
      });

      expect(sk.hub.projections).toHaveLength(1);
      expect(sk.hub.projections[0].projectionId).toBe("proj-1");
      expect(sk.hub.projections[0].profileId).toBe("profile-default");
      expect(sk.hub.projections[0].status).toBe("COMPLETED");

      const events = sk.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("source-knowledge.projection.registered");
      expect(events[0].aggregateId).toBe("sk-1");
      expect(events[0].payload).toMatchObject({
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "COMPLETED",
      });
    });

    it("replaces projection for same profileId", () => {
      const sk = SourceKnowledge.create(defaultParams);

      sk.registerProjection({
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "PENDING",
      });

      sk.registerProjection({
        projectionId: "proj-2",
        profileId: "profile-default",
        status: "COMPLETED",
      });

      expect(sk.hub.projections).toHaveLength(1);
      expect(sk.hub.projections[0].projectionId).toBe("proj-2");
      expect(sk.hub.projections[0].status).toBe("COMPLETED");
    });
  });

  describe("satisfiesProfile()", () => {
    it("returns false when no projection exists for profile", () => {
      const sk = SourceKnowledge.create(defaultParams);

      expect(sk.satisfiesProfile("profile-default")).toBe(false);
    });

    it("returns false when projection is PENDING", () => {
      const sk = SourceKnowledge.create(defaultParams);
      sk.registerProjection({
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "PENDING",
      });

      expect(sk.satisfiesProfile("profile-default")).toBe(false);
    });

    it("returns false when projection is PROCESSING", () => {
      const sk = SourceKnowledge.create(defaultParams);
      sk.registerProjection({
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "PROCESSING",
      });

      expect(sk.satisfiesProfile("profile-default")).toBe(false);
    });

    it("returns false when projection is FAILED", () => {
      const sk = SourceKnowledge.create(defaultParams);
      sk.registerProjection({
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "FAILED",
      });

      expect(sk.satisfiesProfile("profile-default")).toBe(false);
    });

    it("returns true when projection is COMPLETED", () => {
      const sk = SourceKnowledge.create(defaultParams);
      sk.registerProjection({
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "COMPLETED",
      });

      expect(sk.satisfiesProfile("profile-default")).toBe(true);
    });
  });

  describe("reconstitute()", () => {
    it("hydrates correctly with no events", () => {
      const createdAt = new Date("2025-06-01");
      const hubEntries: ProjectionEntry[] = [
        {
          projectionId: "proj-1",
          profileId: "profile-default",
          status: "COMPLETED",
          generatedAt: new Date("2025-06-01"),
        },
        {
          projectionId: "proj-2",
          profileId: "profile-alt",
          status: "PENDING",
          generatedAt: new Date("2025-06-02"),
        },
      ];

      const sk = SourceKnowledge.reconstitute({
        id: SourceKnowledgeId.create("sk-r"),
        sourceId: "source-r",
        contentHash: "hash-r",
        defaultProfileId: "profile-r",
        hub: hubEntries,
        createdAt,
      });

      expect(sk.id.value).toBe("sk-r");
      expect(sk.sourceId).toBe("source-r");
      expect(sk.contentHash).toBe("hash-r");
      expect(sk.defaultProfileId).toBe("profile-r");
      expect(sk.hub.projections).toHaveLength(2);
      expect(sk.createdAt).toBe(createdAt);
      expect(sk.domainEvents).toHaveLength(0);
    });

    it("hydrates with empty hub", () => {
      const sk = SourceKnowledge.reconstitute({
        id: SourceKnowledgeId.create("sk-empty"),
        sourceId: "source-e",
        contentHash: "hash-e",
        defaultProfileId: "profile-e",
        hub: [],
        createdAt: new Date(),
      });

      expect(sk.hub.projections).toEqual([]);
      expect(sk.domainEvents).toHaveLength(0);
    });
  });
});

describe("SourceKnowledgeId", () => {
  it("creates with valid value", () => {
    const id = SourceKnowledgeId.create("sk-1");
    expect(id.value).toBe("sk-1");
  });

  it("throws on empty value", () => {
    expect(() => SourceKnowledgeId.create("")).toThrow("SourceKnowledgeId cannot be empty");
  });

  it("throws on whitespace-only value", () => {
    expect(() => SourceKnowledgeId.create("   ")).toThrow("SourceKnowledgeId cannot be empty");
  });
});
