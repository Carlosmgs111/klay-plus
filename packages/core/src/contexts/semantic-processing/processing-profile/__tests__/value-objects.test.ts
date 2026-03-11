// packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts
import { describe, it, expect } from "vitest";
import { PreparationLayer } from "../domain/value-objects/PreparationLayer";
import { FragmentationLayer } from "../domain/value-objects/FragmentationLayer";
import { ProjectionLayer } from "../domain/value-objects/ProjectionLayer";

describe("PreparationLayer", () => {
  it("creates with 'basic' strategy and full config", () => {
    const layer = PreparationLayer.create("basic", {
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: false,
    });
    expect(layer.strategyId).toBe("basic");
    expect(layer.config).toEqual({
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: false,
    });
  });

  it("creates with 'none' strategy and empty config", () => {
    const layer = PreparationLayer.create("none", {});
    expect(layer.strategyId).toBe("none");
    expect(layer.config).toEqual({});
  });

  it("applies defaults for 'basic' when config fields are missing", () => {
    const layer = PreparationLayer.create("basic", {});
    expect(layer.config).toEqual({
      normalizeWhitespace: true,
      normalizeEncoding: true,
      trimContent: true,
    });
  });

  it("throws for unknown strategyId", () => {
    expect(() => PreparationLayer.create("unknown" as any, {})).toThrow();
  });

  it("config is immutable", () => {
    const layer = PreparationLayer.create("basic", {});
    expect(() => {
      (layer.config as any).normalizeWhitespace = false;
    }).toThrow();
  });

  it("reconstitutes from DTO", () => {
    const layer = PreparationLayer.fromDTO({
      strategyId: "basic",
      config: { normalizeWhitespace: false, normalizeEncoding: true, trimContent: true },
    });
    expect(layer.strategyId).toBe("basic");
    expect(layer.config.normalizeWhitespace).toBe(false);
  });

  it("serializes to DTO", () => {
    const layer = PreparationLayer.create("basic", {});
    const dto = layer.toDTO();
    expect(dto).toEqual({
      strategyId: "basic",
      config: { normalizeWhitespace: true, normalizeEncoding: true, trimContent: true },
    });
  });
});

