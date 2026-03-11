# Universal Infrastructure Configuration — Design Spec

**Date**: 2026-03-11
**Status**: Approved
**Scope**: `@klay/core` platform/config + `@klay/web` dashboard

## Problem Statement

The current `InfrastructureProfile` uses opaque strings (`"server"`, `"browser"`, `"in-memory"`) to select technology providers, but lacks a structured way to configure those technologies. Connection strings, credentials, API keys, database paths, and provider-specific settings are scattered across environment variables, `ConfigStore` key-value pairs, and hardcoded factory defaults.

This design introduces:
1. A **SecretStore** — centralized credential management with encryption at rest
2. **Typed provider configs** — discriminated unions per infrastructure axis
3. **Declarative config file** — `klay.config.ts` for reproducible infrastructure setup
4. **Adaptive UI** — forms that change based on selected provider

## Goals

- **Universal**: Any provider in any axis configurable through the same structure
- **Extensible**: Adding a new provider (e.g., PostgreSQL, Pinecone) = adding a union member + adapter
- **Secure**: Credentials encrypted at rest, never stored in config files
- **Type-safe**: TypeScript validates required fields per provider at compile time
- **Dual-runtime**: Works in both browser (IndexedDB SecretStore) and server (NeDB SecretStore)

## Non-Goals

- Implementing new adapter classes (PostgreSQL, Pinecone, etc.) — this design defines the config layer only
- OAuth/OIDC flows — out of scope for v1
- Automatic credential rotation — metadata tracks rotation dates but doesn't automate

---

## 1. SecretStore — Centralized Credential Management

### 1.1 Concept

A first-class platform capability that manages all credentials with atomic CRUD operations. Infrastructure configs reference secrets by key (`authRef`), never by value.

### 1.2 ManagedSecret Entity

```typescript
interface ManagedSecret {
  id: string;                          // UUID
  name: string;                        // Human-readable: "OpenAI Production Key"
  key: string;                         // Reference key: "OPENAI_API_KEY"
  category: SecretCategory;
  value: EncryptedValue;               // AES-GCM encrypted at rest
  scope: 'global' | 'profile';        // Global = available to all, Profile = bound to one profile
  metadata?: {
    provider?: string;                 // "openai", "postgresql", etc.
    description?: string;
    expiresAt?: Date;
    lastRotatedAt?: Date;
    lastUsedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

type SecretCategory =
  | 'api-key'              // OpenAI, Cohere, Pinecone, etc.
  | 'credential'           // username + password (DB auth)
  | 'connection-string'    // Full URI with embedded credentials
  | 'certificate'          // TLS certs, service account keys
  | 'token';               // Bearer tokens, SAS tokens, session tokens
```

### 1.3 SecretStore Port

```typescript
/** Metadata for secret creation/update (subset of ManagedSecret) */
interface SecretMetadata {
  name?: string;                  // Human-readable label
  category?: SecretCategory;      // api-key, credential, connection-string, certificate, token
  scope?: 'global' | 'profile';  // Default: 'global'
  provider?: string;              // Associated provider ("openai", "postgresql")
  description?: string;
  expiresAt?: Date;
}

/** Summary returned by list() — never includes the decrypted value */
interface ManagedSecretSummary {
  key: string;
  name?: string;
  category?: SecretCategory;
  scope: 'global' | 'profile';
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SecretStore {
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

### 1.4 Encryption

- **Algorithm**: AES-256-GCM
- **Key derivation**: PBKDF2 from a master passphrase (browser: user-provided or device-derived; server: env var `KLAY_MASTER_KEY` or auto-generated on first run)
- **Storage**: Encrypted value + IV + auth tag stored together; key stored separately from encrypted data
- **Browser**: Uses Web Crypto API (`crypto.subtle`) — `encryption.browser.ts`
- **Server**: Uses Node.js `crypto` module — `encryption.server.ts`
- **Pattern**: Each SecretStore implementation imports its runtime-specific encryption module directly (no conditional imports). This follows the project's existing dual-runtime adapter pattern.

### 1.5 Relationship with Existing ConfigStore

The current `ConfigStore` interface serves two purposes that must be separated:

1. **Credential storage** (API keys, passwords) → migrates to `SecretStore` (encrypted)
2. **Structural config persistence** (selected infrastructure profile, UI preferences) → stays in `ConfigStore` (plain key-value)

**Migration plan**:
- `ConfigStore` is **retained** for non-secret key-value persistence (e.g., `__INFRA_PROFILE__` JSON, user preferences)
- `SecretStore` is a **new, separate** port for credential management with encryption
- During migration, the `SecretResolver` checks both stores: if a key exists in `ConfigStore` (legacy unencrypted), it auto-migrates to `SecretStore` (encrypted) and removes from `ConfigStore`
- Factory signatures change from `configStore: ConfigStore` to `{ configStore: ConfigStore; secretStore: SecretStore }` — both are passed

**Post-migration**: `ConfigStore` holds only non-sensitive config. `SecretStore` holds all credentials. The two never overlap.

### 1.6 Resolution Cascade

When a provider needs a credential (e.g., `OPENAI_API_KEY`):

```
1. SecretStore.get(key)        → primary source (encrypted in IndexedDB/NeDB)
2. process.env[key]            → SERVER-ONLY fallback (Node.js env vars / .env)
3. import.meta.env[key]        → SERVER-ONLY fallback (Astro server routes only;
                                  client-side only sees PUBLIC_* prefixed vars)
