import { describe, it, expect } from "vitest";
import { UnitVersion } from "../UnitVersion";
import { VersionSourceSnapshot } from "../VersionSourceSnapshot";

describe("UnitVersion", () => {
  const makeSnapshot = (sourceId: string, hash: string) =>
    VersionSourceSnapshot.create(sourceId, hash);

  it("should create initial version (v1)", () => {
    const snapshots = [makeSnapshot("src-1", "hash-a")];
    const version = UnitVersion.initial("profile-1", 1, snapshots);

    expect(version.version).toBe(1);
    expect(version.processingProfileId).toBe("profile-1");
    expect(version.processingProfileVersion).toBe(1);
    expect(version.sourceSnapshots).toHaveLength(1);
    expect(version.createdAt).toBeInstanceOf(Date);
    expect(version.reason).toBe("Initial version");
  });

  it("should create next version via next()", () => {
    const v1 = UnitVersion.initial("profile-1", 1, [makeSnapshot("src-1", "hash-a")]);

    const v2 = v1.next(
      "profile-1",
      2,
      [makeSnapshot("src-1", "hash-a"), makeSnapshot("src-2", "hash-b")],
      "Added new source",
    );

    expect(v2.version).toBe(2);
    expect(v2.processingProfileId).toBe("profile-1");
    expect(v2.processingProfileVersion).toBe(2);
    expect(v2.sourceSnapshots).toHaveLength(2);
    expect(v2.reason).toBe("Added new source");
  });

  it("should throw if next() reason is empty", () => {
    const v1 = UnitVersion.initial("profile-1", 1, [makeSnapshot("src-1", "hash-a")]);

    expect(() => v1.next("profile-1", 1, [], "")).toThrow("Version reason is required");
  });

  it("should throw if next() reason is whitespace only", () => {
    const v1 = UnitVersion.initial("profile-1", 1, [makeSnapshot("src-1", "hash-a")]);

    expect(() => v1.next("profile-1", 1, [], "   ")).toThrow("Version reason is required");
  });

  it("should increment version number correctly across multiple nexts", () => {
    const v1 = UnitVersion.initial("p", 1, [makeSnapshot("s1", "h1")]);
    const v2 = v1.next("p", 1, [makeSnapshot("s1", "h1")], "reason 2");
    const v3 = v2.next("p", 2, [makeSnapshot("s1", "h1")], "reason 3");

    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    expect(v3.version).toBe(3);
  });

  describe("getSnapshotForSource", () => {
    it("should return snapshot for existing source", () => {
      const v = UnitVersion.initial("p", 1, [
        makeSnapshot("src-1", "hash-a"),
        makeSnapshot("src-2", "hash-b"),
      ]);

      const snapshot = v.getSnapshotForSource("src-2");
      expect(snapshot).toBeDefined();
      expect(snapshot!.contentHash).toBe("hash-b");
    });

    it("should return undefined for non-existing source", () => {
      const v = UnitVersion.initial("p", 1, [makeSnapshot("src-1", "hash-a")]);

      expect(v.getSnapshotForSource("non-existent")).toBeUndefined();
    });
  });

  describe("hasSource", () => {
    it("should return true for existing source", () => {
      const v = UnitVersion.initial("p", 1, [makeSnapshot("src-1", "hash-a")]);

      expect(v.hasSource("src-1")).toBe(true);
    });

    it("should return false for non-existing source", () => {
      const v = UnitVersion.initial("p", 1, [makeSnapshot("src-1", "hash-a")]);

      expect(v.hasSource("src-2")).toBe(false);
    });
  });

  it("should reconstitute from persisted data", () => {
    const createdAt = new Date("2024-06-01");
    const v = UnitVersion.reconstitute(
      3,
      "profile-x",
      5,
      [makeSnapshot("src-1", "hash-a")],
      createdAt,
      "Reconstituted version",
    );

    expect(v.version).toBe(3);
    expect(v.processingProfileId).toBe("profile-x");
    expect(v.processingProfileVersion).toBe(5);
    expect(v.createdAt).toBe(createdAt);
    expect(v.reason).toBe("Reconstituted version");
  });
});
