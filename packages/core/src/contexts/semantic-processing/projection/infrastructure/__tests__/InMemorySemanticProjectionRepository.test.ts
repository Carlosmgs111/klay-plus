import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySemanticProjectionRepository } from "../persistence/InMemorySemanticProjectionRepository";
import { SemanticProjection } from "../../domain/SemanticProjection";
import { ProjectionId } from "../../domain/ProjectionId";
import { ProjectionType } from "../../domain/ProjectionType";
import { ProjectionStatus } from "../../domain/ProjectionStatus";
import { ProjectionResult } from "../../domain/ProjectionResult";

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

describe("InMemorySemanticProjectionRepository", () => {
  let repo: InMemorySemanticProjectionRepository;

  beforeEach(() => {
    repo = new InMemorySemanticProjectionRepository();
  });

  it("should save and retrieve by id", async () => {
    const projection = makeProjection({ id: "proj-1" });
    await repo.save(projection);

    const found = await repo.findById(ProjectionId.create("proj-1"));
    expect(found).not.toBeNull();
    expect(found!.id.value).toBe("proj-1");
  });

  it("should find by sourceId", async () => {
    await repo.save(makeProjection({ id: "p1", sourceId: "src-A" }));
    await repo.save(makeProjection({ id: "p2", sourceId: "src-A" }));
    await repo.save(makeProjection({ id: "p3", sourceId: "src-B" }));

    const results = await repo.findBySourceId("src-A");
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id.value).sort()).toEqual(["p1", "p2"]);
  });

  it("should find by sourceId and profileId", async () => {
    await repo.save(makeProjection({ id: "p1", sourceId: "src-A", processingProfileId: "prof-1" }));
    await repo.save(makeProjection({ id: "p2", sourceId: "src-A", processingProfileId: "prof-2" }));
    await repo.save(makeProjection({ id: "p3", sourceId: "src-B", processingProfileId: "prof-1" }));

    const result = await repo.findBySourceIdAndProfileId("src-A", "prof-1");
    expect(result).not.toBeNull();
    expect(result!.id.value).toBe("p1");

    const noMatch = await repo.findBySourceIdAndProfileId("src-A", "prof-999");
    expect(noMatch).toBeNull();
  });

  it("should find by status", async () => {
    const p1 = makeProjection({ id: "p1" });
    const p2 = makeProjection({ id: "p2" });
    p2.markProcessing();

    await repo.save(p1);
    await repo.save(p2);

    const pending = await repo.findByStatus(ProjectionStatus.Pending);
    expect(pending).toHaveLength(1);
    expect(pending[0].id.value).toBe("p1");

    const processing = await repo.findByStatus(ProjectionStatus.Processing);
    expect(processing).toHaveLength(1);
    expect(processing[0].id.value).toBe("p2");
  });

  it("should delete by sourceId", async () => {
    await repo.save(makeProjection({ id: "p1", sourceId: "src-A" }));
    await repo.save(makeProjection({ id: "p2", sourceId: "src-A" }));
    await repo.save(makeProjection({ id: "p3", sourceId: "src-B" }));

    await repo.deleteBySourceId("src-A");

    const remainingA = await repo.findBySourceId("src-A");
    expect(remainingA).toHaveLength(0);

    const remainingB = await repo.findBySourceId("src-B");
    expect(remainingB).toHaveLength(1);
  });

  it("should return empty arrays when nothing matches", async () => {
    const bySource = await repo.findBySourceId("nonexistent");
    expect(bySource).toEqual([]);

    const byStatus = await repo.findByStatus(ProjectionStatus.Failed);
    expect(byStatus).toEqual([]);
  });
});
