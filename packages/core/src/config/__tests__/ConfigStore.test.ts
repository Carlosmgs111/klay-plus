import { describe, it, expect } from "vitest";
import { InMemoryConfigStore } from "../ConfigStore";
import { resolveConfigProvider } from "../ConfigProvider";

describe("InMemoryConfigStore", () => {
  it("starts empty by default", async () => {
    const store = new InMemoryConfigStore();
    expect(await store.loadAll()).toEqual({});
  });

  it("accepts initial values", async () => {
    const store = new InMemoryConfigStore({ FOO: "bar", BAZ: "qux" });
    expect(await store.loadAll()).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("set and loadAll", async () => {
    const store = new InMemoryConfigStore();
    await store.set("KEY", "value");
    expect(await store.loadAll()).toEqual({ KEY: "value" });
  });

  it("remove deletes a key", async () => {
    const store = new InMemoryConfigStore({ A: "1", B: "2" });
    await store.remove("A");
    expect(await store.loadAll()).toEqual({ B: "2" });
  });

  it("has returns true for existing keys", async () => {
    const store = new InMemoryConfigStore({ X: "y" });
    expect(await store.has("X")).toBe(true);
    expect(await store.has("MISSING")).toBe(false);
  });

  it("set overwrites existing value", async () => {
    const store = new InMemoryConfigStore({ K: "old" });
    await store.set("K", "new");
    expect(await store.loadAll()).toEqual({ K: "new" });
  });

  it("get returns value for existing key", async () => {
    const store = new InMemoryConfigStore({ KEY: "value" });
    expect(await store.get("KEY")).toBe("value");
  });

  it("get returns undefined for missing key", async () => {
    const store = new InMemoryConfigStore();
    expect(await store.get("MISSING")).toBeUndefined();
  });

  it("remove is idempotent for missing keys", async () => {
    const store = new InMemoryConfigStore();
    await store.remove("NOPE"); // should not throw
    expect(await store.loadAll()).toEqual({});
  });
});

describe("resolveConfigProvider with configStore", () => {
  it("hydrates provider from configStore", async () => {
    const store = new InMemoryConfigStore({ OPENAI_API_KEY: "sk-test" });
    const provider = await resolveConfigProvider({
      provider: "browser",
      configStore: store,
    });

    expect(provider.get("OPENAI_API_KEY")).toBe("sk-test");
  });

  it("configOverrides takes priority over configStore", async () => {
    const store = new InMemoryConfigStore({ KEY: "from-store" });
    const provider = await resolveConfigProvider({
      provider: "browser",
      configOverrides: { KEY: "from-override" },
      configStore: store,
    });

    expect(provider.get("KEY")).toBe("from-override");
  });

  it("configStore takes priority over browser fallback", async () => {
    const store = new InMemoryConfigStore({ API: "key" });
    const provider = await resolveConfigProvider({
      provider: "browser",
      configStore: store,
    });

    expect(provider.get("API")).toBe("key");
    expect(provider.has("API")).toBe(true);
  });

  it("browser fallback returns empty provider when no configStore", async () => {
    const provider = await resolveConfigProvider({
      provider: "browser",
    });

    expect(provider.get("ANYTHING")).toBeUndefined();
  });

  it("server mode with configStore uses store values", async () => {
    const store = new InMemoryConfigStore({ OPENAI_API_KEY: "sk-from-store" });
    const provider = await resolveConfigProvider({
      provider: "server",
      configStore: store,
    });

    expect(provider.get("OPENAI_API_KEY")).toBe("sk-from-store");
  });
});

describe("NeDBConfigStore", () => {
  it("starts empty", async () => {
    const { NeDBConfigStore } = await import("../ConfigStore");
    const store = new NeDBConfigStore(); // in-memory (no filename)
    expect(await store.loadAll()).toEqual({});
  });

  it("set and loadAll round-trips", async () => {
    const { NeDBConfigStore } = await import("../ConfigStore");
    const store = new NeDBConfigStore();
    await store.set("OPENAI_API_KEY", "sk-test");
    await store.set("COHERE_API_KEY", "co-test");
    expect(await store.loadAll()).toEqual({
      OPENAI_API_KEY: "sk-test",
      COHERE_API_KEY: "co-test",
    });
  });

  it("get returns value for existing key", async () => {
    const { NeDBConfigStore } = await import("../ConfigStore");
    const store = new NeDBConfigStore();
    await store.set("KEY", "value");
    expect(await store.get("KEY")).toBe("value");
  });

  it("get returns undefined for missing key", async () => {
    const { NeDBConfigStore } = await import("../ConfigStore");
    const store = new NeDBConfigStore();
    expect(await store.get("MISSING")).toBeUndefined();
  });

  it("remove deletes a key", async () => {
    const { NeDBConfigStore } = await import("../ConfigStore");
    const store = new NeDBConfigStore();
    await store.set("A", "1");
    await store.set("B", "2");
    await store.remove("A");
    expect(await store.loadAll()).toEqual({ B: "2" });
  });

  it("has returns true for existing keys", async () => {
    const { NeDBConfigStore } = await import("../ConfigStore");
    const store = new NeDBConfigStore();
    await store.set("X", "y");
    expect(await store.has("X")).toBe(true);
    expect(await store.has("MISSING")).toBe(false);
  });

  it("set overwrites existing value", async () => {
    const { NeDBConfigStore } = await import("../ConfigStore");
    const store = new NeDBConfigStore();
    await store.set("K", "old");
    await store.set("K", "new");
    expect(await store.get("K")).toBe("new");
  });
});
