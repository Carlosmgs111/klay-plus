import { describe, it, expect } from "vitest";
import { fromDTO, toDTO } from "../infrastructure/persistence/indexeddb/ProfileDTO";
import { ProcessingProfile } from "../domain/ProcessingProfile";
import { ProcessingProfileId } from "../domain/ProcessingProfileId";
import { PreparationLayer } from "../domain/value-objects/PreparationLayer";
import { FragmentationLayer } from "../domain/value-objects/FragmentationLayer";
import { ProjectionLayer } from "../domain/value-objects/ProjectionLayer";

describe("ProfileDTO", () => {
  describe("legacy migration (fromDTO)", () => {
    it("migrates legacy DTO with chunkingStrategyId to new format", () => {
      const legacyDTO = {
        id: "test-id",
        name: "Legacy Profile",
        version: 1,
        status: "ACTIVE",
        chunkingStrategyId: "recursive",
        embeddingStrategyId: "hash-embedding",
        configuration: {},
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      const profile = fromDTO(legacyDTO as any);
      expect(profile.preparation.strategyId).toBe("basic");
      expect(profile.fragmentation.strategyId).toBe("recursive");
      expect(profile.fragmentation.config).toEqual({ strategy: "recursive", chunkSize: 1000, overlap: 100 });
      expect(profile.projection.strategyId).toBe("hash-embedding");
    });

    it("migrates legacy sentence strategy with correct defaults", () => {
      const legacyDTO = {
        id: "test-id-2",
        name: "Sentence Profile",
        version: 1,
        status: "ACTIVE",
        chunkingStrategyId: "sentence",
        embeddingStrategyId: "hash-embedding",
        configuration: {},
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      const profile = fromDTO(legacyDTO as any);
      expect(profile.fragmentation.config).toEqual({ strategy: "sentence", maxChunkSize: 1000, minChunkSize: 100 });
    });

    it("migrates legacy fixed-size strategy", () => {
      const legacyDTO = {
        id: "test-id-3",
        name: "Fixed Profile",
        version: 1,
        status: "ACTIVE",
        chunkingStrategyId: "fixed-size",
        embeddingStrategyId: "hash-embedding",
        configuration: {},
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      const profile = fromDTO(legacyDTO as any);
      expect(profile.fragmentation.config).toEqual({ strategy: "fixed-size", chunkSize: 500, overlap: 50 });
    });
  });

  describe("new format round-trip", () => {
    it("round-trips a profile through toDTO/fromDTO", () => {
      const profile = ProcessingProfile.create({
        id: ProcessingProfileId.create(crypto.randomUUID()),
        name: "Round Trip",
        preparation: PreparationLayer.create("basic", {}),
        fragmentation: FragmentationLayer.create("fixed-size", { strategy: "fixed-size", chunkSize: 300, overlap: 30 }),
        projection: ProjectionLayer.create("hash-embedding", { dimensions: 64 }),
      });
      const dto = toDTO(profile);
      const restored = fromDTO(dto);
      expect(restored.name).toBe("Round Trip");
      expect(restored.preparation.strategyId).toBe("basic");
      expect(restored.fragmentation.strategyId).toBe("fixed-size");
      expect(restored.fragmentation.config).toEqual({ strategy: "fixed-size", chunkSize: 300, overlap: 30 });
      expect(restored.projection.config.dimensions).toBe(64);
    });
  });
});
