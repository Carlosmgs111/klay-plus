import { describe, it, expect } from "vitest";
import { InMemoryConfigStore } from "../InMemoryConfigStore";
import {
  resolveInfrastructureProfile,
  saveProfileToStore,
  INFRA_PROFILE_KEY,
} from "../resolveInfrastructureProfile";
import type { InfrastructureProfile } from "../InfrastructureProfile";
import { DEFAULT_PROFILES } from "../InfrastructureProfile";

describe("resolveInfrastructureProfile", () => {
  it("expands provider 'browser' to full browser profile", async () => {
    const profile = await resolveInfrastructureProfile({ provider: "browser" });

    expect(profile).toEqual(DEFAULT_PROFILES["browser"]);
  });

  it("expands provider 'in-memory' to full in-memory profile", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "in-memory",
    });

    expect(profile).toEqual(DEFAULT_PROFILES["in-memory"]);
  });

  it("expands provider 'server' to full server profile", async () => {
    const profile = await resolveInfrastructureProfile({ provider: "server" });

    expect(profile).toEqual(DEFAULT_PROFILES["server"]);
  });

  it("falls back to in-memory for unknown provider", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "unknown",
    });

    expect(profile.persistence).toBe("in-memory");
  });

  it("partial infrastructure override only changes specified axis", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      infrastructure: { embedding: "openai" },
    });

    expect(profile.persistence).toBe("browser");
    expect(profile.vectorStore).toBe("browser");
    expect(profile.documentStorage).toBe("browser");
    expect(profile.embedding).toBe("openai");
  });

  it("legacy embeddingProvider maps to embedding axis", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      embeddingProvider: "openai",
    });

    expect(profile.embedding).toBe("openai");
    expect(profile.persistence).toBe("browser");
  });

  it("legacy embeddingModel and embeddingDimensions are layered", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      embeddingProvider: "openai",
      embeddingModel: "text-embedding-3-small",
      embeddingDimensions: 1536,
    });

    expect(profile.embedding).toBe("openai");
    expect(profile.embeddingModel).toBe("text-embedding-3-small");
    expect(profile.embeddingDimensions).toBe(1536);
  });

  it("explicit infrastructure overrides take priority over legacy fields", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      embeddingProvider: "openai",
      infrastructure: { embedding: "cohere" },
    });

    expect(profile.embedding).toBe("cohere");
  });

  it("ConfigStore persistence is loaded and applied", async () => {
    const store = new InMemoryConfigStore();
    const persisted: Partial<InfrastructureProfile> = {
      embedding: "openai",
      embeddingModel: "text-embedding-3-large",
    };
    await store.set(INFRA_PROFILE_KEY, JSON.stringify(persisted));

    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      configStore: store,
    });

    expect(profile.embedding).toBe("openai");
    expect(profile.embeddingModel).toBe("text-embedding-3-large");
    expect(profile.persistence).toBe("browser");
  });

  it("explicit infrastructure overrides take priority over ConfigStore", async () => {
    const store = new InMemoryConfigStore();
    await store.set(
      INFRA_PROFILE_KEY,
      JSON.stringify({ embedding: "openai" }),
    );

    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      configStore: store,
      infrastructure: { embedding: "cohere" },
    });

    expect(profile.embedding).toBe("cohere");
  });

  it("ConfigStore priority: explicit > configStore > legacy > defaults", async () => {
    const store = new InMemoryConfigStore();
    await store.set(
      INFRA_PROFILE_KEY,
      JSON.stringify({ embedding: "from-store", vectorStore: "from-store" }),
    );

    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      embeddingProvider: "from-legacy",
      configStore: store,
      infrastructure: { embedding: "from-explicit" },
    });

    // explicit > configStore > legacy > defaults
    expect(profile.embedding).toBe("from-explicit");
    // configStore overrides default for vectorStore
    expect(profile.vectorStore).toBe("from-store");
    // persistence stays from defaults
    expect(profile.persistence).toBe("browser");
  });
});

describe("saveProfileToStore + load roundtrip", () => {
  it("persists and reloads a profile", async () => {
    const store = new InMemoryConfigStore();
    const profile: InfrastructureProfile = {
      persistence: "browser",
      vectorStore: "server",
      documentStorage: "browser",
      embedding: "openai",
      embeddingModel: "text-embedding-3-small",
      embeddingDimensions: 1536,
    };

    await saveProfileToStore(store, profile);
    const loaded = await resolveInfrastructureProfile({
      provider: "in-memory", // base will be overridden by stored profile
      configStore: store,
    });

    expect(loaded.persistence).toBe("browser");
    expect(loaded.vectorStore).toBe("server");
    expect(loaded.documentStorage).toBe("browser");
    expect(loaded.embedding).toBe("openai");
    expect(loaded.embeddingModel).toBe("text-embedding-3-small");
    expect(loaded.embeddingDimensions).toBe(1536);
  });
});
