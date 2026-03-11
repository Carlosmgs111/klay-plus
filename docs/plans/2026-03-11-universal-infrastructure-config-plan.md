# Universal Infrastructure Configuration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the string-based `InfrastructureProfile` with typed discriminated unions per axis, add a `SecretStore` for encrypted credential management, and evolve factories to use the new typed configs.

**Architecture:** New type-only files define discriminated unions for 5 infrastructure axes (persistence, vectorStore, embedding, documentStorage, llm). A `SecretStore` port with 3 implementations (InMemory, IndexedDB, NeDB) provides encrypted credential management. Factories receive a typed profile + secretStore instead of string-based policy fields. Presets provide backward compatibility.

**Tech Stack:** TypeScript (moduleResolution: bundler), Vitest, Web Crypto API (browser encryption), Node.js crypto (server encryption), IndexedDB, NeDB

**Spec:** `docs/plans/2026-03-11-universal-infrastructure-config-design.md`

---

## Chunk 1: Type Foundation

New type-only files with zero runtime dependencies. Pure TypeScript types that define the discriminated unions per infrastructure axis.

### Task 1: ConnectionConfig types

**Files:**
- Create: `packages/core/src/platform/config/ConnectionConfig.ts`
- Test: `packages/core/src/platform/config/__tests__/ConnectionConfig.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/platform/config/__tests__/ConnectionConfig.test.ts
import { describe, it, expect } from "vitest";
import type { ConnectionConfig, LocalConnection, NetworkConnection, EmbeddedConnection } from "../ConnectionConfig";

describe("ConnectionConfig", () => {
  it("models a local file-based connection", () => {
    const conn: LocalConnection = { kind: "local", path: "./data" };
    expect(conn.kind).toBe("local");
    expect(conn.path).toBe("./data");
  });

  it("models a network connection with url", () => {
    const conn: NetworkConnection = { kind: "network", url: "postgresql://localhost:5432/klay" };
    expect(conn.kind).toBe("network");
    expect(conn.url).toBe("postgresql://localhost:5432/klay");
  });

  it("models a network connection with host+port", () => {
    const conn: NetworkConnection = { kind: "network", host: "db.example.com", port: 5432, ssl: true };
    expect(conn.kind).toBe("network");
    expect(conn.host).toBe("db.example.com");
    expect(conn.port).toBe(5432);
    expect(conn.ssl).toBe(true);
  });

  it("models an embedded connection", () => {
    const conn: EmbeddedConnection = { kind: "embedded", databaseName: "klay-config" };
    expect(conn.kind).toBe("embedded");
    expect(conn.databaseName).toBe("klay-config");
  });

  it("discriminates via kind field", () => {
    const conn: ConnectionConfig = { kind: "network", host: "localhost", port: 27017 };
    switch (conn.kind) {
      case "local": expect(conn.path).toBeDefined(); break;
      case "network": expect(conn.host).toBe("localhost"); break;
      case "embedded": expect(conn.databaseName).toBeDefined(); break;
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/ConnectionConfig.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ConnectionConfig.ts**

```typescript
// packages/core/src/platform/config/ConnectionConfig.ts

/** Local file-based resource (NeDB, SQLite) */
export interface LocalConnection {
  kind: "local";
  path: string;
}

/** Network resource (PostgreSQL, MongoDB, Pinecone, etc.) */
export interface NetworkConnection {
  kind: "network";
  /** Full URI — overrides host+port if provided */
  url?: string;
  host?: string;
  port?: number;
  ssl?: boolean;
}

/** In-process / browser-native resource (IndexedDB, in-memory) */
export interface EmbeddedConnection {
  kind: "embedded";
  databaseName?: string;
}

export type ConnectionConfig = LocalConnection | NetworkConnection | EmbeddedConnection;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/ConnectionConfig.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/platform/config/ConnectionConfig.ts packages/core/src/platform/config/__tests__/ConnectionConfig.test.ts
git commit -m "feat(config): add ConnectionConfig discriminated union types"
```

---

### Task 2: PersistenceConfig types

**Files:**
- Create: `packages/core/src/platform/config/PersistenceConfig.ts`
- Test: `packages/core/src/platform/config/__tests__/PersistenceConfig.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/platform/config/__tests__/PersistenceConfig.test.ts
import { describe, it, expect } from "vitest";
import type { PersistenceConfig } from "../PersistenceConfig";

