import { describe, it, expect } from "vitest";
import type { DocumentStorageConfig } from "../DocumentStorageConfig";
import type { LLMConfig } from "../LLMConfig";

describe("DocumentStorageConfig", () => {
  it("models in-memory storage", () => {
    const cfg: DocumentStorageConfig = { type: "in-memory" };
    expect(cfg.type).toBe("in-memory");
  });

  it("models local filesystem storage", () => {
    const cfg: DocumentStorageConfig = { type: "local", basePath: "./data/uploads" };
    if (cfg.type === "local") expect(cfg.basePath).toBe("./data/uploads");
  });

  it("models browser storage", () => {
    const cfg: DocumentStorageConfig = { type: "browser" };
    expect(cfg.type).toBe("browser");
  });

  it("models S3 storage", () => {
    const cfg: DocumentStorageConfig = {
      type: "s3",
      authRef: "AWS_CREDENTIALS",
      bucket: "klay-docs",
      region: "us-east-1",
      prefix: "uploads/",
    };
    if (cfg.type === "s3") {
      expect(cfg.bucket).toBe("klay-docs");
      expect(cfg.prefix).toBe("uploads/");
    }
  });

  it("models MinIO storage (S3-compatible)", () => {
    const cfg: DocumentStorageConfig = {
      type: "minio",
      connection: { kind: "network", host: "localhost", port: 9000 },
      authRef: "MINIO_CREDENTIALS",
      bucket: "klay",
    };
    if (cfg.type === "minio") {
      expect(cfg.connection.kind).toBe("network");
    }
  });
});

describe("LLMConfig", () => {
  it("models OpenAI LLM", () => {
    const cfg: LLMConfig = { type: "openai", authRef: "OPENAI_API_KEY", model: "gpt-4o" };
    if (cfg.type === "openai") expect(cfg.model).toBe("gpt-4o");
  });

  it("models Ollama LLM (no auth)", () => {
    const cfg: LLMConfig = { type: "ollama", model: "llama3.2", baseUrl: "http://localhost:11434" };
    if (cfg.type === "ollama") expect(cfg.baseUrl).toBeDefined();
  });
});