4. → Error: "Missing credential: {key}. Set it via dashboard or environment variable."
```

**Note**: In browser runtime, only step 1 applies. Steps 2-3 are server-only. Browser users must configure credentials through the dashboard UI (which persists to IndexedDB SecretStore).

### 1.6 Implementations

| Implementation | Runtime | Storage |
|---|---|---|
| `InMemorySecretStore` | test | `Map<string, string>` (no encryption) |
| `IndexedDBSecretStore` | browser | IndexedDB with Web Crypto encryption |
| `NeDBSecretStore` | server | NeDB file with Node crypto encryption |

---

## 2. Connection Config — Universal Connection Types

Shared types for any provider that connects to a resource:

```typescript
/** Local file-based resource */
interface LocalConnection {
  kind: 'local';
  path: string;
}

/** Network resource */
interface NetworkConnection {
  kind: 'network';
  url?: string;          // Full URI (overrides host+port)
  host?: string;
  port?: number;
  ssl?: boolean;
}

/** In-process / browser-native resource */
interface EmbeddedConnection {
  kind: 'embedded';
  databaseName?: string;  // IndexedDB database name
}

type ConnectionConfig = LocalConnection | NetworkConnection | EmbeddedConnection;
```

---

## 3. Infrastructure Config — Discriminated Unions Per Axis

### 3.1 Persistence (Document Databases)

```typescript
type PersistenceConfig =
  | { type: 'in-memory' }
  | { type: 'indexeddb'; databaseName?: string }
  | { type: 'nedb'; path?: string }
  | { type: 'sqlite'; path: string; readonly?: boolean }
  | { type: 'postgresql';
      connection: NetworkConnection;
      authRef?: string;
      database: string;
      schema?: string;
      pool?: { min?: number; max?: number; idleTimeoutMs?: number }; }
  | { type: 'mongodb';
      connection: NetworkConnection;
      authRef?: string;
      database: string;
      authSource?: string;
      replicaSet?: string; };
```

### 3.2 Vector Store

```typescript
type VectorStoreConfig =
  | { type: 'in-memory'; dimensions: number; distanceMetric?: DistanceMetric }
  | { type: 'indexeddb'; dimensions: number; databaseName?: string; distanceMetric?: DistanceMetric }
  | { type: 'nedb'; dimensions: number; path?: string; distanceMetric?: DistanceMetric }
  | { type: 'pgvector';
      connection: NetworkConnection;
      authRef?: string;
      dimensions: number;
      tableName?: string;
      distanceMetric?: DistanceMetric;
      indexType?: 'hnsw' | 'ivfflat'; }
  | { type: 'pinecone';
      authRef: string;
      indexName: string;
      namespace?: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
      cloud?: string;
      region?: string; }
  | { type: 'qdrant';
      connection: NetworkConnection;
      authRef?: string;
      collectionName: string;
      dimensions: number;
      distanceMetric?: DistanceMetric; }
  | { type: 'chromadb';
      connection: NetworkConnection;
      authRef?: string;
      collectionName: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
      tenant?: string; }
  | { type: 'weaviate';
      connection: NetworkConnection;
      authRef?: string;
      className: string;
      dimensions: number;
      distanceMetric?: DistanceMetric; }
  | { type: 'milvus';
      connection: NetworkConnection;
      authRef?: string;
      collectionName: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
      indexType?: 'hnsw' | 'ivfflat' | 'flat'; };

