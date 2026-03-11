// packages/core/src/contexts/semantic-processing/processing-profile/__tests__/value-objects.test.ts
import { describe, it, expect } from "vitest";
import { PreparationLayer } from "../domain/value-objects/PreparationLayer";

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
