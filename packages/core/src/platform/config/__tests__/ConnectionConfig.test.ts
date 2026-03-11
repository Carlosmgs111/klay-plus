import { describe, it, expect } from "vitest";
import type { ConnectionConfig, LocalConnection, NetworkConnection, EmbeddedConnection } from "../ConnectionConfig";

describe("ConnectionConfig", () => {
  it("models a local file-based connection", () => {
    const conn: LocalConnection = { kind: "local", path: "./data" };
    expect(conn.kind).toBe("local");
    expect(conn.path).toBe("./data");
  });

  it("models a network connection with url", () => {
    const conn: NetworkConnection = { kind: "network", url: "postgresql://localhost:5432/klay" };
    expect(conn.kind).toBe("network");
    expect(conn.url).toBe("postgresql://localhost:5432/klay");
  });

  it("models a network connection with host+port", () => {
    const conn: NetworkConnection = { kind: "network", host: "db.example.com", port: 5432, ssl: true };
    expect(conn.kind).toBe("network");
    expect(conn.host).toBe("db.example.com");
    expect(conn.port).toBe(5432);
    expect(conn.ssl).toBe(true);
  });

  it("models an embedded connection", () => {
    const conn: EmbeddedConnection = { kind: "embedded", databaseName: "klay-config" };
    expect(conn.kind).toBe("embedded");
    expect(conn.databaseName).toBe("klay-config");
  });

  it("discriminates via kind field", () => {
    const conn: ConnectionConfig = { kind: "network", host: "localhost", port: 27017 };
    switch (conn.kind) {
      case "local": expect(conn.path).toBeDefined(); break;
      case "network": expect(conn.host).toBe("localhost"); break;
      case "embedded": expect(conn.databaseName).toBeDefined(); break;
    }
  });
});
