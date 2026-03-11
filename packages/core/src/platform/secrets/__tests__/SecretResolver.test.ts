import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SecretResolver } from "../SecretResolver";
import { InMemorySecretStore } from "../InMemorySecretStore";

describe("SecretResolver", () => {
  let store: InMemorySecretStore;
  let resolver: SecretResolver;

  beforeEach(() => {
    store = new InMemorySecretStore();
    resolver = new SecretResolver(store);
  });

  it("resolves from SecretStore first", async () => {
    await store.set("API_KEY", "from-store");
    expect(await resolver.resolve("API_KEY")).toBe("from-store");
  });

  it("falls back to env vars when not in store", async () => {
    vi.stubEnv("API_KEY", "from-env");
    expect(await resolver.resolve("API_KEY")).toBe("from-env");
    vi.unstubAllEnvs();
  });

  it("returns undefined when key not found anywhere", async () => {
    expect(await resolver.resolve("MISSING")).toBeUndefined();
  });

  it("prefers SecretStore over env vars", async () => {
    await store.set("API_KEY", "from-store");
    vi.stubEnv("API_KEY", "from-env");
    expect(await resolver.resolve("API_KEY")).toBe("from-store");
    vi.unstubAllEnvs();
  });

  it("require() throws with descriptive message when missing", async () => {
    await expect(resolver.require("MISSING_KEY")).rejects.toThrow(
      'Missing credential: "MISSING_KEY". Set it via the dashboard (Credentials) or as an environment variable.'
    );
  });

  it("require() returns value when present", async () => {
    await store.set("KEY", "val");
    expect(await resolver.require("KEY")).toBe("val");
  });

  it("resolves multiple keys", async () => {
    await store.set("A", "val-a");
    vi.stubEnv("B", "val-b");
    const result = await resolver.resolveMultiple(["A", "B", "MISSING"]);
    expect(result).toEqual({ A: "val-a", B: "val-b" });
    vi.unstubAllEnvs();
  });
});
