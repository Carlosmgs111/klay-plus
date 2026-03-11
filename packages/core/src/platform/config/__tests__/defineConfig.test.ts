import { describe, it, expect } from "vitest";
import { defineConfig } from "../defineConfig";

describe("defineConfig", () => {
  it("returns the config object as-is (type helper)", () => {
    const config = defineConfig({
      profiles: {
        dev: {
          persistence: { type: "nedb", path: "./data" },
          vectorStore: { type: "nedb", dimensions: 128, path: "./data" },
          embedding: { type: "hash", dimensions: 128 },
          documentStorage: { type: "local", basePath: "./data/uploads" },
        },
      },
    });
    expect(config.profiles.dev.persistence.type).toBe("nedb");
    expect(Object.keys(config.profiles)).toEqual(["dev"]);
  });
});
