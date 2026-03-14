import { describe, it, expect } from "vitest";
import type { DocumentStorageConfig } from "../InfrastructureProfile";

describe("DocumentStorageConfig", () => {
  it("models in-memory storage", () => {
    const cfg: DocumentStorageConfig = { type: "in-memory" };
    expect(cfg.type).toBe("in-memory");
  });

  it("models local filesystem storage", () => {
    const cfg: DocumentStorageConfig = { type: "local", basePath: "./data/uploads" };
    if (cfg.type === "local") expect(cfg.basePath).toBe("./data/uploads");
  });

  it("models browser storage", () => {
    const cfg: DocumentStorageConfig = { type: "browser" };
    expect(cfg.type).toBe("browser");
  });
});
