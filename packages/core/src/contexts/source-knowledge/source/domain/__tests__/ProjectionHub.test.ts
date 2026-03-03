import { describe, it, expect } from "vitest";
import { ProjectionHub, ProjectionEntry } from "../ProjectionHub";

describe("ProjectionHub", () => {
  const makeEntry = (
    profileId: string,
    overrides: Partial<ProjectionEntry> = {},
  ): ProjectionEntry => ({
    projectionId: `proj-${profileId}`,
    profileId,
    status: "COMPLETED",
    generatedAt: new Date("2025-01-01"),
    ...overrides,
  });

  describe("create()", () => {
    it("creates empty hub with no projections", () => {
      const hub = ProjectionHub.create();

      expect(hub.projections).toEqual([]);
    });
  });

  describe("hasProjectionForProfile", () => {
    it("returns false when empty", () => {
      const hub = ProjectionHub.create();

      expect(hub.hasProjectionForProfile("profile-1")).toBe(false);
    });

    it("returns true when projection exists for profile", () => {
      const hub = ProjectionHub.create().withProjection(makeEntry("profile-1"));

      expect(hub.hasProjectionForProfile("profile-1")).toBe(true);
    });
  });

  describe("withProjection", () => {
    it("adds a projection entry and returns a new hub (immutable)", () => {
      const original = ProjectionHub.create();
      const entry = makeEntry("profile-1");

      const updated = original.withProjection(entry);

      expect(updated).not.toBe(original);
      expect(updated.projections).toHaveLength(1);
      expect(updated.projections[0]).toEqual(entry);
      expect(original.projections).toHaveLength(0);
    });

    it("replaces projection for same profileId (no duplicates)", () => {
      const entry1 = makeEntry("profile-1", { status: "PENDING" });
      const entry2 = makeEntry("profile-1", {
        projectionId: "proj-new",
        status: "COMPLETED",
        generatedAt: new Date("2025-06-01"),
      });

      const hub = ProjectionHub.create()
        .withProjection(entry1)
        .withProjection(entry2);

      expect(hub.projections).toHaveLength(1);
      expect(hub.projections[0].projectionId).toBe("proj-new");
      expect(hub.projections[0].status).toBe("COMPLETED");
    });

    it("accumulates projections for different profiles", () => {
      const hub = ProjectionHub.create()
        .withProjection(makeEntry("profile-a"))
        .withProjection(makeEntry("profile-b"))
        .withProjection(makeEntry("profile-c"));

      expect(hub.projections).toHaveLength(3);
    });
  });

  describe("getProjectionForProfile", () => {
    it("returns the entry when it exists", () => {
      const entry = makeEntry("profile-1");
      const hub = ProjectionHub.create().withProjection(entry);

      expect(hub.getProjectionForProfile("profile-1")).toEqual(entry);
    });

    it("returns undefined when profile not found", () => {
      const hub = ProjectionHub.create();

      expect(hub.getProjectionForProfile("nonexistent")).toBeUndefined();
    });
  });

  describe("reconstitute", () => {
    it("hydrates from persistence data", () => {
      const entries: ProjectionEntry[] = [
        makeEntry("profile-1"),
        makeEntry("profile-2", { status: "PROCESSING" }),
      ];

      const hub = ProjectionHub.reconstitute(entries);

      expect(hub.projections).toHaveLength(2);
      expect(hub.getProjectionForProfile("profile-1")?.status).toBe("COMPLETED");
      expect(hub.getProjectionForProfile("profile-2")?.status).toBe("PROCESSING");
    });

    it("hydrates empty array", () => {
      const hub = ProjectionHub.reconstitute([]);

      expect(hub.projections).toEqual([]);
    });
  });

  describe("equality", () => {
    it("two hubs with same projections are equal", () => {
      const entries = [makeEntry("profile-1")];
      const a = ProjectionHub.reconstitute(entries);
      const b = ProjectionHub.reconstitute(entries);

      expect(a.equals(b)).toBe(true);
    });

    it("two hubs with different projections are not equal", () => {
      const a = ProjectionHub.reconstitute([makeEntry("profile-1")]);
      const b = ProjectionHub.reconstitute([makeEntry("profile-2")]);

      expect(a.equals(b)).toBe(false);
    });
  });
});
