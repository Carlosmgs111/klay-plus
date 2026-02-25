import { describe, it, expect } from "vitest";
import { SemanticUnit } from "../SemanticUnit.js";
import { SemanticUnitId } from "../SemanticUnitId.js";
import { UnitMetadata } from "../UnitMetadata.js";
import { UnitSource } from "../UnitSource.js";
import { SemanticState } from "../SemanticState.js";
import { SemanticUnitCreated } from "../events/SemanticUnitCreated.js";
import { SemanticUnitSourceAdded } from "../events/SemanticUnitSourceAdded.js";
import { SemanticUnitSourceRemoved } from "../events/SemanticUnitSourceRemoved.js";
import { SemanticUnitVersioned } from "../events/SemanticUnitVersioned.js";
import { SemanticUnitRolledBack } from "../events/SemanticUnitRolledBack.js";
import { SemanticUnitReprocessRequested } from "../events/SemanticUnitReprocessRequested.js";

function makeUnit() {
  const id = SemanticUnitId.create("unit-1");
  const metadata = UnitMetadata.create("test-user", ["tag1"], { key: "val" });
  return SemanticUnit.create(id, "Test Unit", "A test unit", "en", metadata);
}

function makeSource(sourceId: string, content = "Extracted content") {
  return UnitSource.create(sourceId, "document", content, `hash-${sourceId}`);
}