type DistanceMetric = 'cosine' | 'euclidean' | 'dotProduct';
```

### 3.3 Embedding Provider

```typescript
type EmbeddingConfig =
  | { type: 'hash'; dimensions?: number }
  | { type: 'webllm'; model?: string }
  | { type: 'openai'; authRef: string; model: string; dimensions?: number; baseUrl?: string }
  | { type: 'cohere'; authRef: string; model: string; dimensions?: number }
  | { type: 'huggingface'; authRef: string; model: string; endpointUrl?: string }
  | { type: 'ollama'; model: string; baseUrl?: string }
  | { type: 'bedrock'; authRef: string; model: string; region: string }
  | { type: 'vertex-ai'; authRef: string; model: string; location: string }
  | { type: 'azure-openai'; authRef: string; model: string; deploymentName: string; apiVersion?: string }
  | { type: 'voyage-ai'; authRef: string; model: string; dimensions?: number };
```

### 3.4 File Storage

```typescript
type DocumentStorageConfig =
  | { type: 'in-memory' }
  | { type: 'local'; basePath: string }
  | { type: 'browser' }
  | { type: 's3'; authRef: string; bucket: string; region: string; prefix?: string; endpoint?: string }
  | { type: 'gcs'; authRef: string; bucket: string; prefix?: string }
  | { type: 'azure-blob'; authRef: string; container: string; prefix?: string }
  | { type: 'minio'; connection: NetworkConnection; authRef: string; bucket: string; prefix?: string };
```

### 3.5 LLM Provider (Future)

```typescript
type LLMConfig =
  | { type: 'openai'; authRef: string; model: string; baseUrl?: string }
  | { type: 'anthropic'; authRef: string; model: string }
  | { type: 'cohere'; authRef: string; model: string }
  | { type: 'ollama'; model: string; baseUrl?: string }
  | { type: 'bedrock'; authRef: string; model: string; region: string }
  | { type: 'vertex-ai'; authRef: string; model: string; location: string }
  | { type: 'azure-openai'; authRef: string; model: string; deploymentName: string; apiVersion?: string };
```

---

## 4. InfrastructureProfile — Evolved

```typescript
interface InfrastructureProfile {
  id: string;
  name: string;
  persistence: PersistenceConfig;
  vectorStore: VectorStoreConfig;
  embedding: EmbeddingConfig;
  documentStorage: DocumentStorageConfig;
  llm?: LLMConfig;
}
```

### 4.1 Profile Identity and Storage

- **`id`**: For preset profiles, the id is the preset key (`"in-memory"`, `"browser"`, `"server"`). For user-created profiles, a UUID is generated at creation time.
- **`name`**: User-editable display name.
- **Storage**: The active profile is persisted as JSON in `ConfigStore` under the `__INFRA_PROFILE__` key (same mechanism as today, but with the new typed structure). Custom profiles are stored in a `__PROFILES__` key as a JSON array. Preset profiles are always available in code and never persisted.
- **CRUD**: Users can create, clone, edit, and delete custom profiles via the dashboard. Presets cannot be deleted but can be cloned and customized.

### 4.2 Preset Profiles (Backward Compatibility)

```typescript
const PRESET_PROFILES: Record<string, InfrastructureProfile> = {
  'in-memory': {
    id: 'in-memory',
    name: 'In-Memory (Testing)',
    persistence: { type: 'in-memory' },
    vectorStore: { type: 'in-memory', dimensions: 128 },
    embedding: { type: 'hash', dimensions: 128 },
    documentStorage: { type: 'in-memory' },
  },
  'browser': {
    id: 'browser',
    name: 'Browser',
    persistence: { type: 'indexeddb' },
    vectorStore: { type: 'indexeddb', dimensions: 384 },
    embedding: { type: 'webllm', model: 'Xenova/all-MiniLM-L6-v2' },
    documentStorage: { type: 'browser' },
  },
  'server': {
    id: 'server',
    name: 'Server (NeDB)',
    persistence: { type: 'nedb' },
    vectorStore: { type: 'nedb', dimensions: 128 },
    embedding: { type: 'hash', dimensions: 128 },
    documentStorage: { type: 'local', basePath: './data/uploads' },
  },
};
```

---

## 5. Declarative Config File — klay.config.ts

```typescript
// klay.config.ts
import { defineConfig } from '@klay/core/config';

