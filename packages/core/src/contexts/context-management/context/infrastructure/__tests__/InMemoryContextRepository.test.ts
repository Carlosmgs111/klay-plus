import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryContextRepository } from "../InMemoryContextRepository";
import { Context } from "../../domain/Context";
import { ContextId } from "../../domain/ContextId";
import { ContextMetadata } from "../../domain/ContextMetadata";
import { ContextSource } from "../../domain/ContextSource";
import { ContextState } from "../../domain/ContextState";

describe("InMemoryContextRepository", () => {
  let repo: InMemoryContextRepository;

  beforeEach(() => {
    repo = new InMemoryContextRepository();
  });

  function createContext(overrides: {
    id?: string;
    name?: string;
    requiredProfileId?: string;
    state?: ContextState;
  } = {}): Context {
    const id = ContextId.create(overrides.id ?? "ctx-1");
    const metadata = ContextMetadata.create("test-user");
    const ctx = Context.create(
      id,
      overrides.name ?? "Test Context",
      "A test context",
      "en",
      overrides.requiredProfileId ?? "profile-1",
      metadata,
    );

    // If a non-draft state is requested, transition to it
    if (overrides.state && overrides.state !== ContextState.Draft) {
      if (overrides.state === ContextState.Active) {
        ctx.activate();
      } else if (overrides.state === ContextState.Deprecated) {
        ctx.activate();
        ctx.deprecate("test deprecation");
      } else if (overrides.state === ContextState.Archived) {
        ctx.activate();
        ctx.archive();
      }
    }

    return ctx;
  }

  // ── save and findById ───────────────────────────────────────────

  describe("save and findById", () => {
    it("round-trips an entity", async () => {
      const ctx = createContext();

      await repo.save(ctx);
      const found = await repo.findById(ContextId.create("ctx-1"));

      expect(found).not.toBeNull();
      expect(found!.id.value).toBe("ctx-1");
      expect(found!.name).toBe("Test Context");
      expect(found!.requiredProfileId).toBe("profile-1");
    });

    it("returns null for non-existent id", async () => {
      const found = await repo.findById(ContextId.create("non-existent"));

      expect(found).toBeNull();
    });
  });

  // ── findBySourceId ──────────────────────────────────────────────

  describe("findBySourceId", () => {
    it("finds contexts containing the given sourceId", async () => {
      const ctx1 = createContext({ id: "ctx-1" });
      ctx1.addSource(ContextSource.create("src-A", "sk-A"));

      const ctx2 = createContext({ id: "ctx-2" });
      ctx2.addSource(ContextSource.create("src-A", "sk-A"));
      ctx2.addSource(ContextSource.create("src-B", "sk-B"));

      const ctx3 = createContext({ id: "ctx-3" });
      ctx3.addSource(ContextSource.create("src-C", "sk-C"));

      await repo.save(ctx1);
      await repo.save(ctx2);
      await repo.save(ctx3);

      const results = await repo.findBySourceId("src-A");

      expect(results).toHaveLength(2);
      const ids = results.map((c) => c.id.value).sort();
      expect(ids).toEqual(["ctx-1", "ctx-2"]);
    });

    it("returns empty array when no match", async () => {
      const ctx = createContext();
      ctx.addSource(ContextSource.create("src-1", "sk-1"));
      await repo.save(ctx);

      const results = await repo.findBySourceId("non-existent");

      expect(results).toEqual([]);
    });
  });

  // ── findByState ─────────────────────────────────────────────────

  describe("findByState", () => {
    it("finds contexts in the given state", async () => {
      const draft = createContext({ id: "ctx-draft" });
      const active = createContext({ id: "ctx-active", state: ContextState.Active });
      const deprecated = createContext({ id: "ctx-deprecated", state: ContextState.Deprecated });

      await repo.save(draft);
      await repo.save(active);
      await repo.save(deprecated);

      const activeResults = await repo.findByState(ContextState.Active);
      expect(activeResults).toHaveLength(1);
      expect(activeResults[0].id.value).toBe("ctx-active");

      const draftResults = await repo.findByState(ContextState.Draft);
      expect(draftResults).toHaveLength(1);
      expect(draftResults[0].id.value).toBe("ctx-draft");
    });

    it("returns empty array when no contexts in state", async () => {
      const ctx = createContext();
      await repo.save(ctx);

      const results = await repo.findByState(ContextState.Archived);

      expect(results).toEqual([]);
    });
  });

  // ── findByRequiredProfileId ─────────────────────────────────────

  describe("findByRequiredProfileId", () => {
    it("finds contexts with matching requiredProfileId", async () => {
      const ctx1 = createContext({ id: "ctx-1", requiredProfileId: "profile-A" });
      const ctx2 = createContext({ id: "ctx-2", requiredProfileId: "profile-A" });
      const ctx3 = createContext({ id: "ctx-3", requiredProfileId: "profile-B" });

      await repo.save(ctx1);
      await repo.save(ctx2);
      await repo.save(ctx3);

      const results = await repo.findByRequiredProfileId("profile-A");

      expect(results).toHaveLength(2);
      const ids = results.map((c) => c.id.value).sort();
      expect(ids).toEqual(["ctx-1", "ctx-2"]);
    });

    it("returns empty array when no match", async () => {
      const ctx = createContext({ requiredProfileId: "profile-X" });
      await repo.save(ctx);

      const results = await repo.findByRequiredProfileId("non-existent");

      expect(results).toEqual([]);
    });
  });

  // ── exists ──────────────────────────────────────────────────────

  describe("exists", () => {
    it("returns true when entity is present", async () => {
      const ctx = createContext();
      await repo.save(ctx);

      const result = await repo.exists(ContextId.create("ctx-1"));

      expect(result).toBe(true);
    });

    it("returns false when entity is not present", async () => {
      const result = await repo.exists(ContextId.create("non-existent"));

      expect(result).toBe(false);
    });
  });

  // ── delete ──────────────────────────────────────────────────────

  describe("delete", () => {
    it("removes the entity from storage", async () => {
      const ctx = createContext();
      await repo.save(ctx);

      await repo.delete(ContextId.create("ctx-1"));

      const found = await repo.findById(ContextId.create("ctx-1"));
      expect(found).toBeNull();

      const exists = await repo.exists(ContextId.create("ctx-1"));
      expect(exists).toBe(false);
    });

    it("is a no-op when entity does not exist", async () => {
      // Should not throw
      await repo.delete(ContextId.create("non-existent"));
    });
  });
});
