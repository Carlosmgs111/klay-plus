import { describe, it, expect } from "vitest";
import { VersionSourceSnapshot } from "../VersionSourceSnapshot.js";

describe("VersionSourceSnapshot", () => {
  it("should create a valid snapshot", () => {
    const snapshot = VersionSourceSnapshot.create("source-1", "hash-abc");

    expect(snapshot.sourceId).toBe("source-1");
    expect(snapshot.contentHash).toBe("hash-abc");
    expect(snapshot.projectionIds).toEqual([]);
  });

  it("should create with initial projectionIds", () => {
    const snapshot = VersionSourceSnapshot.create("source-1", "hash-abc", ["proj-1", "proj-2"]);

    expect(snapshot.projectionIds).toEqual(["proj-1", "proj-2"]);
  });

  it("should throw if sourceId is empty", () => {
    expect(() => VersionSourceSnapshot.create("", "hash")).toThrow(
      "VersionSourceSnapshot sourceId is required",
    );
  });

  it("should throw if contentHash is empty", () => {
    expect(() => VersionSourceSnapshot.create("source-1", "")).toThrow(
      "VersionSourceSnapshot contentHash is required",
    );
  });

  it("should return new snapshot with added projectionId via withProjectionId", () => {
    const original = VersionSourceSnapshot.create("source-1", "hash-abc");
    const updated = original.withProjectionId("proj-1");

    // Original unchanged
    expect(original.projectionIds).toEqual([]);
    // New instance has the projection
    expect(updated.projectionIds).toEqual(["proj-1"]);
    expect(updated.sourceId).toBe("source-1");
    expect(updated.contentHash).toBe("hash-abc");
  });

  it("should chain withProjectionId calls", () => {
    const snapshot = VersionSourceSnapshot.create("source-1", "hash-abc")
      .withProjectionId("proj-1")
      .withProjectionId("proj-2");

    expect(snapshot.projectionIds).toEqual(["proj-1", "proj-2"]);
  });

  it("should support equality comparison", () => {
    const a = VersionSourceSnapshot.create("s1", "h1", ["p1"]);
    const b = VersionSourceSnapshot.create("s1", "h1", ["p1"]);

    expect(a.equals(b)).toBe(true);
  });

  it("should not be equal with different projectionIds", () => {
    const a = VersionSourceSnapshot.create("s1", "h1", ["p1"]);
    const b = VersionSourceSnapshot.create("s1", "h1", ["p2"]);

    expect(a.equals(b)).toBe(false);
  });
});