export default defineConfig({
  profiles: {
    development: {
      persistence: { type: 'nedb', path: './data/dev' },
      vectorStore: { type: 'nedb', dimensions: 1536, path: './data/dev' },
      embedding: { type: 'openai', authRef: 'OPENAI_API_KEY', model: 'text-embedding-3-small' },
      documentStorage: { type: 'local', basePath: './data/dev/uploads' },
    },
    production: {
      persistence: {
        type: 'postgresql',
        connection: { kind: 'network', host: 'db.prod.com', port: 5432, ssl: true },
        authRef: 'PG_CREDENTIALS',
        database: 'klay',
      },
      vectorStore: {
        type: 'pinecone',
        authRef: 'PINECONE_API_KEY',
        indexName: 'klay-prod',
        dimensions: 1536,
      },
      embedding: { type: 'openai', authRef: 'OPENAI_API_KEY', model: 'text-embedding-3-small' },
      documentStorage: { type: 's3', authRef: 'AWS_CREDENTIALS', bucket: 'klay-prod', region: 'us-east-1' },
    },
    browser: {
      persistence: { type: 'indexeddb' },
      vectorStore: { type: 'indexeddb', dimensions: 384 },
      embedding: { type: 'webllm', model: 'Xenova/all-MiniLM-L6-v2' },
      documentStorage: { type: 'browser' },
    },
  },
});
```

### Resolution Cascade

```
Priority (highest to lowest):
1. UI (SecretStore)             — values saved by user in dashboard
2. klay.config.ts               — declarative structural config
3. Environment variables         — .env or process.env (server-side)
4. System defaults               — preset profiles ("in-memory", "browser", "server")
```

**Rule**: Secrets NEVER go in `klay.config.ts`. The file only declares structure + `authRef`. Actual credential values resolve from SecretStore or environment variables.

### Config File Loading

- **Server runtime**: `klay.config.ts` is dynamically imported at startup via `await import(path.resolve('klay.config.ts'))`. Vite/esbuild handles the TypeScript transpilation.
- **Browser runtime**: `klay.config.ts` is **not loaded**. Browser profiles are configured exclusively through the dashboard UI and persisted in IndexedDB. The config file is a server-side/CI concern only.
- **Astro integration**: The Astro dev server and build process load the config file during SSR initialization. The resolved profile is used by `pipeline-singleton.ts` to create the server-side pipeline.

### Startup Validation

When loading a profile, the system validates:
1. All required `authRef` keys have values (in SecretStore or env vars)
2. Required fields are present (e.g., `database` for PostgreSQL)
3. Embedding dimensions are consistent between vectorStore and embedding config
4. Providers are compatible with current runtime (e.g., `indexeddb` only in browser)

---

## 6. Embedding Migration Safety

### EmbeddingFingerprint

Each knowledge context stores a fingerprint of the embedding used to process it:

```typescript
interface EmbeddingFingerprint {
  provider: string;       // "openai"
  model: string;          // "text-embedding-3-small"
  dimensions: number;     // 1536
  baseUrl?: string;       // Distinguishes Azure OpenAI vs direct OpenAI endpoints
}
```

### Change Detection Flow

```
User changes embedding in profile
  │
  ├─ No existing contexts with vectors → Apply change directly ✓
  │
  └─ Existing contexts found →
      │
      ├─ Compatible (same model+dimensions) → Apply change ✓
      │
      └─ Incompatible →
          │
          ├─ Show warning:
          │   "N contexts have vectors with {old} dimensions.
          │    New model generates {new} dimensions.
          │    Existing contexts need reprocessing."
          │
          └─ Options:
              ├─ [Reprocess now]    → batch reprocess all affected contexts
              ├─ [Reprocess later]  → save profile, mark contexts as "stale"
              └─ [Cancel]           → no change
