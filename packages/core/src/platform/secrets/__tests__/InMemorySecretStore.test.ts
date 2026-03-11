import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySecretStore } from "../InMemorySecretStore";

describe("InMemorySecretStore", () => {
  let store: InMemorySecretStore;

  beforeEach(() => {
    store = new InMemorySecretStore();
  });

  it("stores and retrieves a secret", async () => {
    await store.set("API_KEY", "sk-abc123");
    expect(await store.get("API_KEY")).toBe("sk-abc123");
  });

  it("returns undefined for missing keys", async () => {
    expect(await store.get("MISSING")).toBeUndefined();
  });

  it("checks existence", async () => {
    await store.set("API_KEY", "value");
    expect(await store.exists("API_KEY")).toBe(true);
    expect(await store.exists("MISSING")).toBe(false);
  });

  it("removes a secret", async () => {
    await store.set("API_KEY", "value");
    await store.remove("API_KEY");
    expect(await store.exists("API_KEY")).toBe(false);
  });

  it("overwrites existing value", async () => {
    await store.set("API_KEY", "old");
    await store.set("API_KEY", "new");
    expect(await store.get("API_KEY")).toBe("new");
  });

  it("lists secrets without values", async () => {
    await store.set("KEY_A", "val-a", { name: "Key A", category: "api-key", provider: "openai" });
    await store.set("KEY_B", "val-b");
    const list = await store.list();
    expect(list).toHaveLength(2);
    expect(list[0].key).toBe("KEY_A");
    expect(list[0].name).toBe("Key A");
    expect(list[0].provider).toBe("openai");
    expect((list[0] as any).value).toBeUndefined();
  });

  it("retrieves metadata for a specific secret", async () => {
    await store.set("KEY", "val", { name: "My Key", category: "api-key", provider: "openai" });
    const meta = await store.getMetadata("KEY");
    expect(meta?.name).toBe("My Key");
    expect(meta?.category).toBe("api-key");
    expect(await store.getMetadata("MISSING")).toBeUndefined();
  });

  it("retrieves multiple secrets at once", async () => {
    await store.set("A", "val-a");
    await store.set("B", "val-b");
    const result = await store.getMultiple(["A", "B", "MISSING"]);
    expect(result).toEqual({ A: "val-a", B: "val-b" });
  });

  it("accepts initial entries", async () => {
    const store = new InMemorySecretStore({ KEY: "value" });
    expect(await store.get("KEY")).toBe("value");
  });
});
