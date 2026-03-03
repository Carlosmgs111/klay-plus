import { describe, it, expect } from "vitest";
import { Context } from "../Context";
import { ContextId } from "../ContextId";
import { ContextMetadata } from "../ContextMetadata";
import { ContextSource } from "../ContextSource";
import { ContextVersion } from "../ContextVersion";
import { ContextState, canTransition } from "../ContextState";
import { ContextCreated } from "../events/ContextCreated";
import { ContextSourceAdded } from "../events/ContextSourceAdded";
import { ContextSourceRemoved } from "../events/ContextSourceRemoved";
import { ContextVersioned } from "../events/ContextVersioned";
import { ContextDeprecated } from "../events/ContextDeprecated";
import { ContextRolledBack } from "../events/ContextRolledBack";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function makeContext() {
  const id = ContextId.create("ctx-1");
  const metadata = ContextMetadata.create("test-user", ["tag1"], { key: "val" });
  return Context.create(id, "Test Context", "A test context", "en", "profile-1", metadata);
}

function makeSource(sourceId: string, sourceKnowledgeId = `sk-${sourceId}`) {
  return ContextSource.create(sourceId, sourceKnowledgeId);
}

// ──────────────────────────────────────────────
// ContextId
// ──────────────────────────────────────────────

describe("ContextId", () => {
  it("should create with a valid value", () => {
    const id = ContextId.create("ctx-123");
    expect(id.value).toBe("ctx-123");
  });

  it("should throw on empty value", () => {
    expect(() => ContextId.create("")).toThrow("ContextId cannot be empty");
  });

  it("should throw on whitespace-only value", () => {
    expect(() => ContextId.create("   ")).toThrow("ContextId cannot be empty");
  });
});

// ──────────────────────────────────────────────
// ContextState
// ──────────────────────────────────────────────

