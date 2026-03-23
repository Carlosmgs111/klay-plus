import { describe, it, expect } from "vitest";
import { InMemoryConfigStore } from "../ConfigStore";
import {
  resolveInfrastructureProfile,
  saveProfileToStore,
  INFRA_PROFILE_KEY,
} from "../profileResolution";
import type { InfrastructureProfile } from "../InfrastructureProfile";
import { PRESET_PROFILES } from "../InfrastructureProfile";

describe("PRESET_PROFILES", () => {
  it("in-memory preset has correct typed shape", () => {
    const p = PRESET_PROFILES["in-memory"];
    expect(p.id).toBe("in-memory");
    expect(p.persistence).toEqual({ type: "in-memory" });
    expect(p.vectorStore).toEqual({ type: "in-memory", dimensions: 128 });
    expect(p.embedding).toEqual({ type: "hash", dimensions: 128 });
    expect(p.documentStorage).toEqual({ type: "in-memory" });
  });

  it("browser preset has correct typed shape", () => {
    const p = PRESET_PROFILES["browser"];
    expect(p.id).toBe("browser");
    expect(p.persistence).toEqual({ type: "indexeddb" });
    expect(p.vectorStore).toEqual({ type: "indexeddb", dimensions: 384 });
    expect(p.embedding).toEqual({ type: "huggingface", model: "Xenova/all-MiniLM-L6-v2" });
    expect(p.documentStorage).toEqual({ type: "browser" });
  });

  it("server preset has correct typed shape", () => {
    const p = PRESET_PROFILES["server"];
    expect(p.id).toBe("server");
    expect(p.persistence).toEqual({ type: "nedb" });
    expect(p.vectorStore).toEqual({ type: "nedb", dimensions: 384 });
    expect(p.embedding).toEqual({ type: "huggingface", model: "Xenova/all-MiniLM-L6-v2" });
    expect(p.documentStorage).toEqual({ type: "local", basePath: "./data/uploads" });
  });
});

describe("resolveInfrastructureProfile", () => {
  it("expands provider 'browser' to full browser profile", async () => {
    const profile = await resolveInfrastructureProfile({ provider: "browser" });

    expect(profile).toEqual(PRESET_PROFILES["browser"]);
  });

  it("expands provider 'in-memory' to full in-memory profile", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "in-memory",
    });

    expect(profile).toEqual(PRESET_PROFILES["in-memory"]);
  });

  it("expands provider 'server' to full server profile", async () => {
    const profile = await resolveInfrastructureProfile({ provider: "server" });

    expect(profile).toEqual(PRESET_PROFILES["server"]);
  });

  it("falls back to in-memory for unknown provider", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "unknown",
    });

    expect(profile.persistence).toEqual({ type: "in-memory" });
  });

  it("partial infrastructure override only changes specified axis", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      infrastructure: { embedding: { type: "openai", authRef: "openai-key", model: "text-embedding-3-small" } },
    });

    expect(profile.persistence).toEqual({ type: "indexeddb" });
    expect(profile.vectorStore).toEqual({ type: "indexeddb", dimensions: 384 });
    expect(profile.documentStorage).toEqual({ type: "browser" });
    expect(profile.embedding).toEqual({ type: "openai", authRef: "openai-key", model: "text-embedding-3-small" });
  });

  it("legacy embeddingProvider maps to embedding type", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      embeddingProvider: "openai",
    });

    expect(profile.embedding.type).toBe("openai");
    expect(profile.persistence).toEqual({ type: "indexeddb" });
  });

  it("legacy embeddingModel and embeddingDimensions are layered", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      embeddingProvider: "openai",
      embeddingModel: "text-embedding-3-small",
      embeddingDimensions: 1536,
    });

    expect(profile.embedding.type).toBe("openai");
    expect((profile.embedding as any).model).toBe("text-embedding-3-small");
    expect((profile.embedding as any).dimensions).toBe(1536);
  });

  it("explicit infrastructure overrides take priority over legacy fields", async () => {
    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      embeddingProvider: "openai",
      infrastructure: { embedding: { type: "cohere", authRef: "cohere-key", model: "embed-multilingual-v3.0" } },
    });

    expect(profile.embedding.type).toBe("cohere");
  });

  it("ConfigStore persistence is loaded and applied", async () => {
    const store = new InMemoryConfigStore();
    const persisted: Partial<InfrastructureProfile> = {
      embedding: { type: "openai", authRef: "openai-key", model: "text-embedding-3-large" },
    };
    await store.set(INFRA_PROFILE_KEY, JSON.stringify(persisted));

    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      configStore: store,
    });

    expect(profile.embedding.type).toBe("openai");
    expect((profile.embedding as any).model).toBe("text-embedding-3-large");
    expect(profile.persistence).toEqual({ type: "indexeddb" });
  });

  it("explicit infrastructure overrides take priority over ConfigStore", async () => {
    const store = new InMemoryConfigStore();
    await store.set(
      INFRA_PROFILE_KEY,
      JSON.stringify({ embedding: { type: "openai", authRef: "key", model: "m" } }),
    );

    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      configStore: store,
      infrastructure: { embedding: { type: "cohere", authRef: "cohere-key", model: "embed-multilingual-v3.0" } },
    });

    expect(profile.embedding.type).toBe("cohere");
  });

  it("ConfigStore priority: explicit > configStore > legacy > defaults", async () => {
    const store = new InMemoryConfigStore();
    await store.set(
      INFRA_PROFILE_KEY,
      JSON.stringify({
        embedding: { type: "hash", dimensions: 256 },
        vectorStore: { type: "in-memory", dimensions: 256 },
      }),
    );

    const profile = await resolveInfrastructureProfile({
      provider: "browser",
      embeddingProvider: "from-legacy",
      configStore: store,
      infrastructure: { embedding: { type: "hash", dimensions: 512 } },
    });

    // explicit > configStore > legacy > defaults
    expect(profile.embedding).toEqual({ type: "hash", dimensions: 512 });
    // configStore overrides default for vectorStore
    expect(profile.vectorStore).toEqual({ type: "in-memory", dimensions: 256 });
    // persistence stays from defaults
    expect(profile.persistence).toEqual({ type: "indexeddb" });
  });
});