describe("SemanticUnit", () => {
  describe("create", () => {
    it("should create a unit in Draft state with no sources and no version", () => {
      const unit = makeUnit();

      expect(unit.name).toBe("Test Unit");
      expect(unit.description).toBe("A test unit");
      expect(unit.language).toBe("en");
      expect(unit.state).toBe(SemanticState.Draft);
      expect(unit.currentVersion).toBeNull();
      expect(unit.versions).toHaveLength(0);
      expect(unit.allSources).toHaveLength(0);
      expect(unit.activeSources).toHaveLength(0);
    });

    it("should emit SemanticUnitCreated event", () => {
      const unit = makeUnit();
      const events = unit.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(SemanticUnitCreated.EVENT_TYPE);
      expect(events[0].payload).toMatchObject({
        name: "Test Unit",
        language: "en",
        state: SemanticState.Draft,
      });
    });
  });

  describe("addSource", () => {
    it("should add first source and create v1", () => {
      const unit = makeUnit();
      unit.clearEvents();

      const source = makeSource("src-1");
      const version = unit.addSource(source, "profile-1", 1);

      expect(version.version).toBe(1);
      expect(version.processingProfileId).toBe("profile-1");
      expect(version.processingProfileVersion).toBe(1);
      expect(version.sourceSnapshots).toHaveLength(1);
      expect(version.sourceSnapshots[0].sourceId).toBe("src-1");

      expect(unit.currentVersion).not.toBeNull();
      expect(unit.currentVersion!.version).toBe(1);
      expect(unit.allSources).toHaveLength(1);
      expect(unit.activeSources).toHaveLength(1);
    });

    it("should add second source and create v2", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "profile-1", 1);
      unit.clearEvents();

      const v2 = unit.addSource(makeSource("src-2", "Content 2"), "profile-1", 1);

      expect(v2.version).toBe(2);
      expect(v2.sourceSnapshots).toHaveLength(2);
      expect(unit.allSources).toHaveLength(2);
      expect(unit.activeSources).toHaveLength(2);
    });

    it("should emit SourceAdded + Versioned events", () => {
      const unit = makeUnit();
      unit.clearEvents();

      unit.addSource(makeSource("src-1"), "profile-1", 1);
      const events = unit.domainEvents;

      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe(SemanticUnitSourceAdded.EVENT_TYPE);
      expect(events[0].payload).toMatchObject({ sourceId: "src-1" });
      expect(events[1].eventType).toBe(SemanticUnitVersioned.EVENT_TYPE);
    });

    it("should throw if source already exists", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);

      expect(() => unit.addSource(makeSource("src-1"), "p", 1)).toThrow(
        "Source with sourceId 'src-1' already attached",
      );
    });

    it("should throw if unit is archived", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);
      unit.activate();
      unit.archive();

      expect(() => unit.addSource(makeSource("src-2"), "p", 1)).toThrow(
        "Cannot add source to an archived semantic unit",
      );
    });
  });

  describe("removeSource", () => {
    it("should remove a source and create new version without it", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);
      unit.addSource(makeSource("src-2", "Content 2"), "p", 1);
      unit.clearEvents();

      const newVersion = unit.removeSource("src-1");

      expect(newVersion.sourceSnapshots).toHaveLength(1);
      expect(newVersion.sourceSnapshots[0].sourceId).toBe("src-2");
      expect(unit.activeSources).toHaveLength(1);
      // src-1 is still in pool
      expect(unit.allSources).toHaveLength(2);
    });

    it("should emit SourceRemoved + Versioned events", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);
      unit.addSource(makeSource("src-2", "Content 2"), "p", 1);
      unit.clearEvents();

      unit.removeSource("src-1");
      const events = unit.domainEvents;

      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe(SemanticUnitSourceRemoved.EVENT_TYPE);
      expect(events[0].payload).toMatchObject({ sourceId: "src-1" });
      expect(events[1].eventType).toBe(SemanticUnitVersioned.EVENT_TYPE);
    });

    it("should throw if removing last active source", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);

      expect(() => unit.removeSource("src-1")).toThrow(
        "Cannot remove the last active source",
      );
    });

    it("should throw if source not found", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);

      expect(() => unit.removeSource("non-existent")).toThrow(
        "Source with sourceId 'non-existent' not found",
      );
    });

    it("should throw if archived", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);
      unit.addSource(makeSource("src-2", "C2"), "p", 1);
      unit.activate();
      unit.archive();

      expect(() => unit.removeSource("src-1")).toThrow(
        "Cannot remove source from an archived semantic unit",
      );
    });
  });

  describe("reprocess", () => {
    it("should create new version with new profile and same sources", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "profile-1", 1);
      unit.clearEvents();

      const newVersion = unit.reprocess("profile-2", 1, "Upgraded embedding model");

      expect(newVersion.version).toBe(2);
      expect(newVersion.processingProfileId).toBe("profile-2");
      expect(newVersion.sourceSnapshots).toHaveLength(1);
      expect(newVersion.sourceSnapshots[0].sourceId).toBe("src-1");
      // projectionIds are reset on reprocess
      expect(newVersion.sourceSnapshots[0].projectionIds).toEqual([]);
    });

    it("should emit ReprocessRequested + Versioned events", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);
      unit.clearEvents();

      unit.reprocess("p2", 1, "reason");
      const events = unit.domainEvents;

      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe(SemanticUnitReprocessRequested.EVENT_TYPE);
      expect(events[1].eventType).toBe(SemanticUnitVersioned.EVENT_TYPE);
    });

    it("should throw if no version exists", () => {
      const unit = makeUnit();

      expect(() => unit.reprocess("p", 1, "reason")).toThrow(
        "Cannot reprocess a semantic unit with no version",
      );
    });

    it("should throw if archived", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);
      unit.activate();
      unit.archive();

      expect(() => unit.reprocess("p2", 1, "reason")).toThrow(
        "Cannot reprocess an archived semantic unit",
      );
    });
  });

  describe("rollbackToVersion", () => {
    it("should move currentVersionNumber to target version", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);
      unit.addSource(makeSource("src-2", "C2"), "p", 1);

      expect(unit.currentVersion!.version).toBe(2);

      unit.clearEvents();
      unit.rollbackToVersion(1);

      expect(unit.currentVersion!.version).toBe(1);
      expect(unit.currentVersion!.sourceSnapshots).toHaveLength(1);
      // activeSources reflects v1
      expect(unit.activeSources).toHaveLength(1);
    });

    it("should emit RolledBack event", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);
      unit.addSource(makeSource("src-2", "C2"), "p", 1);
      unit.clearEvents();

      unit.rollbackToVersion(1);
      const events = unit.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(SemanticUnitRolledBack.EVENT_TYPE);
      expect(events[0].payload).toMatchObject({
        fromVersion: 2,
        toVersion: 1,
      });
    });

    it("should allow rolling forward again", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);
      unit.addSource(makeSource("src-2", "C2"), "p", 1);

      unit.rollbackToVersion(1);
      expect(unit.currentVersion!.version).toBe(1);

      unit.rollbackToVersion(2);
      expect(unit.currentVersion!.version).toBe(2);
    });

    it("should throw if version not found", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);

      expect(() => unit.rollbackToVersion(99)).toThrow("Version 99 not found");
    });
  });

  describe("recordProjectionForSource", () => {
    it("should add projectionId to the source snapshot in current version", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);

      unit.recordProjectionForSource("src-1", "proj-abc");

      const snapshot = unit.currentVersion!.getSnapshotForSource("src-1");
      expect(snapshot!.projectionIds).toEqual(["proj-abc"]);
    });

    it("should throw if source not in current version", () => {
      const unit = makeUnit();
      unit.addSource(makeSource("src-1"), "p", 1);

      expect(() => unit.recordProjectionForSource("non-existent", "proj-1")).toThrow(
        "Source 'non-existent' not found in current version",
      );
    });

    it("should throw if no version exists", () => {
      const unit = makeUnit();

      expect(() => unit.recordProjectionForSource("src-1", "proj-1")).toThrow(
        "Cannot record projection when no version exists",
      );
    });
  });

  describe("state machine", () => {
    it("should transition Draft -> Active", () => {
      const unit = makeUnit();
      unit.activate();
      expect(unit.state).toBe(SemanticState.Active);
    });

    it("should transition Active -> Deprecated", () => {
      const unit = makeUnit();
      unit.activate();
      unit.deprecate("outdated");
      expect(unit.state).toBe(SemanticState.Deprecated);
    });

    it("should transition Active -> Archived", () => {
      const unit = makeUnit();
      unit.activate();
      unit.archive();
      expect(unit.state).toBe(SemanticState.Archived);
    });

    it("should transition Deprecated -> Active", () => {
      const unit = makeUnit();
      unit.activate();
      unit.deprecate("temp");
      unit.activate();
      expect(unit.state).toBe(SemanticState.Active);
    });

    it("should reject Draft -> Deprecated", () => {
      const unit = makeUnit();
      expect(() => unit.deprecate("reason")).toThrow("Invalid state transition");
    });

    it("should reject Archived -> anything", () => {
      const unit = makeUnit();
      unit.activate();
      unit.archive();

      expect(() => unit.activate()).toThrow("Invalid state transition");
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute without emitting events", () => {
      const id = SemanticUnitId.create("unit-r");
      const metadata = UnitMetadata.create("user");
      const unit = SemanticUnit.reconstitute(
        id, "Name", "Desc", "es",
        SemanticState.Active, [], [], null, metadata,
      );

      expect(unit.name).toBe("Name");
      expect(unit.state).toBe(SemanticState.Active);
      expect(unit.domainEvents).toHaveLength(0);
    });
  });
});
