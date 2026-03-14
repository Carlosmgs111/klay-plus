import { describe, it, expect } from "vitest";
import type { EmbeddingConfig, EmbeddingFingerprint } from "../InfrastructureProfile";

describe("EmbeddingConfig", () => {
  it("models hash embedding", () => {
    const cfg: EmbeddingConfig = { type: "hash", dimensions: 128 };
    expect(cfg.type).toBe("hash");
  });

  it("models WebLLM embedding", () => {
    const cfg: EmbeddingConfig = { type: "webllm", model: "Xenova/all-MiniLM-L6-v2" };
    expect(cfg.type).toBe("webllm");
  });

  it("models OpenAI embedding with authRef", () => {
    const cfg: EmbeddingConfig = {
      type: "openai",
      authRef: "OPENAI_API_KEY",
      model: "text-embedding-3-small",
      dimensions: 1536,
    };
    if (cfg.type === "openai") {
      expect(cfg.authRef).toBe("OPENAI_API_KEY");
      expect(cfg.model).toBe("text-embedding-3-small");
    }
  });

  it("models Cohere embedding", () => {
    const cfg: EmbeddingConfig = { type: "cohere", authRef: "COHERE_KEY", model: "embed-multilingual-v3.0" };
    if (cfg.type === "cohere") {
      expect(cfg.model).toBe("embed-multilingual-v3.0");
    }
  });

  it("models HuggingFace embedding", () => {
    const cfg: EmbeddingConfig = { type: "huggingface", authRef: "HF_KEY", model: "sentence-transformers/all-MiniLM-L6-v2" };
    if (cfg.type === "huggingface") {
      expect(cfg.model).toBe("sentence-transformers/all-MiniLM-L6-v2");
    }
  });
});

describe("EmbeddingFingerprint", () => {
  it("captures provider, model, dimensions, and optional baseUrl", () => {
    const fp: EmbeddingFingerprint = {
      provider: "openai",
      model: "text-embedding-3-small",
      dimensions: 1536,
    };
    expect(fp.provider).toBe("openai");
    expect(fp.dimensions).toBe(1536);
  });

  it("distinguishes endpoints via baseUrl", () => {
    const fp: EmbeddingFingerprint = {
      provider: "openai",
      model: "text-embedding-3-small",
      dimensions: 1536,
      baseUrl: "https://my-resource.openai.azure.com",
    };
    expect(fp.baseUrl).toBeDefined();
  });
});
