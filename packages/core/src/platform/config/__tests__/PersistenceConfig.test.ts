import { describe, it, expect } from "vitest";
import type { PersistenceConfig } from "../PersistenceConfig";

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

  it("models PostgreSQL persistence with full config", () => {
    const cfg: PersistenceConfig = {
      type: "postgresql",
      connection: { kind: "network", host: "db.example.com", port: 5432, ssl: true },
      authRef: "PG_CREDENTIALS",
      database: "klay_prod",
      schema: "public",
      pool: { min: 2, max: 10, idleTimeoutMs: 30000 },
    };
    expect(cfg.type).toBe("postgresql");
    if (cfg.type === "postgresql") {
      expect(cfg.database).toBe("klay_prod");
      expect(cfg.connection.kind).toBe("network");
      expect(cfg.pool?.max).toBe(10);
    }
  });

  it("models MongoDB persistence", () => {
    const cfg: PersistenceConfig = {
      type: "mongodb",
      connection: { kind: "network", url: "mongodb://localhost:27017" },
      database: "klay",
      authRef: "MONGO_CREDENTIALS",
      authSource: "admin",
    };
    expect(cfg.type).toBe("mongodb");
    if (cfg.type === "mongodb") {
      expect(cfg.authSource).toBe("admin");
    }
  });

  it("models SQLite persistence", () => {
    const cfg: PersistenceConfig = { type: "sqlite", path: "./data/klay.db" };
    expect(cfg.type).toBe("sqlite");
  });
});
