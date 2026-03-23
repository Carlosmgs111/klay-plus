import { describe, it, expect } from "vitest";
import type { PersistenceConfig } from "../InfrastructureProfile";

describe("PersistenceConfig", () => {
  it("models in-memory persistence", () => {
    const cfg: PersistenceConfig = { type: "in-memory" };
    expect(cfg.type).toBe("in-memory");
  });

  it("models IndexedDB persistence", () => {
    const cfg: PersistenceConfig = { type: "indexeddb", databaseName: "klay" };
    expect(cfg.type).toBe("indexeddb");
  });

  it("models NeDB persistence", () => {
    const cfg: PersistenceConfig = { type: "nedb", path: "./data" };
    expect(cfg.type).toBe("nedb");
  });
});