describe("PersistenceConfig", () => {
  it("models in-memory persistence", () => {
    const cfg: PersistenceConfig = { type: "in-memory" };
    expect(cfg.type).toBe("in-memory");
  });

  it("models IndexedDB persistence", () => {
    const cfg: PersistenceConfig = { type: "indexeddb", databaseName: "klay" };
    expect(cfg.type).toBe("indexeddb");
  });

  it("models NeDB persistence", () => {
    const cfg: PersistenceConfig = { type: "nedb", path: "./data" };
    expect(cfg.type).toBe("nedb");
  });

  it("models PostgreSQL persistence with full config", () => {
    const cfg: PersistenceConfig = {
      type: "postgresql",
      connection: { kind: "network", host: "db.example.com", port: 5432, ssl: true },
      authRef: "PG_CREDENTIALS",
      database: "klay_prod",
      schema: "public",
      pool: { min: 2, max: 10, idleTimeoutMs: 30000 },
    };
    expect(cfg.type).toBe("postgresql");
    if (cfg.type === "postgresql") {
      expect(cfg.database).toBe("klay_prod");
      expect(cfg.connection.kind).toBe("network");
      expect(cfg.pool?.max).toBe(10);
    }
  });

  it("models MongoDB persistence", () => {
    const cfg: PersistenceConfig = {
      type: "mongodb",
      connection: { kind: "network", url: "mongodb://localhost:27017" },
      database: "klay",
      authRef: "MONGO_CREDENTIALS",
      authSource: "admin",
    };
    expect(cfg.type).toBe("mongodb");
    if (cfg.type === "mongodb") {
      expect(cfg.authSource).toBe("admin");
    }
  });

  it("models SQLite persistence", () => {
    const cfg: PersistenceConfig = { type: "sqlite", path: "./data/klay.db" };
    expect(cfg.type).toBe("sqlite");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/PersistenceConfig.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PersistenceConfig.ts**

```typescript
// packages/core/src/platform/config/PersistenceConfig.ts
import type { NetworkConnection } from "./ConnectionConfig";

export interface PoolConfig {
  min?: number;
  max?: number;
  idleTimeoutMs?: number;
}

export type PersistenceConfig =
  | { type: "in-memory" }
  | { type: "indexeddb"; databaseName?: string }
  | { type: "nedb"; path?: string }
  | { type: "sqlite"; path: string; readonly?: boolean }
  | {
      type: "postgresql";
      connection: NetworkConnection;
      authRef?: string;
      database: string;
      schema?: string;
      pool?: PoolConfig;
    }
  | {
      type: "mongodb";
      connection: NetworkConnection;
      authRef?: string;
      database: string;
      authSource?: string;
      replicaSet?: string;
    };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/PersistenceConfig.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/platform/config/PersistenceConfig.ts packages/core/src/platform/config/__tests__/PersistenceConfig.test.ts
git commit -m "feat(config): add PersistenceConfig discriminated union"
```

---

### Task 3: VectorStoreConfig types

**Files:**
- Create: `packages/core/src/platform/config/VectorStoreConfig.ts`
- Test: `packages/core/src/platform/config/__tests__/VectorStoreConfig.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/platform/config/__tests__/VectorStoreConfig.test.ts
import { describe, it, expect } from "vitest";
import type { VectorStoreConfig, DistanceMetric } from "../VectorStoreConfig";

describe("VectorStoreConfig", () => {
  it("models in-memory vector store", () => {
    const cfg: VectorStoreConfig = { type: "in-memory", dimensions: 128, distanceMetric: "cosine" };
    expect(cfg.type).toBe("in-memory");
    expect(cfg.dimensions).toBe(128);
  });

  it("models IndexedDB vector store", () => {
    const cfg: VectorStoreConfig = { type: "indexeddb", dimensions: 384 };
    expect(cfg.dimensions).toBe(384);
  });

  it("models pgvector", () => {
    const cfg: VectorStoreConfig = {
      type: "pgvector",
      connection: { kind: "network", host: "localhost", port: 5432 },
      authRef: "PG_CREDENTIALS",
      dimensions: 1536,
      tableName: "embeddings",
      distanceMetric: "cosine",
      indexType: "hnsw",
    };
    if (cfg.type === "pgvector") {
      expect(cfg.indexType).toBe("hnsw");
      expect(cfg.tableName).toBe("embeddings");
    }
  });

  it("models Pinecone", () => {
    const cfg: VectorStoreConfig = {
      type: "pinecone",
      authRef: "PINECONE_API_KEY",
      indexName: "klay-prod",
      namespace: "production",
      dimensions: 1536,
      cloud: "aws",
      region: "us-east-1",
    };
    if (cfg.type === "pinecone") {
      expect(cfg.authRef).toBe("PINECONE_API_KEY");
      expect(cfg.namespace).toBe("production");
    }
  });

  it("supports all distance metrics", () => {
    const metrics: DistanceMetric[] = ["cosine", "euclidean", "dotProduct"];
    expect(metrics).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/VectorStoreConfig.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement VectorStoreConfig.ts**

```typescript
// packages/core/src/platform/config/VectorStoreConfig.ts
import type { NetworkConnection } from "./ConnectionConfig";

export type DistanceMetric = "cosine" | "euclidean" | "dotProduct";

export type VectorStoreConfig =
  | { type: "in-memory"; dimensions: number; distanceMetric?: DistanceMetric }
  | { type: "indexeddb"; dimensions: number; databaseName?: string; distanceMetric?: DistanceMetric }
  | { type: "nedb"; dimensions: number; path?: string; distanceMetric?: DistanceMetric }
  | {
      type: "pgvector";
      connection: NetworkConnection;
      authRef?: string;
      dimensions: number;
      tableName?: string;
      distanceMetric?: DistanceMetric;
      indexType?: "hnsw" | "ivfflat";
    }
  | {
      type: "pinecone";
      authRef: string;
      indexName: string;
      namespace?: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
      cloud?: string;
      region?: string;
    }
  | {
      type: "qdrant";
      connection: NetworkConnection;
      authRef?: string;
      collectionName: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
    }
  | {
      type: "chromadb";
      connection: NetworkConnection;
      authRef?: string;
      collectionName: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
      tenant?: string;
    }
  | {
      type: "weaviate";
      connection: NetworkConnection;
      authRef?: string;
      className: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
    }
  | {
      type: "milvus";
      connection: NetworkConnection;
      authRef?: string;
      collectionName: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
      indexType?: "hnsw" | "ivfflat" | "flat";
    };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/VectorStoreConfig.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/platform/config/VectorStoreConfig.ts packages/core/src/platform/config/__tests__/VectorStoreConfig.test.ts
git commit -m "feat(config): add VectorStoreConfig discriminated union"
```

---

### Task 4: EmbeddingConfig + EmbeddingFingerprint types

**Files:**
- Create: `packages/core/src/platform/config/EmbeddingConfig.ts`
- Test: `packages/core/src/platform/config/__tests__/EmbeddingConfig.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/platform/config/__tests__/EmbeddingConfig.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/EmbeddingConfig.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement EmbeddingConfig.ts**

```typescript
// packages/core/src/platform/config/EmbeddingConfig.ts

export type EmbeddingConfig =
  | { type: "hash"; dimensions?: number }
  | { type: "webllm"; model?: string }
  | { type: "openai"; authRef: string; model: string; dimensions?: number; baseUrl?: string }
  | { type: "cohere"; authRef: string; model: string; dimensions?: number }
  | { type: "huggingface"; authRef: string; model: string; endpointUrl?: string }
  | { type: "ollama"; model: string; baseUrl?: string }
  | { type: "bedrock"; authRef: string; model: string; region: string }
  | { type: "vertex-ai"; authRef: string; model: string; location: string }
  | { type: "azure-openai"; authRef: string; model: string; deploymentName: string; apiVersion?: string }
  | { type: "voyage-ai"; authRef: string; model: string; dimensions?: number };

/** Fingerprint stored with each knowledge context to detect embedding incompatibilities */
export interface EmbeddingFingerprint {
  provider: string;
  model: string;
  dimensions: number;
  /** Distinguishes different endpoints (e.g., Azure OpenAI vs direct OpenAI) */
  baseUrl?: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/EmbeddingConfig.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/platform/config/EmbeddingConfig.ts packages/core/src/platform/config/__tests__/EmbeddingConfig.test.ts
git commit -m "feat(config): add EmbeddingConfig union and EmbeddingFingerprint"
```

---

### Task 5: DocumentStorageConfig + LLMConfig types

**Files:**
- Create: `packages/core/src/platform/config/DocumentStorageConfig.ts`
- Create: `packages/core/src/platform/config/LLMConfig.ts`
- Test: `packages/core/src/platform/config/__tests__/DocumentStorageConfig.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/platform/config/__tests__/DocumentStorageConfig.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/DocumentStorageConfig.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement both files**

```typescript
// packages/core/src/platform/config/DocumentStorageConfig.ts
import type { NetworkConnection } from "./ConnectionConfig";

export type DocumentStorageConfig =
  | { type: "in-memory" }
  | { type: "local"; basePath: string }
  | { type: "browser" }
  | { type: "s3"; authRef: string; bucket: string; region: string; prefix?: string; endpoint?: string }
  | { type: "gcs"; authRef: string; bucket: string; prefix?: string }
  | { type: "azure-blob"; authRef: string; container: string; prefix?: string }
  | { type: "minio"; connection: NetworkConnection; authRef: string; bucket: string; prefix?: string };
```

```typescript
// packages/core/src/platform/config/LLMConfig.ts

export type LLMConfig =
  | { type: "openai"; authRef: string; model: string; baseUrl?: string }
  | { type: "anthropic"; authRef: string; model: string }
  | { type: "cohere"; authRef: string; model: string }
  | { type: "ollama"; model: string; baseUrl?: string }
  | { type: "bedrock"; authRef: string; model: string; region: string }
  | { type: "vertex-ai"; authRef: string; model: string; location: string }
  | { type: "azure-openai"; authRef: string; model: string; deploymentName: string; apiVersion?: string };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/DocumentStorageConfig.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/platform/config/DocumentStorageConfig.ts packages/core/src/platform/config/LLMConfig.ts packages/core/src/platform/config/__tests__/DocumentStorageConfig.test.ts
git commit -m "feat(config): add DocumentStorageConfig and LLMConfig unions"
```

---

## Chunk 2: SecretStore

The centralized credential management system with encryption at rest.

### Task 6: ManagedSecret entity + SecretStore port

**Files:**
- Create: `packages/core/src/platform/secrets/ManagedSecret.ts`
- Create: `packages/core/src/platform/secrets/SecretStore.ts`

- [ ] **Step 1: Create ManagedSecret entity**

```typescript
// packages/core/src/platform/secrets/ManagedSecret.ts

export type SecretCategory =
  | "api-key"
  | "credential"
  | "connection-string"
  | "certificate"
  | "token";

export interface SecretMetadata {
  name?: string;
  category?: SecretCategory;
  scope?: "global" | "profile";
  provider?: string;
  description?: string;
  expiresAt?: Date;
}

export interface ManagedSecretSummary {
  key: string;
  name?: string;
  category?: SecretCategory;
  scope: "global" | "profile";
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 2: Create SecretStore port**

```typescript
// packages/core/src/platform/secrets/SecretStore.ts
import type { SecretMetadata, ManagedSecretSummary } from "./ManagedSecret";

export interface SecretStore {
  /** Store or update a secret (encrypted at rest) */
  set(key: string, value: string, metadata?: SecretMetadata): Promise<void>;

  /** Retrieve and decrypt a secret */
  get(key: string): Promise<string | undefined>;

  /** Check existence without decrypting */
  exists(key: string): Promise<boolean>;

  /** Remove a secret */
  remove(key: string): Promise<void>;

  /** List all secrets (metadata only, NO values) */
  list(): Promise<ManagedSecretSummary[]>;

  /** Get metadata for a specific secret */
  getMetadata(key: string): Promise<SecretMetadata | undefined>;

  /** Retrieve multiple secrets at once */
  getMultiple(keys: string[]): Promise<Record<string, string>>;
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/platform/secrets/ManagedSecret.ts packages/core/src/platform/secrets/SecretStore.ts
git commit -m "feat(secrets): add ManagedSecret entity and SecretStore port"
```

---

### Task 7: InMemorySecretStore implementation

**Files:**
- Create: `packages/core/src/platform/secrets/InMemorySecretStore.ts`
- Test: `packages/core/src/platform/secrets/__tests__/InMemorySecretStore.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/platform/secrets/__tests__/InMemorySecretStore.test.ts
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
    // Values must NOT appear in summary
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/secrets/__tests__/InMemorySecretStore.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement InMemorySecretStore**

```typescript
// packages/core/src/platform/secrets/InMemorySecretStore.ts
import type { SecretStore } from "./SecretStore";
import type { SecretMetadata, ManagedSecretSummary } from "./ManagedSecret";

interface StoredEntry {
  value: string;
  metadata: SecretMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemorySecretStore implements SecretStore {
  private readonly _entries = new Map<string, StoredEntry>();

  constructor(initial?: Record<string, string>) {
    if (initial) {
      const now = new Date();
      for (const [key, value] of Object.entries(initial)) {
        this._entries.set(key, { value, metadata: {}, createdAt: now, updatedAt: now });
      }
    }
  }

  async set(key: string, value: string, metadata?: SecretMetadata): Promise<void> {
    const now = new Date();
    const existing = this._entries.get(key);
    this._entries.set(key, {
      value,
      metadata: metadata ?? existing?.metadata ?? {},
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async get(key: string): Promise<string | undefined> {
    return this._entries.get(key)?.value;
  }

  async exists(key: string): Promise<boolean> {
    return this._entries.has(key);
  }

  async remove(key: string): Promise<void> {
    this._entries.delete(key);
  }

  async list(): Promise<ManagedSecretSummary[]> {
    return Array.from(this._entries.entries()).map(([key, entry]) => ({
      key,
      name: entry.metadata.name,
      category: entry.metadata.category,
      scope: entry.metadata.scope ?? "global",
      provider: entry.metadata.provider,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
  }

  async getMetadata(key: string): Promise<SecretMetadata | undefined> {
    const entry = this._entries.get(key);
    return entry ? { ...entry.metadata } : undefined;
  }

  async getMultiple(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const key of keys) {
      const value = this._entries.get(key)?.value;
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core test -- src/platform/secrets/__tests__/InMemorySecretStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/platform/secrets/InMemorySecretStore.ts packages/core/src/platform/secrets/__tests__/InMemorySecretStore.test.ts
git commit -m "feat(secrets): add InMemorySecretStore implementation"
```

---

### Task 8: SecretResolver (cascade resolution)

**Files:**
- Create: `packages/core/src/platform/secrets/SecretResolver.ts`
- Test: `packages/core/src/platform/secrets/__tests__/SecretResolver.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/platform/secrets/__tests__/SecretResolver.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/secrets/__tests__/SecretResolver.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement SecretResolver**

```typescript
// packages/core/src/platform/secrets/SecretResolver.ts
import type { SecretStore } from "./SecretStore";

export class SecretResolver {
  constructor(private readonly _store: SecretStore) {}

  /** Resolve a secret from store, then env vars. Returns undefined if not found. */
  async resolve(key: string): Promise<string | undefined> {
    // 1. SecretStore (primary)
    const fromStore = await this._store.get(key);
    if (fromStore !== undefined) return fromStore;

    // 2. Environment variables (server-only — in browser, process is undefined)
    if (typeof process !== "undefined" && process.env) {
      const fromEnv = process.env[key];
      if (fromEnv !== undefined && fromEnv !== "") return fromEnv;
    }

    return undefined;
  }

  /** Resolve or throw a descriptive error */
  async require(key: string): Promise<string> {
    const value = await this.resolve(key);
    if (value === undefined) {
      throw new Error(
        `Missing credential: "${key}". Set it via the dashboard (Credentials) or as an environment variable.`
      );
    }
    return value;
  }

  /** Resolve multiple keys, returning only those that exist */
  async resolveMultiple(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const key of keys) {
      const value = await this.resolve(key);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core test -- src/platform/secrets/__tests__/SecretResolver.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/platform/secrets/SecretResolver.ts packages/core/src/platform/secrets/__tests__/SecretResolver.test.ts
git commit -m "feat(secrets): add SecretResolver with cascade resolution"
```

---

### Task 9: Secrets barrel export + package.json exports

**Files:**
- Create: `packages/core/src/platform/secrets/index.ts`
- Modify: `packages/core/package.json` — add `./secrets` export path

- [ ] **Step 1: Create barrel**

```typescript
// packages/core/src/platform/secrets/index.ts
export type { SecretStore } from "./SecretStore";
export type { SecretCategory, SecretMetadata, ManagedSecretSummary } from "./ManagedSecret";
export { InMemorySecretStore } from "./InMemorySecretStore";
export { SecretResolver } from "./SecretResolver";
```

- [ ] **Step 2: Add package.json export paths**

Add these entries to `packages/core/package.json` exports:

```json
"./secrets": {
  "types": "./src/platform/secrets/index.ts",
  "import": "./src/platform/secrets/index.ts",
  "default": "./src/platform/secrets/index.ts"
}
```

- [ ] **Step 3: Verify all tests still pass**

Run: `pnpm --filter @klay/core test`
Expected: All tests PASS (existing 169 + new tests)

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/platform/secrets/index.ts packages/core/package.json
git commit -m "feat(secrets): add barrel exports and package.json entry"
```

---

## Chunk 3: Profile Evolution

Refactor InfrastructureProfile to use typed unions, add presets, validation, and defineConfig.

### Task 10: Evolve InfrastructureProfile type

**Files:**
- Modify: `packages/core/src/platform/config/InfrastructureProfile.ts`
- Test: `packages/core/src/platform/config/__tests__/InfrastructureProfile.test.ts` (extend existing)

- [ ] **Step 1: Read the current InfrastructureProfile.ts file**

Read: `packages/core/src/platform/config/InfrastructureProfile.ts`
Understand: current `InfrastructureProfile` interface and `DEFAULT_PROFILES`

- [ ] **Step 2: Refactor InfrastructureProfile type**

Replace the old string-based interface with the new typed version. Keep `DEFAULT_PROFILES` temporarily for backward compat but mark deprecated.

The new interface:

```typescript
import type { PersistenceConfig } from "./PersistenceConfig";
import type { VectorStoreConfig } from "./VectorStoreConfig";
import type { EmbeddingConfig } from "./EmbeddingConfig";
import type { DocumentStorageConfig } from "./DocumentStorageConfig";
import type { LLMConfig } from "./LLMConfig";

export interface InfrastructureProfile {
  id: string;
  name: string;
  persistence: PersistenceConfig;
  vectorStore: VectorStoreConfig;
  embedding: EmbeddingConfig;
  documentStorage: DocumentStorageConfig;
  llm?: LLMConfig;
}
```

**Important**: This is a breaking change for all consumers. The `DEFAULT_PROFILES` must be updated to the new shape. The `resolveInfrastructureProfile` function will need updating in the next task.

- [ ] **Step 3: Create presets.ts with typed preset profiles**

```typescript
// packages/core/src/platform/config/presets.ts
import type { InfrastructureProfile } from "./InfrastructureProfile";

export const PRESET_PROFILES: Record<string, InfrastructureProfile> = {
  "in-memory": {
    id: "in-memory",
    name: "In-Memory (Testing)",
    persistence: { type: "in-memory" },
    vectorStore: { type: "in-memory", dimensions: 128 },
    embedding: { type: "hash", dimensions: 128 },
    documentStorage: { type: "in-memory" },
  },
  browser: {
    id: "browser",
    name: "Browser",
    persistence: { type: "indexeddb" },
    vectorStore: { type: "indexeddb", dimensions: 384 },
    embedding: { type: "webllm", model: "Xenova/all-MiniLM-L6-v2" },
    documentStorage: { type: "browser" },
  },
  server: {
    id: "server",
    name: "Server (NeDB)",
    persistence: { type: "nedb" },
    vectorStore: { type: "nedb", dimensions: 128 },
    embedding: { type: "hash", dimensions: 128 },
    documentStorage: { type: "local", basePath: "./data/uploads" },
  },
};
```

- [ ] **Step 4: Update existing tests for new typed profile structure**

Read and update tests in `packages/core/src/platform/config/__tests__/InfrastructureProfile.test.ts` to use new typed profiles instead of string-based ones.

- [ ] **Step 5: Run all tests to verify nothing is broken**

Run: `pnpm --filter @klay/core test`
Expected: Some tests may FAIL due to the type change — fix each failing test by updating from string-based to typed profiles. This is expected during the refactor.

- [ ] **Step 6: Fix all failing tests and verify**

Update every test and consumer that uses the old string-based `InfrastructureProfile` to use the new typed version. This includes:
- `resolveInfrastructureProfile.ts` — update to handle typed unions
- `ProviderRequirements.ts` — update `getProfileRequirements()` if it reads profile fields
- Any other consumer found via test failures

Run: `pnpm --filter @klay/core test`
Expected: ALL tests PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/platform/config/InfrastructureProfile.ts packages/core/src/platform/config/presets.ts packages/core/src/platform/config/__tests__/
git commit -m "refactor(config): evolve InfrastructureProfile to typed discriminated unions"
```

---

### Task 11: Profile validation

**Files:**
- Create: `packages/core/src/platform/config/validation.ts`
- Test: `packages/core/src/platform/config/__tests__/validation.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/platform/config/__tests__/validation.test.ts
import { describe, it, expect } from "vitest";
import { validateProfile } from "../validation";
import type { InfrastructureProfile } from "../InfrastructureProfile";
import { PRESET_PROFILES } from "../presets";

describe("validateProfile", () => {
  it("accepts valid preset profiles", () => {
    for (const profile of Object.values(PRESET_PROFILES)) {
      const errors = validateProfile(profile);
      expect(errors).toEqual([]);
    }
  });

  it("detects dimension mismatch between embedding and vectorStore", () => {
    const profile: InfrastructureProfile = {
      id: "test",
      name: "Test",
      persistence: { type: "in-memory" },
      vectorStore: { type: "in-memory", dimensions: 128 },
      embedding: { type: "hash", dimensions: 256 },
      documentStorage: { type: "in-memory" },
    };
    const errors = validateProfile(profile);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "DIMENSION_MISMATCH" })
    );
  });

  it("detects missing authRef for providers that require credentials", () => {
    const profile: InfrastructureProfile = {
      id: "test",
      name: "Test",
      persistence: { type: "in-memory" },
      vectorStore: { type: "in-memory", dimensions: 1536 },
      embedding: { type: "openai", authRef: "", model: "text-embedding-3-small", dimensions: 1536 },
      documentStorage: { type: "in-memory" },
    };
    const errors = validateProfile(profile);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_AUTH_REF" })
    );
  });

  it("detects browser-only providers used without IndexedDB persistence", () => {
    const profile: InfrastructureProfile = {
      id: "test",
      name: "Test",
      persistence: { type: "nedb" },
      vectorStore: { type: "indexeddb", dimensions: 384 },
      embedding: { type: "hash" },
      documentStorage: { type: "in-memory" },
    };
    const errors = validateProfile(profile);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "RUNTIME_MISMATCH" })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/validation.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement validation.ts**

```typescript
// packages/core/src/platform/config/validation.ts
import type { InfrastructureProfile } from "./InfrastructureProfile";

export interface ValidationError {
  code: "DIMENSION_MISMATCH" | "MISSING_AUTH_REF" | "RUNTIME_MISMATCH" | "MISSING_REQUIRED_FIELD";
  message: string;
  axis?: string;
}

/** Extract dimensions from embedding config */
function getEmbeddingDimensions(embedding: InfrastructureProfile["embedding"]): number | undefined {
  if ("dimensions" in embedding) return embedding.dimensions;
  return undefined;
}

/** Check if a config requires authRef and whether it's present */
function hasValidAuthRef(config: Record<string, unknown>): boolean {
  if (!("authRef" in config)) return true; // no authRef field = no auth needed
  const ref = config.authRef;
  return typeof ref === "string" && ref.length > 0;
}

const BROWSER_ONLY_TYPES = new Set(["indexeddb", "browser"]);
const SERVER_ONLY_TYPES = new Set(["nedb", "sqlite", "postgresql", "mongodb"]);

export function validateProfile(profile: InfrastructureProfile): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Dimension consistency
  const embDim = getEmbeddingDimensions(profile.embedding);
  const vecDim = profile.vectorStore.dimensions;
  if (embDim !== undefined && vecDim !== undefined && embDim !== vecDim) {
    errors.push({
      code: "DIMENSION_MISMATCH",
      message: `Embedding dimensions (${embDim}) do not match vector store dimensions (${vecDim})`,
    });
  }

  // 2. Auth ref validation for all axes
  const axes = [
    { name: "embedding", config: profile.embedding },
    { name: "vectorStore", config: profile.vectorStore },
    { name: "persistence", config: profile.persistence },
    { name: "documentStorage", config: profile.documentStorage },
    ...(profile.llm ? [{ name: "llm", config: profile.llm }] : []),
  ];

  for (const { name, config } of axes) {
    if (!hasValidAuthRef(config as Record<string, unknown>)) {
      errors.push({
        code: "MISSING_AUTH_REF",
        message: `${name} provider "${config.type}" requires an authRef but none was provided`,
        axis: name,
      });
    }
  }

  // 3. Runtime compatibility (browser-only types shouldn't mix with server-only types)
  const allTypes = [
    profile.persistence.type,
    profile.vectorStore.type,
    profile.documentStorage.type,
  ];
  const hasBrowserOnly = allTypes.some((t) => BROWSER_ONLY_TYPES.has(t));
  const hasServerOnly = allTypes.some((t) => SERVER_ONLY_TYPES.has(t));
  if (hasBrowserOnly && hasServerOnly) {
    errors.push({
      code: "RUNTIME_MISMATCH",
      message: "Profile mixes browser-only and server-only providers",
    });
  }

  return errors;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/platform/config/validation.ts packages/core/src/platform/config/__tests__/validation.test.ts
git commit -m "feat(config): add profile validation (dimensions, authRef, runtime compat)"
```

---

### Task 12: defineConfig helper

**Files:**
- Create: `packages/core/src/platform/config/defineConfig.ts`
- Test: `packages/core/src/platform/config/__tests__/defineConfig.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/platform/config/__tests__/defineConfig.test.ts
import { describe, it, expect } from "vitest";
import { defineConfig } from "../defineConfig";

describe("defineConfig", () => {
  it("returns the config object as-is (type helper)", () => {
    const config = defineConfig({
      profiles: {
        dev: {
          persistence: { type: "nedb", path: "./data" },
          vectorStore: { type: "nedb", dimensions: 128, path: "./data" },
          embedding: { type: "hash", dimensions: 128 },
          documentStorage: { type: "local", basePath: "./data/uploads" },
        },
      },
    });
    expect(config.profiles.dev.persistence.type).toBe("nedb");
    expect(Object.keys(config.profiles)).toEqual(["dev"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/defineConfig.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement defineConfig.ts**

```typescript
// packages/core/src/platform/config/defineConfig.ts
import type { PersistenceConfig } from "./PersistenceConfig";
import type { VectorStoreConfig } from "./VectorStoreConfig";
import type { EmbeddingConfig } from "./EmbeddingConfig";
import type { DocumentStorageConfig } from "./DocumentStorageConfig";
import type { LLMConfig } from "./LLMConfig";

export interface KlayProfileConfig {
  persistence: PersistenceConfig;
  vectorStore: VectorStoreConfig;
  embedding: EmbeddingConfig;
  documentStorage: DocumentStorageConfig;
  llm?: LLMConfig;
}

export interface KlayConfig {
  profiles: Record<string, KlayProfileConfig>;
}

/** Type-safe config helper for klay.config.ts files */
export function defineConfig(config: KlayConfig): KlayConfig {
  return config;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @klay/core test -- src/platform/config/__tests__/defineConfig.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/platform/config/defineConfig.ts packages/core/src/platform/config/__tests__/defineConfig.test.ts
git commit -m "feat(config): add defineConfig helper for klay.config.ts"
```

---

### Task 13: Update config barrel exports

**Files:**
- Modify: `packages/core/src/platform/config/index.ts`

- [ ] **Step 1: Read current barrel**

Read: `packages/core/src/platform/config/index.ts`

- [ ] **Step 2: Add new exports to barrel**

Add these exports to the existing barrel (do NOT remove existing exports — they may still be consumed):

```typescript
// New type exports
export type { ConnectionConfig, LocalConnection, NetworkConnection, EmbeddedConnection } from "./ConnectionConfig";
export type { PersistenceConfig, PoolConfig } from "./PersistenceConfig";
export type { VectorStoreConfig, DistanceMetric } from "./VectorStoreConfig";
export type { EmbeddingConfig, EmbeddingFingerprint } from "./EmbeddingConfig";
export type { DocumentStorageConfig } from "./DocumentStorageConfig";
export type { LLMConfig } from "./LLMConfig";

// Presets
export { PRESET_PROFILES } from "./presets";

// Validation
export { validateProfile } from "./validation";
export type { ValidationError } from "./validation";

// defineConfig
export { defineConfig } from "./defineConfig";
export type { KlayConfig, KlayProfileConfig } from "./defineConfig";
```

- [ ] **Step 3: Run all tests**

Run: `pnpm --filter @klay/core test`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/platform/config/index.ts
git commit -m "feat(config): export new typed config unions from barrel"
```

---

## Chunk 4: Factory Integration

Update the pipeline factories to accept `SecretStore` alongside `ConfigStore`.

### Task 14: Update KnowledgePipelinePolicy to accept SecretStore

**Files:**
- Modify: `packages/core/src/application/knowledge-pipeline/composition/knowledge-pipeline.factory.ts`

- [ ] **Step 1: Read the current factory**

Read: `packages/core/src/application/knowledge-pipeline/composition/knowledge-pipeline.factory.ts`

- [ ] **Step 2: Add SecretStore to KnowledgePipelinePolicy**

Add `secretStore?: SecretStore` as an optional field to the `KnowledgePipelinePolicy` interface. Import `SecretStore` from the secrets module. This is backward-compatible — existing callers that don't pass `secretStore` will continue to work.

```typescript
import type { SecretStore } from "../../../platform/secrets/SecretStore";

// Add to KnowledgePipelinePolicy interface:
secretStore?: SecretStore;
```

- [ ] **Step 3: Pass secretStore through to service factories**

In `resolvePipelineDependencies()`, forward `policy.secretStore` to each context service factory call. Each context factory already accepts a policy object — add `secretStore` to the policy objects being passed.

- [ ] **Step 4: Run all tests**

Run: `pnpm --filter @klay/core test`
Expected: ALL PASS (secretStore is optional, so no existing tests break)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/application/knowledge-pipeline/composition/knowledge-pipeline.factory.ts
git commit -m "feat(pipeline): add secretStore to KnowledgePipelinePolicy"
```

---

### Task 15: Update KnowledgeManagementPolicy

**Files:**
- Modify: `packages/core/src/application/knowledge-management/composition/knowledge-management.factory.ts`

- [ ] **Step 1: Read the factory**

Read: `packages/core/src/application/knowledge-management/composition/knowledge-management.factory.ts`

- [ ] **Step 2: Add SecretStore to policy interface**

Same pattern as Task 14 — add optional `secretStore?: SecretStore` field and forward to inner service factory calls.

- [ ] **Step 3: Run all tests**

Run: `pnpm --filter @klay/core test`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/application/knowledge-management/composition/knowledge-management.factory.ts
git commit -m "feat(management): add secretStore to KnowledgeManagementPolicy"
```

---

### Task 15b: Update KnowledgeLifecyclePolicy

**Files:**
- Modify: `packages/core/src/application/knowledge-lifecycle/composition/knowledge-lifecycle.factory.ts`

- [ ] **Step 1: Read the factory**

Read: `packages/core/src/application/knowledge-lifecycle/composition/knowledge-lifecycle.factory.ts`

- [ ] **Step 2: Add SecretStore to policy interface**

Same pattern as Tasks 14-15 — add optional `secretStore?: SecretStore` field and forward to inner factory calls.

- [ ] **Step 3: Run all tests**

Run: `pnpm --filter @klay/core test`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/application/knowledge-lifecycle/composition/knowledge-lifecycle.factory.ts
git commit -m "feat(lifecycle): add secretStore to KnowledgeLifecyclePolicy"
```

---

### Task 15c: Update createKnowledgePlatform (combined factory)

**Files:**
- Modify: `packages/core/src/application/composition/knowledge-platform.factory.ts`

This is the top-level factory used by `pipeline-singleton.ts`. It must forward `secretStore` to all three inner factories (pipeline, management, lifecycle).

- [ ] **Step 1: Read the factory**

Read: `packages/core/src/application/composition/knowledge-platform.factory.ts`

- [ ] **Step 2: Add secretStore to policy and forward to inner factories**

Add `secretStore?: SecretStore` to the combined policy interface. Forward it to `createKnowledgePipeline()`, `createKnowledgeManagement()`, and `createKnowledgeLifecycle()`.

- [ ] **Step 3: Run all tests**

Run: `pnpm --filter @klay/core test`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/application/composition/knowledge-platform.factory.ts
git commit -m "feat(platform): add secretStore to createKnowledgePlatform"
```

---

## Chunk 5: Web Integration

Update the web app to create and pass SecretStore through the service layer.

### Task 16: Update RuntimeModeContext to create SecretStore

**Files:**
- Modify: `apps/web/src/contexts/RuntimeModeContext.tsx`

- [ ] **Step 1: Read the current RuntimeModeContext**

Read: `apps/web/src/contexts/RuntimeModeContext.tsx`

- [ ] **Step 2: Add secretStore state and initialization**

In the `RuntimeModeProvider` component:

1. Add `secretStore` to context value interface:
   ```typescript
   secretStore: SecretStore | null;
   ```

2. Add state: `const [secretStore, setSecretStore] = useState<SecretStore | null>(null);`

3. In the initialization effect, create the appropriate SecretStore based on mode:
   - **browser mode**: `new InMemorySecretStore()` (temporary — will switch to IndexedDBSecretStore when encryption is implemented)
   - **server mode**: Use the existing `configStore` to back the secret resolution (bridge pattern until server SecretStore is implemented)

4. Pass `secretStore` to `createKnowledgePipeline()` and `createKnowledgeManagement()` calls.

- [ ] **Step 3: Verify dev server starts**

Run: `pnpm --filter @klay/web dev`
Expected: Dev server starts without errors. Both browser and server modes initialize correctly.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/contexts/RuntimeModeContext.tsx
git commit -m "feat(web): initialize SecretStore in RuntimeModeContext"
```

---

### Task 16b: Update pipeline-singleton.ts (server entry point)

**Files:**
- Modify: `apps/web/src/server/pipeline-singleton.ts`

This is the production server entry point that calls `createKnowledgePlatform()`. It must create a server-side SecretStore and pass it to the factory.

- [ ] **Step 1: Read the current file**

Read: `apps/web/src/server/pipeline-singleton.ts`

- [ ] **Step 2: Create InMemorySecretStore and pass to factory**

Import `InMemorySecretStore` from `@klay/core/secrets`. Create an instance and pass it as `secretStore` in the policy object for `createKnowledgePlatform()`. Use `InMemorySecretStore` as a temporary bridge — it will be replaced by `NeDBSecretStore` when encryption is implemented.

Migrate any existing API key env vars into the InMemorySecretStore at initialization:
```typescript
const secretStore = new InMemorySecretStore();
// Migrate env vars to secret store for immediate use
for (const key of ["OPENAI_API_KEY", "COHERE_API_KEY", "HUGGINGFACE_API_KEY"]) {
  const val = process.env[key] ?? import.meta.env[key];
  if (val) await secretStore.set(key, val, { category: "api-key" });
}
```

- [ ] **Step 3: Run production build**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/server/pipeline-singleton.ts
git commit -m "feat(web): pass SecretStore from pipeline-singleton to platform factory"
```

---

### Task 17: Final verification

- [ ] **Step 1: Run all core tests**

Run: `pnpm --filter @klay/core test`
Expected: ALL PASS

- [ ] **Step 2: Run production build**

Run: `pnpm --filter @klay/web build`
Expected: Build succeeds

- [ ] **Step 3: Verify no type errors**

Run: `pnpm --filter @klay/core exec tsc --noEmit` (may have known issues per CLAUDE.md)
Note any new errors introduced by this change.

- [ ] **Step 4: Final commit with all remaining changes**

```bash
git add -A
git status  # verify no unexpected files
git commit -m "chore: final cleanup for universal infrastructure config"
```

---

## Explicitly Deferred Items

The following design spec sections are **intentionally deferred** to future iterations:

| Item | Spec Section | Reason |
|------|-------------|--------|
| **Encrypted SecretStore implementations** (IndexedDBSecretStore, NeDBSecretStore with AES-GCM) | Section 1.4, 1.7 | Requires encryption module design per-runtime. InMemorySecretStore used as bridge. |
| **klay.config.ts loading mechanism** | Section 5 | `defineConfig` helper is ready; dynamic import loader deferred until config file usage is needed. |
| **EmbeddingFingerprint runtime logic** (change detection, stale marking, reprocess flow) | Section 6 | Type is defined; runtime comparison and UI warning flow deferred. |
| **ProviderRequirements expansion** to ~40 providers | Section 10 | Current registry serves existing providers. Expand when new adapters are implemented. |
| **resolveInfrastructureProfile rewrite** for typed unions | Section 4 | This is a large breaking change best done as a dedicated follow-up when consumers are ready to migrate. Current string-based resolution continues to work. |
| **Context-level service factory secretStore threading** | Section 7 | Top-level factories accept secretStore; threading to individual context factories (SourceIngestion, SemanticProcessing, KnowledgeRetrieval) deferred until credential resolution is actually needed at that level. |

## Parallelization Notes

- **Tasks 2, 3, 4, 5** can run in parallel after Task 1 (all depend on ConnectionConfig only)
- **Tasks 6 and 7** can run in parallel (entity types are stable from spec)
- **Tasks 14, 15, 15b, 15c** can run in parallel (independent factory files)