```

---

## 7. Factory Integration

### Before (current)

```typescript
createKnowledgePipeline({
  provider: "server",
  dbPath: "./data",
  embeddingProvider: "openai",
  embeddingModel: "text-embedding-3-small",
  configStore: nedbConfigStore,
})
```

### After

```typescript
createKnowledgePipeline({
  profile: resolvedInfrastructureProfile,  // fully typed object
  secretStore: secretStore,                 // resolves authRefs lazily
})
```

Internal factories extract from `profile.persistence`, `profile.vectorStore`, etc. to instantiate the correct adapters. The `secretStore` resolves credentials at the moment they are needed.

### Policy Field Migration Map

| Current Policy Field | New Location | Notes |
|---|---|---|
| `provider` | Derived from `profile.persistence.type` | No longer a top-level string |
| `dbPath` | `profile.persistence.path` (NeDB) | Embedded in typed config |
| `dbName` | `profile.persistence.databaseName` (IndexedDB) | Embedded in typed config |
| `embeddingProvider` | `profile.embedding.type` | Part of discriminated union |
| `embeddingModel` | `profile.embedding.model` | Part of discriminated union |
| `embeddingDimensions` | `profile.embedding.dimensions` / `profile.vectorStore.dimensions` | Explicit per-axis |
| `configStore` | Stays as `configStore: ConfigStore` | Non-secret config persistence |
| `configOverrides` | Removed — use `InMemoryConfigStore` in tests | Legacy compatibility dropped |
| `defaultChunkingStrategy` | Stays on `KnowledgePipelinePolicy` | Not an infrastructure concern — belongs to ProcessingProfile |
| `infrastructure` | Replaced by the entire typed `profile` object | No more `Partial<InfrastructureProfile>` overrides |

---

## 8. UI Behavior

### Adaptive Form

When the user selects a provider in a dropdown:
1. The form below the dropdown changes to show fields specific to that provider
2. Structural fields (host, port, database, model) are standard inputs
3. Credential fields (🔑) are password inputs that save to SecretStore on blur/submit
4. If a credential already exists in SecretStore, shows masked value with edit option
5. Credentials are reused across axes — if OpenAI embedding and LLM both need `OPENAI_API_KEY`, the field shows "Using existing" instead of asking again

### Test Connection

Each axis section has a "Test Connection" / "Test Embedding" button that:
1. Resolves the config + credentials
2. Attempts a minimal operation (DB ping, single-vector embed, file list)
3. Shows success/failure with error details

---

## 9. Authentication Patterns

All ~40 researched providers reduce to 5 auth patterns, handled through the SecretStore:

| Pattern | SecretStore Category | Providers |
|---------|---------------------|-----------|
| None | — | NeDB, SQLite, in-memory, Hash, WebLLM |
| API Key | `api-key` | OpenAI, Cohere, Pinecone, Qdrant, Voyage, etc. |
| Username/Password | `credential` | PostgreSQL, MongoDB, CouchDB, Milvus |
| Cloud IAM | `certificate` | AWS (accessKeyId+secret), GCP (service account), Azure |
| Connection String | `connection-string` | PostgreSQL URI, MongoDB URI, Azure Blob |

The infrastructure config types use `authRef: string` to point to the SecretStore key. The resolution layer maps the key to the appropriate auth mechanism for the provider.

---

## 10. File Structure (Proposed)

```
packages/core/src/platform/
├── config/
│   ├── InfrastructureProfile.ts     ← evolved type definitions (id, name, typed axes)
│   ├── ConnectionConfig.ts          ← LocalConnection, NetworkConnection, EmbeddedConnection
│   ├── PersistenceConfig.ts         ← discriminated union
│   ├── VectorStoreConfig.ts         ← discriminated union + DistanceMetric type
│   ├── EmbeddingConfig.ts           ← discriminated union + EmbeddingFingerprint
│   ├── DocumentStorageConfig.ts     ← discriminated union (aligned with existing axis name)
│   ├── LLMConfig.ts                 ← discriminated union (future, field reserved on profile)
│   ├── ProviderRequirements.ts      ← EVOLVES existing file: UI metadata (fields, models per provider)
│   ├── presets.ts                   ← PRESET_PROFILES (backward compat)
│   ├── defineConfig.ts              ← klay.config.ts helper
│   ├── validation.ts                ← startup validation logic
│   ├── ConfigStore.ts               ← RETAINED for non-secret config (profiles, preferences)
│   ├── InMemoryConfigStore.ts       ← retained
│   ├── NeDBConfigStore.ts           ← retained
│   ├── IndexedDBConfigStore.ts      ← retained (browser export path)
│   └── index.ts                     ← barrel exports
├── secrets/
│   ├── SecretStore.ts               ← port interface
│   ├── ManagedSecret.ts             ← entity + SecretMetadata + ManagedSecretSummary
│   ├── encryption.browser.ts        ← AES-GCM via Web Crypto API
│   ├── encryption.server.ts         ← AES-GCM via Node.js crypto
│   ├── InMemorySecretStore.ts       ← test implementation (no encryption)
│   ├── IndexedDBSecretStore.ts      ← browser implementation
│   ├── NeDBSecretStore.ts           ← server implementation
│   ├── SecretResolver.ts            ← cascade resolution (store → env → error)
│   └── index.ts
```

**Note on ProviderRegistry naming**: The existing `ProviderRegistryBuilder` (in `platform/composition/`) and `ProviderRegistry` interface (in `shared/domain/`) handle factory-level provider resolution (a different concern). `ProviderRequirements.ts` in `config/` is the UI metadata registry that evolves to describe fields and models per provider for the adaptive forms. These are separate concerns that coexist.
