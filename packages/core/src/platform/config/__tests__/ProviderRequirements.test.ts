import { describe, it, expect } from "vitest";
import {
  getProvidersForAxis,
  getProfileRequirements,
  getDefaultModel,
  getModelsForProvider,
  getProvider,
  PROVIDER_REGISTRY,
} from "../ProviderRequirements";

describe("getProvidersForAxis", () => {
  it("returns 3 persistence providers (no runtime filter)", () => {
    const providers = getProvidersForAxis("persistence");
    expect(providers).toHaveLength(3);
    expect(providers.map((p) => p.id)).toEqual(
      expect.arrayContaining(["in-memory", "indexeddb", "nedb"]),
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

  it("returns 6 embedding providers (no runtime filter)", () => {
    const providers = getProvidersForAxis("embedding");
    expect(providers).toHaveLength(6);
    expect(providers.map((p) => p.id)).toEqual(
      expect.arrayContaining([
        "hash",
        "webllm",
        "openai",
        "cohere",
        "huggingface",
        "hf-inference",
      ]),
    );
  });

  it("filters by browser runtime — persistence", () => {
    const providers = getProvidersForAxis("persistence", "browser");
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("in-memory");
    expect(ids).toContain("indexeddb");
    expect(ids).not.toContain("nedb");
  });

  it("filters by server runtime — persistence", () => {
    const providers = getProvidersForAxis("persistence", "server");
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("in-memory");
    expect(ids).toContain("nedb");
    expect(ids).not.toContain("indexeddb");
  });

  it("filters by browser runtime — embedding excludes server-only", () => {
    const providers = getProvidersForAxis("embedding", "browser");
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("hash");
    expect(ids).toContain("webllm");
    expect(ids).toContain("openai");
    expect(ids).toContain("cohere");
    expect(ids).toContain("huggingface");
    expect(ids).toContain("hf-inference");
  });

  it("filters by server runtime — embedding excludes webllm", () => {
    const providers = getProvidersForAxis("embedding", "server");
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("hash");
    expect(ids).not.toContain("webllm");
    expect(ids).toContain("openai");
  });
});

describe("getProvider", () => {
  it("finds a provider by axis + id", () => {
    const provider = getProvider("persistence", "nedb");
    expect(provider).toBeDefined();
    expect(provider!.name).toBe("NeDB");
  });

  it("returns undefined for unknown id", () => {
    expect(getProvider("persistence", "nonexistent")).toBeUndefined();
  });

  it("returns provider with fields when defined", () => {
    const provider = getProvider("persistence", "nedb");
    expect(provider!.fields).toBeDefined();
    expect(provider!.fields!.length).toBeGreaterThan(0);
    expect(provider!.fields![0].key).toBe("path");
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

  it("returns 3 models for huggingface", () => {
    const models = getModelsForProvider("huggingface");
    expect(models).toHaveLength(3);
  });

  it("returns 2 models for hash", () => {
    const models = getModelsForProvider("hash");
    expect(models).toHaveLength(2);
  });

  it("returns 3 models for hf-inference", () => {
    const models = getModelsForProvider("hf-inference");
    expect(models).toHaveLength(3);
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

  it("returns no requirements for huggingface (local)", () => {
    const reqs = getProfileRequirements({ embedding: "huggingface" });
    expect(reqs).toEqual([]);
  });

  it("returns empty array for hash embedding", () => {
    const reqs = getProfileRequirements({ embedding: "hash" });
    expect(reqs).toEqual([]);
  });

  it("returns empty array for webllm embedding", () => {
    const reqs = getProfileRequirements({ embedding: "webllm" });
    expect(reqs).toEqual([]);
  });

  it("returns HUGGINGFACE_API_KEY for hf-inference embedding", () => {
    const reqs = getProfileRequirements({ embedding: "hf-inference" });
    expect(reqs).toEqual([
      { key: "HUGGINGFACE_API_KEY", label: "HuggingFace API Key" },
    ]);
  });

  it("returns empty array for persistence-only profile", () => {
    const reqs = getProfileRequirements({ persistence: "indexeddb" });
    expect(reqs).toEqual([]);
  });

  it("deduplicates requirements across axes", () => {
    const reqs = getProfileRequirements({
      persistence: "indexeddb",
      vectorStore: "indexeddb",
      embedding: "openai",
    });
    expect(reqs.filter((r) => r.key === "OPENAI_API_KEY")).toHaveLength(1);
  });
});

describe("PROVIDER_REGISTRY", () => {
  it("has 15 total entries", () => {
    expect(PROVIDER_REGISTRY).toHaveLength(15);
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
      (p) => p.axis === "embedding" && ["openai", "cohere"].includes(p.id),
    );
    expect(aiSdkProviders).toHaveLength(2);
    for (const provider of aiSdkProviders) {
      expect(provider.gateway).toBe("ai-sdk");
    }
  });

  it("local providers have gateway 'local'", () => {
    const localProviders = PROVIDER_REGISTRY.filter(
      (p) => p.gateway === "local",
    );
    // 3 persistence + 3 vectorStore + 3 documentStorage + 3 embedding (hash, webllm, huggingface)
    expect(localProviders).toHaveLength(12);
  });

  it("all embedding providers have models defined", () => {
    const embeddingProviders = PROVIDER_REGISTRY.filter(
      (p) => p.axis === "embedding",
    );
    for (const provider of embeddingProviders) {
      expect(provider.models).toBeDefined();
      expect(provider.models!.length).toBeGreaterThan(0);
      const defaults = provider.models!.filter((m) => m.isDefault);
      expect(defaults).toHaveLength(1);
    }
  });

  it("providers with fields have valid field specs", () => {
    const withFields = PROVIDER_REGISTRY.filter((p) => p.fields && p.fields.length > 0);
    expect(withFields.length).toBeGreaterThan(0);
    for (const provider of withFields) {
      for (const field of provider.fields!) {
        expect(field.key).toBeTruthy();
        expect(field.label).toBeTruthy();
        expect(["text", "number", "select", "boolean"]).toContain(field.inputType);
        if (field.inputType === "select") {
          expect(field.options).toBeDefined();
          expect(field.options!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("all provider IDs are unique within their axis", () => {
    const axes = ["persistence", "vectorStore", "documentStorage", "embedding"] as const;
    for (const axis of axes) {
      const providers = PROVIDER_REGISTRY.filter((p) => p.axis === axis);
      const ids = providers.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
