import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySourceKnowledgeRepository } from "../InMemorySourceKnowledgeRepository";
import { SourceKnowledge } from "../../domain/SourceKnowledge";
import { SourceKnowledgeId } from "../../domain/SourceKnowledgeId";

describe("InMemorySourceKnowledgeRepository", () => {
  let repo: InMemorySourceKnowledgeRepository;

  beforeEach(() => {
    repo = new InMemorySourceKnowledgeRepository();
  });

  function createSK(overrides: {
    id?: string;
    sourceId?: string;
    contentHash?: string;
    defaultProfileId?: string;
  } = {}): SourceKnowledge {
    return SourceKnowledge.create({
      id: SourceKnowledgeId.create(overrides.id ?? "sk-1"),
      sourceId: overrides.sourceId ?? "source-1",
      contentHash: overrides.contentHash ?? "hash-abc",
      defaultProfileId: overrides.defaultProfileId ?? "profile-default",
    });
  }

  describe("save and findById", () => {
    it("round-trips an entity", async () => {
      const sk = createSK();

      await repo.save(sk);
      const found = await repo.findById(SourceKnowledgeId.create("sk-1"));

      expect(found).not.toBeNull();
      expect(found!.id.value).toBe("sk-1");
      expect(found!.sourceId).toBe("source-1");
      expect(found!.contentHash).toBe("hash-abc");
      expect(found!.defaultProfileId).toBe("profile-default");
    });

    it("returns null for non-existent id", async () => {
      const found = await repo.findById(SourceKnowledgeId.create("non-existent"));

      expect(found).toBeNull();
    });
  });

  describe("save overwrites existing entry", () => {
    it("updates the entity when saved again", async () => {
      const sk = createSK();
      await repo.save(sk);

      // Register a projection to mutate the entity
      sk.registerProjection({
        projectionId: "proj-1",
        profileId: "profile-default",
        status: "COMPLETED",
      });
      await repo.save(sk);

      const found = await repo.findById(SourceKnowledgeId.create("sk-1"));
      expect(found).not.toBeNull();
      expect(found!.hub.projections).toHaveLength(1);
      expect(found!.hub.projections[0].status).toBe("COMPLETED");
    });
  });

  describe("findBySourceId", () => {
    it("finds matching entity", async () => {
      const sk = createSK({ id: "sk-1", sourceId: "source-abc" });
      await repo.save(sk);

      const found = await repo.findBySourceId("source-abc");

      expect(found).not.toBeNull();
      expect(found!.id.value).toBe("sk-1");
      expect(found!.sourceId).toBe("source-abc");
    });

    it("returns null when no match", async () => {
      const sk = createSK({ id: "sk-1", sourceId: "source-abc" });
      await repo.save(sk);

      const found = await repo.findBySourceId("source-xyz");

      expect(found).toBeNull();
    });
  });

  describe("findByProfileId", () => {
    it("returns entities that have a projection for the given profile", async () => {
      const sk1 = createSK({ id: "sk-1", sourceId: "s-1" });
      sk1.registerProjection({
        projectionId: "proj-1",
        profileId: "profile-A",
        status: "COMPLETED",
      });

      const sk2 = createSK({ id: "sk-2", sourceId: "s-2" });
      sk2.registerProjection({
        projectionId: "proj-2",
        profileId: "profile-A",
        status: "PENDING",
      });

      const sk3 = createSK({ id: "sk-3", sourceId: "s-3" });
      // sk3 has no projection for profile-A

      await repo.save(sk1);
      await repo.save(sk2);
      await repo.save(sk3);

      const results = await repo.findByProfileId("profile-A");

      expect(results).toHaveLength(2);
      const ids = results.map((r) => r.id.value).sort();
      expect(ids).toEqual(["sk-1", "sk-2"]);
    });

    it("returns empty array when no matches", async () => {
      const sk = createSK();
      await repo.save(sk);

      const results = await repo.findByProfileId("non-existent-profile");

      expect(results).toEqual([]);
    });
  });

  describe("exists", () => {
    it("returns true when entity is present", async () => {
      const sk = createSK();
      await repo.save(sk);

      const result = await repo.exists(SourceKnowledgeId.create("sk-1"));

      expect(result).toBe(true);
    });

    it("returns false when entity is not present", async () => {
      const result = await repo.exists(SourceKnowledgeId.create("non-existent"));

      expect(result).toBe(false);
    });
  });

  describe("delete", () => {
    it("removes the entity from storage", async () => {
      const sk = createSK();
      await repo.save(sk);

      await repo.delete(SourceKnowledgeId.create("sk-1"));

      const found = await repo.findById(SourceKnowledgeId.create("sk-1"));
      expect(found).toBeNull();

      const exists = await repo.exists(SourceKnowledgeId.create("sk-1"));
      expect(exists).toBe(false);
    });

    it("is a no-op when entity does not exist", async () => {
      // Should not throw
      await repo.delete(SourceKnowledgeId.create("non-existent"));
    });
  });
});