describe("FragmentationLayer", () => {
  describe("recursive strategy", () => {
    it("creates with valid config", () => {
      const layer = FragmentationLayer.create("recursive", { chunkSize: 500, overlap: 50 });
      expect(layer.strategyId).toBe("recursive");
      expect(layer.config).toEqual({ strategy: "recursive", chunkSize: 500, overlap: 50 });
    });

    it("applies defaults when config fields are missing", () => {
      const layer = FragmentationLayer.create("recursive", {});
      expect(layer.config).toEqual({ strategy: "recursive", chunkSize: 1000, overlap: 100 });
    });

    it("throws when overlap >= chunkSize", () => {
      expect(() => FragmentationLayer.create("recursive", { chunkSize: 100, overlap: 100 })).toThrow();
      expect(() => FragmentationLayer.create("recursive", { chunkSize: 100, overlap: 200 })).toThrow();
    });

    it("throws when chunkSize <= 0", () => {
      expect(() => FragmentationLayer.create("recursive", { chunkSize: 0, overlap: 0 })).toThrow();
      expect(() => FragmentationLayer.create("recursive", { chunkSize: -1, overlap: 0 })).toThrow();
    });
  });

  describe("sentence strategy", () => {
    it("creates with valid config", () => {
      const layer = FragmentationLayer.create("sentence", { maxChunkSize: 800, minChunkSize: 200 });
      expect(layer.strategyId).toBe("sentence");
      expect(layer.config).toEqual({ strategy: "sentence", maxChunkSize: 800, minChunkSize: 200 });
    });

    it("applies defaults when config fields are missing", () => {
      const layer = FragmentationLayer.create("sentence", {});
      expect(layer.config).toEqual({ strategy: "sentence", maxChunkSize: 1000, minChunkSize: 100 });
    });

    it("throws when minChunkSize >= maxChunkSize", () => {
      expect(() => FragmentationLayer.create("sentence", { maxChunkSize: 500, minChunkSize: 500 })).toThrow();
      expect(() => FragmentationLayer.create("sentence", { maxChunkSize: 300, minChunkSize: 500 })).toThrow();
    });

    it("throws when minChunkSize <= 0", () => {
      expect(() => FragmentationLayer.create("sentence", { maxChunkSize: 1000, minChunkSize: 0 })).toThrow();
      expect(() => FragmentationLayer.create("sentence", { maxChunkSize: 1000, minChunkSize: -1 })).toThrow();
    });
  });

  describe("fixed-size strategy", () => {
    it("creates with valid config", () => {
      const layer = FragmentationLayer.create("fixed-size", { chunkSize: 300, overlap: 30 });
      expect(layer.strategyId).toBe("fixed-size");
      expect(layer.config).toEqual({ strategy: "fixed-size", chunkSize: 300, overlap: 30 });
    });

    it("applies defaults when config fields are missing", () => {
      const layer = FragmentationLayer.create("fixed-size", {});
      expect(layer.config).toEqual({ strategy: "fixed-size", chunkSize: 500, overlap: 50 });
    });
  });

  it("throws for unknown strategyId", () => {
    expect(() => FragmentationLayer.create("unknown" as any, {})).toThrow();
  });

  it("config is immutable", () => {
    const layer = FragmentationLayer.create("recursive", {});
    expect(() => {
      (layer.config as any).chunkSize = 999;
    }).toThrow();
  });

  it("round-trips through DTO", () => {
    const original = FragmentationLayer.create("sentence", { maxChunkSize: 700, minChunkSize: 150 });
    const dto = original.toDTO();
    const restored = FragmentationLayer.fromDTO(dto);
    expect(restored.strategyId).toBe(original.strategyId);
    expect(restored.config).toEqual(original.config);
  });
});

describe("ProjectionLayer", () => {
  it("creates with valid config", () => {
    const layer = ProjectionLayer.create("text-embedding-3-small", { dimensions: 256, batchSize: 50 });
    expect(layer.strategyId).toBe("text-embedding-3-small");
    expect(layer.config).toEqual({ dimensions: 256, batchSize: 50 });
  });

  it("applies defaults for missing fields", () => {
    const layer = ProjectionLayer.create("text-embedding-3-small", {});
    expect(layer.config).toEqual({ dimensions: 128, batchSize: 100 });
  });

  it("throws when dimensions <= 0", () => {
    expect(() => ProjectionLayer.create("model", { dimensions: 0, batchSize: 10 })).toThrow();
    expect(() => ProjectionLayer.create("model", { dimensions: -1, batchSize: 10 })).toThrow();
  });

  it("throws when batchSize <= 0", () => {
    expect(() => ProjectionLayer.create("model", { dimensions: 128, batchSize: 0 })).toThrow();
    expect(() => ProjectionLayer.create("model", { dimensions: 128, batchSize: -5 })).toThrow();
  });

  it("accepts any non-empty strategyId", () => {
    expect(() => ProjectionLayer.create("openai/text-embedding-3-large", {})).not.toThrow();
    expect(() => ProjectionLayer.create("nomic-embed-text-v1.5", {})).not.toThrow();
    expect(() => ProjectionLayer.create("webllm", {})).not.toThrow();
  });

  it("throws for empty strategyId", () => {
    expect(() => ProjectionLayer.create("", {})).toThrow();
  });

  it("config is immutable", () => {
    const layer = ProjectionLayer.create("model", {});
    expect(() => {
      (layer.config as any).dimensions = 999;
    }).toThrow();
  });

  it("round-trips through DTO", () => {
    const original = ProjectionLayer.create("text-embedding-ada-002", { dimensions: 512, batchSize: 32 });
    const dto = original.toDTO();
    const restored = ProjectionLayer.fromDTO(dto);
    expect(restored.strategyId).toBe(original.strategyId);
    expect(restored.config).toEqual(original.config);
  });
});
