import { describe, it, expect } from "vitest";
import { SemanticProjection } from "../SemanticProjection";
import { ProjectionId } from "../ProjectionId";
import { ProjectionType } from "../ProjectionType";
import { ProjectionStatus } from "../ProjectionStatus";
import { ProjectionResult } from "../ProjectionResult";

function makeProjection(overrides?: {
  id?: string;
  sourceId?: string;
  processingProfileId?: string;
  type?: ProjectionType;
}) {
  return SemanticProjection.create(
    ProjectionId.create(overrides?.id ?? crypto.randomUUID()),
    overrides?.sourceId ?? "source-1",
    overrides?.processingProfileId ?? "profile-1",
    overrides?.type ?? ProjectionType.Embedding,
  );
}

function makeResult() {
  return ProjectionResult.create(
    ProjectionType.Embedding,
    { chunksCount: 5, dimensions: 128, model: "hash-local" },
    "profile-1",
    1,
  );
}

describe("SemanticProjection", () => {
  describe("create", () => {
    it("should create with sourceId and processingProfileId", () => {
      const projection = makeProjection({
        sourceId: "src-abc",
        processingProfileId: "prof-xyz",
      });

      expect(projection.sourceId).toBe("src-abc");
      expect(projection.processingProfileId).toBe("prof-xyz");
      expect(projection.type).toBe(ProjectionType.Embedding);
      expect(projection.status).toBe(ProjectionStatus.Pending);
      expect(projection.result).toBeNull();
      expect(projection.error).toBeNull();
      expect(projection.createdAt).toBeInstanceOf(Date);
    });

    it("should throw when sourceId is empty", () => {
      expect(() =>
        SemanticProjection.create(
          ProjectionId.create(crypto.randomUUID()),
          "",
          "profile-1",
          ProjectionType.Embedding,
        ),
      ).toThrow("sourceId is required");
    });

    it("should throw when processingProfileId is empty", () => {
      expect(() =>
        SemanticProjection.create(
          ProjectionId.create(crypto.randomUUID()),
          "source-1",
          "",
          ProjectionType.Embedding,
        ),
      ).toThrow("processingProfileId is required");
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute with all fields", () => {
      const id = ProjectionId.create("proj-1");
      const result = makeResult();
      const createdAt = new Date("2025-01-01");

      const projection = SemanticProjection.reconstitute(
        id,
        "source-1",
        "profile-1",
        ProjectionType.Embedding,
        ProjectionStatus.Completed,
        result,
        null,
        createdAt,
      );

      expect(projection.id.value).toBe("proj-1");
      expect(projection.sourceId).toBe("source-1");
      expect(projection.processingProfileId).toBe("profile-1");
      expect(projection.status).toBe(ProjectionStatus.Completed);
      expect(projection.result).toBe(result);
      expect(projection.error).toBeNull();
      expect(projection.createdAt).toBe(createdAt);
    });
  });

  describe("state transitions", () => {
    it("Pending -> Processing", () => {
      const projection = makeProjection();
      expect(projection.status).toBe(ProjectionStatus.Pending);

      projection.markProcessing();
      expect(projection.status).toBe(ProjectionStatus.Processing);
    });

    it("Processing -> Completed", () => {
      const projection = makeProjection();
      projection.markProcessing();

      const result = makeResult();
      projection.complete(result);

      expect(projection.status).toBe(ProjectionStatus.Completed);
      expect(projection.result).toBe(result);
    });

    it("Processing -> Failed", () => {
      const projection = makeProjection();
      projection.markProcessing();

      projection.fail("embedding failed");

      expect(projection.status).toBe(ProjectionStatus.Failed);
      expect(projection.error).toBe("embedding failed");
    });

    it("should throw when marking processing from non-Pending", () => {
      const projection = makeProjection();
      projection.markProcessing();

      expect(() => projection.markProcessing()).toThrow(
        "Cannot start processing projection in status",
      );
    });

    it("should throw when completing from non-Processing", () => {
      const projection = makeProjection();

      expect(() => projection.complete(makeResult())).toThrow(
        "Cannot complete projection in status",
      );
    });

    it("should throw when failing from non-Processing", () => {
      const projection = makeProjection();

      expect(() => projection.fail("error")).toThrow(
        "Cannot fail projection in status",
      );
    });
  });

  describe("domain events", () => {
    it("should record ProjectionGenerated event on complete", () => {
      const projection = makeProjection({
        sourceId: "src-1",
        processingProfileId: "prof-1",
      });
      projection.markProcessing();
      projection.complete(makeResult());

      const events = projection.clearEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("semantic-processing.projection.generated");
      expect(events[0].payload).toMatchObject({
        sourceId: "src-1",
        processingProfileId: "prof-1",
        projectionType: ProjectionType.Embedding,
      });
    });

    it("should record ProjectionFailed event on fail", () => {
      const projection = makeProjection({
        sourceId: "src-2",
        processingProfileId: "prof-2",
      });
      projection.markProcessing();
      projection.fail("timeout");

      const events = projection.clearEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("semantic-processing.projection.failed");
      expect(events[0].payload).toMatchObject({
        sourceId: "src-2",
        processingProfileId: "prof-2",
        error: "timeout",
      });
    });

    it("should clear events after calling clearEvents", () => {
      const projection = makeProjection();
      projection.markProcessing();
      projection.complete(makeResult());

      projection.clearEvents();
      expect(projection.clearEvents()).toHaveLength(0);
    });
  });

  describe("no longer has semanticUnitId or semanticUnitVersion", () => {
    it("should not have semanticUnitId getter", () => {
      const projection = makeProjection();
      expect("semanticUnitId" in projection).toBe(false);
    });

    it("should not have semanticUnitVersion getter", () => {
      const projection = makeProjection();
      expect("semanticUnitVersion" in projection).toBe(false);
    });
  });
});