describe("mergeProfile retrieval round-trips", () => {
  it("preserves retrieval from partial when base has none", async () => {
    // Base preset (in-memory) has no retrieval field.
    // The explicit infrastructure override carries retrieval config.
    const profile = await resolveInfrastructureProfile({
      provider: "in-memory",
      infrastructure: { retrieval: { ranking: "mmr", mmrLambda: 0.7 } },
    });

    expect(profile.retrieval).toEqual({ ranking: "mmr", mmrLambda: 0.7 });
  });

  it("uses base.retrieval when partial has none", async () => {
    // We store a profile with retrieval into ConfigStore (acts as "base" layer),
    // then resolve without any infrastructure override — partial has no retrieval.
    const store = new InMemoryConfigStore();
    const persisted: Partial<InfrastructureProfile> = {
      retrieval: { search: "hybrid" },
    };
    await store.set(INFRA_PROFILE_KEY, JSON.stringify(persisted));

    const profile = await resolveInfrastructureProfile({
      provider: "in-memory",
      configStore: store,
      // no infrastructure override → partial passed to mergeProfile has no retrieval
    });

    expect(profile.retrieval).toEqual({ search: "hybrid" });
  });

  it("resolveInfrastructureProfile round-trips a full retrieval config", async () => {
    const retrievalConfig = { ranking: "mmr" as const, mmrLambda: 0.3 };

    const profile = await resolveInfrastructureProfile({
      provider: "in-memory",
      infrastructure: { retrieval: retrievalConfig },
    });

    expect(profile.retrieval).toEqual(retrievalConfig);
  });
});

describe("saveProfileToStore + load roundtrip", () => {
  it("persists and reloads a profile", async () => {
    const store = new InMemoryConfigStore();
    const profile: InfrastructureProfile = {
      id: "custom",
      name: "Custom Profile",
      persistence: { type: "indexeddb" },
      vectorStore: { type: "nedb", dimensions: 1536 },
      documentStorage: { type: "browser" },
      embedding: { type: "openai", authRef: "openai-key", model: "text-embedding-3-small", dimensions: 1536 },
    };

    await saveProfileToStore(store, profile);
    const loaded = await resolveInfrastructureProfile({
      provider: "in-memory", // base will be overridden by stored profile
      configStore: store,
    });

    expect(loaded.persistence).toEqual({ type: "indexeddb" });
    expect(loaded.vectorStore).toEqual({ type: "nedb", dimensions: 1536 });
    expect(loaded.documentStorage).toEqual({ type: "browser" });
    expect(loaded.embedding.type).toBe("openai");
    expect((loaded.embedding as any).model).toBe("text-embedding-3-small");
    expect((loaded.embedding as any).dimensions).toBe(1536);
  });
});