describe("ContextState", () => {
  it("should allow Draft -> Active", () => {
    expect(canTransition(ContextState.Draft, ContextState.Active)).toBe(true);
  });

  it("should allow Active -> Deprecated", () => {
    expect(canTransition(ContextState.Active, ContextState.Deprecated)).toBe(true);
  });

  it("should allow Active -> Archived", () => {
    expect(canTransition(ContextState.Active, ContextState.Archived)).toBe(true);
  });

  it("should allow Deprecated -> Active", () => {
    expect(canTransition(ContextState.Deprecated, ContextState.Active)).toBe(true);
  });

  it("should allow Deprecated -> Archived", () => {
    expect(canTransition(ContextState.Deprecated, ContextState.Archived)).toBe(true);
  });

  it("should reject Draft -> Deprecated", () => {
    expect(canTransition(ContextState.Draft, ContextState.Deprecated)).toBe(false);
  });

  it("should reject Draft -> Archived", () => {
    expect(canTransition(ContextState.Draft, ContextState.Archived)).toBe(false);
  });

  it("should reject Archived -> anything", () => {
    expect(canTransition(ContextState.Archived, ContextState.Active)).toBe(false);
    expect(canTransition(ContextState.Archived, ContextState.Draft)).toBe(false);
    expect(canTransition(ContextState.Archived, ContextState.Deprecated)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// ContextSource
// ──────────────────────────────────────────────

describe("ContextSource", () => {
  it("should create with sourceId and sourceKnowledgeId", () => {
    const source = ContextSource.create("src-1", "sk-1");
    expect(source.sourceId).toBe("src-1");
    expect(source.sourceKnowledgeId).toBe("sk-1");
    expect(source.addedAt).toBeInstanceOf(Date);
  });

  it("should throw on empty sourceId", () => {
    expect(() => ContextSource.create("", "sk-1")).toThrow("sourceId is required");
  });

  it("should throw on empty sourceKnowledgeId", () => {
    expect(() => ContextSource.create("src-1", "")).toThrow("sourceKnowledgeId is required");
  });

  it("should reconstitute with all fields", () => {
    const date = new Date("2025-01-01");
    const source = ContextSource.reconstitute("src-1", "sk-1", date);
    expect(source.sourceId).toBe("src-1");
    expect(source.sourceKnowledgeId).toBe("sk-1");
    expect(source.addedAt).toEqual(date);
  });
});

// ──────────────────────────────────────────────
// ContextVersion
// ──────────────────────────────────────────────

describe("ContextVersion", () => {
  it("should create initial version (v1)", () => {
    const v = ContextVersion.initial(["src-1", "src-2"]);
    expect(v.version).toBe(1);
    expect(v.sourceIds).toEqual(["src-1", "src-2"]);
    expect(v.reason).toBe("Initial version");
    expect(v.createdAt).toBeInstanceOf(Date);
  });

  it("should create initial version with custom reason", () => {
    const v = ContextVersion.initial(["src-1"], "Custom reason");
    expect(v.reason).toBe("Custom reason");
  });

  it("should create next version (incrementing)", () => {
    const v = ContextVersion.next(1, ["src-1", "src-2", "src-3"], "Added src-3");
    expect(v.version).toBe(2);
    expect(v.sourceIds).toEqual(["src-1", "src-2", "src-3"]);
    expect(v.reason).toBe("Added src-3");
  });

  it("should throw if next version reason is empty", () => {
    expect(() => ContextVersion.next(1, ["src-1"], "")).toThrow("Version reason is required");
  });

  it("should reconstitute with all fields", () => {
    const date = new Date("2025-06-01");
    const v = ContextVersion.reconstitute(3, ["src-1"], "Reconstituted", date);
    expect(v.version).toBe(3);
    expect(v.sourceIds).toEqual(["src-1"]);
    expect(v.reason).toBe("Reconstituted");
    expect(v.createdAt).toEqual(date);
  });

  it("should check hasSource correctly", () => {
    const v = ContextVersion.initial(["src-1", "src-2"]);
    expect(v.hasSource("src-1")).toBe(true);
    expect(v.hasSource("src-3")).toBe(false);
  });
});

// ──────────────────────────────────────────────
// ContextMetadata
// ──────────────────────────────────────────────

describe("ContextMetadata", () => {
  it("should create with createdBy", () => {
    const m = ContextMetadata.create("admin");
    expect(m.createdBy).toBe("admin");
    expect(m.tags).toEqual([]);
    expect(m.attributes).toEqual({});
    expect(m.createdAt).toBeInstanceOf(Date);
    expect(m.updatedAt).toBeInstanceOf(Date);
  });

  it("should create with tags and attributes", () => {
    const m = ContextMetadata.create("admin", ["t1", "t2"], { env: "prod" });
    expect(m.tags).toEqual(["t1", "t2"]);
    expect(m.attributes).toEqual({ env: "prod" });
  });

  it("should throw on empty createdBy", () => {
    expect(() => ContextMetadata.create("")).toThrow("createdBy is required");
  });

  it("should update timestamp via withUpdatedTimestamp", () => {
    const m = ContextMetadata.create("admin");
    const original = m.updatedAt;

    // Small delay to ensure different timestamp
    const updated = m.withUpdatedTimestamp();
    expect(updated.createdAt).toEqual(m.createdAt);
    expect(updated.createdBy).toBe("admin");
    // updatedAt should be >= original (same ms is ok)
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.getTime());
  });
});

// ──────────────────────────────────────────────
// Context aggregate
// ──────────────────────────────────────────────

describe("Context", () => {
  describe("create", () => {
    it("should create in Draft with requiredProfileId, no sources, emits ContextCreated", () => {
      const ctx = makeContext();

      expect(ctx.name).toBe("Test Context");
      expect(ctx.description).toBe("A test context");
      expect(ctx.language).toBe("en");
      expect(ctx.requiredProfileId).toBe("profile-1");
      expect(ctx.state).toBe(ContextState.Draft);
      expect(ctx.currentVersion).toBeNull();
      expect(ctx.versions).toHaveLength(0);
      expect(ctx.allSources).toHaveLength(0);
      expect(ctx.activeSources).toHaveLength(0);
    });

    it("should emit ContextCreated event", () => {
      const ctx = makeContext();
      const events = ctx.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(ContextCreated.EVENT_TYPE);
      expect(events[0].payload).toMatchObject({
        name: "Test Context",
        language: "en",
        requiredProfileId: "profile-1",
        state: ContextState.Draft,
      });
    });
  });

  describe("addSource", () => {
    it("should add first source and create v1", () => {
      const ctx = makeContext();
      ctx.clearEvents();

      const source = makeSource("src-1");
      const version = ctx.addSource(source);

      expect(version.version).toBe(1);
      expect(version.sourceIds).toEqual(["src-1"]);

      expect(ctx.currentVersion).not.toBeNull();
      expect(ctx.currentVersion!.version).toBe(1);
      expect(ctx.allSources).toHaveLength(1);
      expect(ctx.activeSources).toHaveLength(1);
      expect(ctx.activeSources[0].sourceId).toBe("src-1");
    });

    it("should add second source and create v2", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));
      ctx.clearEvents();

      const v2 = ctx.addSource(makeSource("src-2"));

      expect(v2.version).toBe(2);
      expect(v2.sourceIds).toEqual(["src-1", "src-2"]);
      expect(ctx.allSources).toHaveLength(2);
      expect(ctx.activeSources).toHaveLength(2);
    });

    it("should emit ContextSourceAdded + ContextVersioned events", () => {
      const ctx = makeContext();
      ctx.clearEvents();

      ctx.addSource(makeSource("src-1"));
      const events = ctx.domainEvents;

      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe(ContextSourceAdded.EVENT_TYPE);
      expect(events[0].payload).toMatchObject({
        sourceId: "src-1",
        sourceKnowledgeId: "sk-src-1",
      });
      expect(events[1].eventType).toBe(ContextVersioned.EVENT_TYPE);
      expect(events[1].payload).toMatchObject({ version: 1 });
    });

    it("should throw if source already exists", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));

      expect(() => ctx.addSource(makeSource("src-1"))).toThrow(
        "Source with sourceId 'src-1' already attached",
      );
    });

    it("should throw if context is archived", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));
      ctx.activate();
      ctx.archive();

      expect(() => ctx.addSource(makeSource("src-2"))).toThrow(
        "Cannot add source to an archived context",
      );
    });
  });

  describe("removeSource", () => {
    it("should remove a source and create new version without it", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));
      ctx.addSource(makeSource("src-2"));
      ctx.clearEvents();

      const newVersion = ctx.removeSource("src-1");

      expect(newVersion.sourceIds).toEqual(["src-2"]);
      expect(ctx.activeSources).toHaveLength(1);
      expect(ctx.activeSources[0].sourceId).toBe("src-2");
      // src-1 still in pool
      expect(ctx.allSources).toHaveLength(2);
    });

    it("should emit ContextSourceRemoved + ContextVersioned events", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));
      ctx.addSource(makeSource("src-2"));
      ctx.clearEvents();

      ctx.removeSource("src-1");
      const events = ctx.domainEvents;

      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe(ContextSourceRemoved.EVENT_TYPE);
      expect(events[0].payload).toMatchObject({ sourceId: "src-1" });
      expect(events[1].eventType).toBe(ContextVersioned.EVENT_TYPE);
    });

    it("should throw if removing last active source", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));

      expect(() => ctx.removeSource("src-1")).toThrow(
        "Cannot remove the last active source",
      );
    });

    it("should throw if source not found", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));

      expect(() => ctx.removeSource("non-existent")).toThrow(
        "Source with sourceId 'non-existent' not found",
      );
    });

    it("should throw if context is archived", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));
      ctx.addSource(makeSource("src-2"));
      ctx.activate();
      ctx.archive();

      expect(() => ctx.removeSource("src-1")).toThrow(
        "Cannot remove source from an archived context",
      );
    });

    it("should throw if no version exists", () => {
      // reconstitute a context with a source in the pool but no version
      const id = ContextId.create("ctx-x");
      const metadata = ContextMetadata.create("user");
      const source = ContextSource.reconstitute("src-1", "sk-1", new Date());
      const ctx = Context.reconstitute(
        id, "Name", "Desc", "en", "prof-1",
        ContextState.Draft, [source], [], null, metadata,
      );

      expect(() => ctx.removeSource("src-1")).toThrow(
        "Cannot remove source when no version exists",
      );
    });
  });

  describe("rollbackToVersion", () => {
    it("should move currentVersionNumber to target version", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));
      ctx.addSource(makeSource("src-2"));

      expect(ctx.currentVersion!.version).toBe(2);

      ctx.clearEvents();
      ctx.rollbackToVersion(1);

      expect(ctx.currentVersion!.version).toBe(1);
      expect(ctx.currentVersion!.sourceIds).toEqual(["src-1"]);
      expect(ctx.activeSources).toHaveLength(1);
    });

    it("should emit ContextRolledBack event", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));
      ctx.addSource(makeSource("src-2"));
      ctx.clearEvents();

      ctx.rollbackToVersion(1);
      const events = ctx.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(ContextRolledBack.EVENT_TYPE);
      expect(events[0].payload).toMatchObject({
        fromVersion: 2,
        toVersion: 1,
      });
    });

    it("should allow rolling forward again", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));
      ctx.addSource(makeSource("src-2"));

      ctx.rollbackToVersion(1);
      expect(ctx.currentVersion!.version).toBe(1);

      ctx.rollbackToVersion(2);
      expect(ctx.currentVersion!.version).toBe(2);
    });

    it("should throw if version not found", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));

      expect(() => ctx.rollbackToVersion(99)).toThrow("Version 99 not found");
    });
  });

  describe("state machine", () => {
    it("should transition Draft -> Active", () => {
      const ctx = makeContext();
      ctx.activate();
      expect(ctx.state).toBe(ContextState.Active);
    });

    it("should transition Active -> Deprecated", () => {
      const ctx = makeContext();
      ctx.activate();
      ctx.deprecate("outdated");
      expect(ctx.state).toBe(ContextState.Deprecated);
    });

    it("should transition Active -> Archived", () => {
      const ctx = makeContext();
      ctx.activate();
      ctx.archive();
      expect(ctx.state).toBe(ContextState.Archived);
    });

    it("should transition Deprecated -> Active", () => {
      const ctx = makeContext();
      ctx.activate();
      ctx.deprecate("temp");
      ctx.activate();
      expect(ctx.state).toBe(ContextState.Active);
    });

    it("should transition Deprecated -> Archived", () => {
      const ctx = makeContext();
      ctx.activate();
      ctx.deprecate("temp");
      ctx.archive();
      expect(ctx.state).toBe(ContextState.Archived);
    });

    it("should reject Draft -> Deprecated", () => {
      const ctx = makeContext();
      expect(() => ctx.deprecate("reason")).toThrow("Invalid state transition");
    });

    it("should reject Draft -> Archived", () => {
      const ctx = makeContext();
      expect(() => ctx.archive()).toThrow("Invalid state transition");
    });

    it("should reject Archived -> anything", () => {
      const ctx = makeContext();
      ctx.activate();
      ctx.archive();

      expect(() => ctx.activate()).toThrow("Invalid state transition");
    });

    it("should emit ContextDeprecated event on deprecate", () => {
      const ctx = makeContext();
      ctx.activate();
      ctx.clearEvents();

      ctx.deprecate("no longer needed");
      const events = ctx.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(ContextDeprecated.EVENT_TYPE);
      expect(events[0].payload).toMatchObject({ reason: "no longer needed" });
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute without emitting events", () => {
      const id = ContextId.create("ctx-r");
      const metadata = ContextMetadata.create("user");
      const ctx = Context.reconstitute(
        id, "Name", "Desc", "es", "profile-2",
        ContextState.Active, [], [], null, metadata,
      );

      expect(ctx.name).toBe("Name");
      expect(ctx.description).toBe("Desc");
      expect(ctx.language).toBe("es");
      expect(ctx.requiredProfileId).toBe("profile-2");
      expect(ctx.state).toBe(ContextState.Active);
      expect(ctx.domainEvents).toHaveLength(0);
    });

    it("should reconstitute with sources and versions", () => {
      const id = ContextId.create("ctx-r2");
      const metadata = ContextMetadata.create("user");
      const source = ContextSource.reconstitute("src-1", "sk-1", new Date());
      const version = ContextVersion.reconstitute(1, ["src-1"], "Initial version", new Date());

      const ctx = Context.reconstitute(
        id, "Name", "Desc", "en", "prof-1",
        ContextState.Active, [source], [version], 1, metadata,
      );

      expect(ctx.currentVersion).not.toBeNull();
      expect(ctx.currentVersion!.version).toBe(1);
      expect(ctx.allSources).toHaveLength(1);
      expect(ctx.activeSources).toHaveLength(1);
      expect(ctx.domainEvents).toHaveLength(0);
    });
  });

  describe("currentVersion and activeSources tracking", () => {
    it("should track correctly after add/remove sequence", () => {
      const ctx = makeContext();

      // Add 3 sources
      ctx.addSource(makeSource("src-1"));
      ctx.addSource(makeSource("src-2"));
      ctx.addSource(makeSource("src-3"));

      expect(ctx.currentVersion!.version).toBe(3);
      expect(ctx.currentVersion!.sourceIds).toEqual(["src-1", "src-2", "src-3"]);
      expect(ctx.activeSources).toHaveLength(3);
      expect(ctx.allSources).toHaveLength(3);

      // Remove src-2
      ctx.removeSource("src-2");

      expect(ctx.currentVersion!.version).toBe(4);
      expect(ctx.currentVersion!.sourceIds).toEqual(["src-1", "src-3"]);
      expect(ctx.activeSources).toHaveLength(2);
      // All 3 still in pool
      expect(ctx.allSources).toHaveLength(3);
    });

    it("should reflect correct activeSources after rollback", () => {
      const ctx = makeContext();
      ctx.addSource(makeSource("src-1"));
      ctx.addSource(makeSource("src-2"));

      // v2 has [src-1, src-2]
      expect(ctx.activeSources).toHaveLength(2);

      // Rollback to v1 which has [src-1]
      ctx.rollbackToVersion(1);
      expect(ctx.activeSources).toHaveLength(1);
      expect(ctx.activeSources[0].sourceId).toBe("src-1");
    });
  });
});
