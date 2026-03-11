import { describe, it, expect } from "vitest";
import type { EmbeddingConfig, EmbeddingFingerprint } from "../EmbeddingConfig";

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

  it("models Ollama embedding (no authRef)", () => {
    const cfg: EmbeddingConfig = { type: "ollama", model: "nomic-embed-text", baseUrl: "http://localhost:11434" };
    if (cfg.type === "ollama") {
      expect(cfg.baseUrl).toBe("http://localhost:11434");
    }
  });

  it("models Azure OpenAI embedding", () => {
    const cfg: EmbeddingConfig = {
      type: "azure-openai",
      authRef: "AZURE_API_KEY",
      model: "text-embedding-3-small",
      deploymentName: "embeddings-prod",
      apiVersion: "2024-10-21",
    };
    if (cfg.type === "azure-openai") {
      expect(cfg.deploymentName).toBe("embeddings-prod");
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
