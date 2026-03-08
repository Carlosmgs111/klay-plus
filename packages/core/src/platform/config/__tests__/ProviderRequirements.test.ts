import { describe, it, expect } from "vitest";
import {
  getProvidersForAxis,
  getProfileRequirements,
  getDefaultModel,
  getModelsForProvider,
  PROVIDER_REGISTRY,
} from "../ProviderRequirements";

describe("getProvidersForAxis", () => {
  it("returns 3 persistence providers (no runtime filter)", () => {
    const providers = getProvidersForAxis("persistence");
    expect(providers).toHaveLength(3);
    expect(providers.map((p) => p.id)).toEqual(
      expect.arrayContaining(["in-memory", "browser", "server"]),
    );
  });

  it("returns 3 vectorStore providers", () => {
    const providers = getProvidersForAxis("vectorStore");
    expect(providers).toHaveLength(3);
  });

  it("returns 3 documentStorage providers", () => {
    const providers = getProvidersForAxis("documentStorage");
    expect(providers).toHaveLength(3);
  });

  it("returns 5 embedding providers (no runtime filter)", () => {
    const providers = getProvidersForAxis("embedding");
    expect(providers).toHaveLength(5);
    expect(providers.map((p) => p.id)).toEqual(
      expect.arrayContaining([
        "hash",
        "browser-webllm",
        "openai",
        "cohere",
        "huggingface",
      ]),
    );
  });

  it("filters by browser runtime — persistence", () => {
    const providers = getProvidersForAxis("persistence", "browser");
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("in-memory");
    expect(ids).toContain("browser");
    expect(ids).not.toContain("server");
  });

  it("filters by server runtime — persistence", () => {
    const providers = getProvidersForAxis("persistence", "server");
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("in-memory");
    expect(ids).toContain("server");
    expect(ids).not.toContain("browser");
  });

  it("filters by browser runtime — embedding excludes server-only", () => {
    const providers = getProvidersForAxis("embedding", "browser");
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("hash");
    expect(ids).toContain("browser-webllm");
    expect(ids).toContain("openai");
    // cohere and huggingface are browser+server
    expect(ids).toContain("cohere");
    expect(ids).toContain("huggingface");
  });

  it("filters by server runtime — embedding excludes browser-webllm", () => {
    const providers = getProvidersForAxis("embedding", "server");
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("hash");
    expect(ids).not.toContain("browser-webllm");
    expect(ids).toContain("openai");
  });
});

describe("getDefaultModel", () => {
  it("returns default model for openai", () => {
    const model = getDefaultModel("openai");
    expect(model).toBeDefined();
    expect(model!.id).toBe("text-embedding-3-small");
    expect(model!.dimensions).toBe(1536);
    expect(model!.isDefault).toBe(true);
  });

  it("returns default model for hash", () => {
    const model = getDefaultModel("hash");
    expect(model).toBeDefined();
    expect(model!.id).toBe("hash-128");
    expect(model!.dimensions).toBe(128);
  });

  it("returns undefined for unknown provider", () => {
    const model = getDefaultModel("nonexistent");
    expect(model).toBeUndefined();
  });
});

describe("getModelsForProvider", () => {
  it("returns 3 models for openai", () => {
    const models = getModelsForProvider("openai");
    expect(models).toHaveLength(3);
    expect(models.map((m) => m.id)).toEqual([
      "text-embedding-3-small",
      "text-embedding-3-large",
      "text-embedding-ada-002",
    ]);
  });

  it("returns 3 models for cohere", () => {
    const models = getModelsForProvider("cohere");
    expect(models).toHaveLength(3);
  });

  it("returns 2 models for huggingface", () => {
    const models = getModelsForProvider("huggingface");
    expect(models).toHaveLength(2);
  });

  it("returns 2 models for hash", () => {
    const models = getModelsForProvider("hash");
    expect(models).toHaveLength(2);
  });

  it("returns empty array for unknown provider", () => {
    const models = getModelsForProvider("nonexistent");
    expect(models).toEqual([]);
  });
});

describe("getProfileRequirements", () => {
  it("returns OPENAI_API_KEY for openai embedding", () => {
    const reqs = getProfileRequirements({ embedding: "openai" });
    expect(reqs).toEqual([
      { key: "OPENAI_API_KEY", label: "OpenAI API Key" },
    ]);
  });

  it("returns COHERE_API_KEY for cohere embedding", () => {
    const reqs = getProfileRequirements({ embedding: "cohere" });
    expect(reqs).toEqual([
      { key: "COHERE_API_KEY", label: "Cohere API Key" },
    ]);
  });

  it("returns HUGGINGFACE_API_KEY for huggingface embedding", () => {
    const reqs = getProfileRequirements({ embedding: "huggingface" });
    expect(reqs).toEqual([
      { key: "HUGGINGFACE_API_KEY", label: "HuggingFace API Key" },
    ]);
  });

  it("returns empty array for hash embedding", () => {
    const reqs = getProfileRequirements({ embedding: "hash" });
    expect(reqs).toEqual([]);
  });

  it("returns empty array for browser-webllm embedding", () => {
    const reqs = getProfileRequirements({ embedding: "browser-webllm" });
    expect(reqs).toEqual([]);
  });

  it("returns empty array for persistence-only profile", () => {
    const reqs = getProfileRequirements({ persistence: "browser" });
    expect(reqs).toEqual([]);
  });

  it("deduplicates requirements across axes", () => {
    const reqs = getProfileRequirements({
      persistence: "browser",
      vectorStore: "browser",
      embedding: "openai",
    });
    expect(reqs.filter((r) => r.key === "OPENAI_API_KEY")).toHaveLength(1);
  });
});

describe("PROVIDER_REGISTRY", () => {
  it("has 14 total entries", () => {
    expect(PROVIDER_REGISTRY).toHaveLength(14);
  });

  it("every entry has required fields including runtimes and gateway", () => {
    for (const entry of PROVIDER_REGISTRY) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.axis).toBeTruthy();
      expect(Array.isArray(entry.requirements)).toBe(true);
      expect(Array.isArray(entry.runtimes)).toBe(true);
      expect(entry.runtimes.length).toBeGreaterThan(0);
      expect(["local", "ai-sdk", "native"]).toContain(entry.gateway);
    }
  });

  it("AI SDK embedding providers have gateway 'ai-sdk'", () => {
    const aiSdkProviders = PROVIDER_REGISTRY.filter(
      (p) => p.axis === "embedding" && ["openai", "cohere", "huggingface"].includes(p.id),
    );
    expect(aiSdkProviders).toHaveLength(3);
    for (const provider of aiSdkProviders) {
      expect(provider.gateway).toBe("ai-sdk");
    }
  });

  it("local providers have gateway 'local'", () => {
    const localProviders = PROVIDER_REGISTRY.filter(
      (p) => p.gateway === "local",
    );
    // 9 persistence/vectorStore/documentStorage + 2 local embedding (hash, browser-webllm)
    expect(localProviders).toHaveLength(11);
  });

  it("all embedding providers have models defined", () => {
    const embeddingProviders = PROVIDER_REGISTRY.filter(
      (p) => p.axis === "embedding",
    );
    for (const provider of embeddingProviders) {
      expect(provider.models).toBeDefined();
      expect(provider.models!.length).toBeGreaterThan(0);
      // Each provider should have exactly one default model
      const defaults = provider.models!.filter((m) => m.isDefault);
      expect(defaults).toHaveLength(1);
    }
  });
});
