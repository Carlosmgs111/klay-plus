import { describe, it, expect } from "vitest";
import { NoOpPreparationStrategy } from "../infrastructure/strategies/preparation/NoOpPreparationStrategy";
import { BasicPreparationStrategy } from "../infrastructure/strategies/preparation/BasicPreparationStrategy";

describe("NoOpPreparationStrategy", () => {
  it("returns content unchanged", async () => {
    const strategy = new NoOpPreparationStrategy();
    const result = await strategy.prepare("  hello   world  \n\n");
    expect(result).toBe("  hello   world  \n\n");
  });

  it("has strategyId 'none'", () => {
    expect(new NoOpPreparationStrategy().strategyId).toBe("none");
  });

  it("has version 1", () => {
    expect(new NoOpPreparationStrategy().version).toBe(1);
  });
});

describe("BasicPreparationStrategy", () => {
  it("normalizes whitespace when enabled", async () => {
    const strategy = new BasicPreparationStrategy({
      normalizeWhitespace: true, normalizeEncoding: false, trimContent: false,
    });
    const result = await strategy.prepare("hello   world\n\n\nparagraph");
    expect(result).toBe("hello world\n\nparagraph");
  });

  it("trims content when enabled", async () => {
    const strategy = new BasicPreparationStrategy({
      normalizeWhitespace: false, normalizeEncoding: false, trimContent: true,
    });
    expect(await strategy.prepare("  hello  ")).toBe("hello");
  });

  it("normalizes encoding (\\r\\n to \\n)", async () => {
    const strategy = new BasicPreparationStrategy({
      normalizeWhitespace: false, normalizeEncoding: true, trimContent: false,
    });
    expect(await strategy.prepare("hello\r\nworld\rend")).toBe("hello\nworld\nend");
  });

  it("applies all transforms together", async () => {
    const strategy = new BasicPreparationStrategy({
      normalizeWhitespace: true, normalizeEncoding: true, trimContent: true,
    });
    const result = await strategy.prepare("  hello   world  \n\n\n  foo  ");
    expect(result).toBe("hello world\n\nfoo");
  });

  it("does nothing when all options disabled", async () => {
    const strategy = new BasicPreparationStrategy({
      normalizeWhitespace: false, normalizeEncoding: false, trimContent: false,
    });
    const input = "  hello   world  ";
    expect(await strategy.prepare(input)).toBe(input);
  });

  it("has strategyId 'basic'", () => {
    const s = new BasicPreparationStrategy({ normalizeWhitespace: true, normalizeEncoding: true, trimContent: true });
    expect(s.strategyId).toBe("basic");
  });

  it("has version 1", () => {
    const s = new BasicPreparationStrategy({ normalizeWhitespace: true, normalizeEncoding: true, trimContent: true });
    expect(s.version).toBe(1);
  });
});
