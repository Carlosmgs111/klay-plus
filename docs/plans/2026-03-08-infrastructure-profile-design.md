# Infrastructure Profile: Per-Axis Infrastructure Composition

## Problem

A single `provider: "browser" | "server" | "in-memory"` string drives ALL infrastructure axes: persistence, vector stores, document storage, and embeddings. This couples technology choice to runtime — the user can't pick IndexedDB for persistence but OpenAI for embeddings, or keep hash embeddings but switch vector stores independently.

## Solution

`InfrastructureProfile` decomposes infrastructure into 4 independent axes, each configurable separately. The existing `ProviderRegistryBuilder` mechanism stays unchanged — only the fan-out logic at the factory level changes.

## Architecture

### InfrastructureProfile (4-axis tuple)

```ts
interface InfrastructureProfile {
  persistence: string;        // "in-memory" | "browser" | "server"
  vectorStore: string;        // "in-memory" | "browser" | "server"
  documentStorage: string;    // "in-memory" | "browser" | "server"
  embedding: string;          // "hash" | "browser-webllm" | "openai" | "cohere" | "huggingface"
  embeddingModel?: string;
  embeddingDimensions?: number;
}
```

### Resolution Priority

`resolveInfrastructureProfile(policy)` resolves a full profile from broadest to most specific:

1. **Default expansion** — `provider: "browser"` → full browser profile via `DEFAULT_PROFILES`
2. **ConfigStore** — persisted profile from `__INFRA_PROFILE__` key in ConfigStore
3. **Legacy fields** — `embeddingProvider`, `embeddingModel`, `embeddingDimensions`
4. **Explicit overrides** — `infrastructure: Partial<InfrastructureProfile>` (highest priority)

This ensures backward compatibility: `createKnowledgePipeline({ provider: "in-memory" })` works unchanged.

### Provider Registry with Runtime Validation

Each provider declares which runtimes it supports:

```ts
interface ProviderMetadata {
  id: string;
  name: string;
  description: string;
  axis: InfrastructureAxis;
  runtimes: RuntimeEnvironment[];  // ["browser"] | ["server"] | ["browser", "server", "test"]
  requirements: ProviderRequirement[];
  models?: EmbeddingModelSpec[];   // only for embedding axis
}
```

`getProvidersForAxis(axis, runtime)` returns only providers compatible with the current runtime. The UI uses this for **static validation** — impossible to select an incompatible provider.

### Embedding Model Catalog

Each embedding provider declares its available models with pre-configured dimensions:

```ts
interface EmbeddingModelSpec {
  id: string;           // "text-embedding-3-small"
  name: string;         // "Text Embedding 3 Small"
  dimensions: number;   // 1536
  isDefault?: boolean;
}
```

When the user changes embedding provider, the UI auto-selects the default model and sets dimensions automatically. No need to know the correct dimensions for each model.

### Factory Fan-Out

Profile decomposition happens at the service/pipeline level — **leaf factories don't change**. They keep receiving `provider: string` and resolving via their existing registries.

```
KnowledgePipelinePolicy { provider, infrastructure? }
  → resolveInfrastructureProfile(policy) → full profile
  → createSourceIngestionService({ provider: profile.persistence, documentStorageProvider: profile.documentStorage })
  → createSemanticProcessingService({ provider: profile.persistence, vectorStoreProvider: profile.vectorStore, embeddingProvider: profile.embedding })
  → createKnowledgeRetrievalService({ provider: profile.persistence, vectorStoreProvider: profile.vectorStore, embeddingProvider: profile.embedding })
```

Same pattern applies to `KnowledgeLifecyclePolicy` and `KnowledgeManagementPolicy`.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Validation strategy | Static filtering by runtime | Impossible to select incompatible combinations; simpler than warnings |
| UI location | Settings Page, both modes | Single place, consistent experience |
| Model selection | Provider + model + dimensions | Auto-configured dimensions prevent misconfiguration |
| Deployment targets | Browser + Node.js local (current) | Design supports future targets without model changes |
| Local server embedding | Deferred (Ollama / Transformers.js) | Investigate later; model already supports it as a new provider entry |
| Future adapters (Postgres, Qdrant, etc.) | Deferred | Only need a new `ProviderMetadata` entry + adapter implementation |

## Current Provider Registry

### Persistence
| Provider | Runtimes | Implementation |
|----------|----------|----------------|
| in-memory | browser, server, test | Map-based |
| browser | browser | IndexedDB |
| server | server | NeDB |

### Vector Store
| Provider | Runtimes | Implementation |
|----------|----------|----------------|
| in-memory | browser, server, test | Map-based |
| browser | browser | IndexedDB |
| server | server | NeDB |

### Document Storage
| Provider | Runtimes | Implementation |
|----------|----------|----------------|
| in-memory | browser, server, test | Map-based |
| browser | browser | In-memory (no IndexedDB for blobs) |
| server | server | Filesystem (fs/promises) |

### Embedding
| Provider | Runtimes | Models | API Key |
|----------|----------|--------|---------|
| hash | all | hash-128 (128d), hash-256 (256d) | No |
| browser-webllm | browser | all-MiniLM-L6-v2 (384d) | No |
| openai | browser, server | text-embedding-3-small (1536d), text-embedding-3-large (3072d), ada-002 (1536d) | OPENAI_API_KEY |
| cohere | browser, server | embed-multilingual-v3 (1024d), embed-english-v3 (1024d), embed-multilingual-light-v3 (384d) | COHERE_API_KEY |
| huggingface | browser, server | all-MiniLM-L6-v2 (384d), all-mpnet-base-v2 (768d) | HUGGINGFACE_API_KEY |

## Files Changed

### New (3 core + 2 test)
- `packages/core/src/platform/config/InfrastructureProfile.ts`
- `packages/core/src/platform/config/resolveInfrastructureProfile.ts`
- `packages/core/src/platform/config/ProviderRequirements.ts`
- `packages/core/src/platform/config/__tests__/InfrastructureProfile.test.ts`
- `packages/core/src/platform/config/__tests__/ProviderRequirements.test.ts`

### Modified core (10)
- `packages/core/src/platform/config/index.ts` — exports
- `packages/core/src/application/knowledge-pipeline/composition/knowledge-pipeline.factory.ts`
- `packages/core/src/application/knowledge-lifecycle/composition/knowledge-lifecycle.factory.ts`
- `packages/core/src/application/knowledge-management/composition/knowledge-management.factory.ts`
- `packages/core/src/contexts/source-ingestion/composition/factory.ts` — `documentStorageProvider`
- `packages/core/src/contexts/semantic-processing/composition/factory.ts` — `vectorStoreProvider`
- `packages/core/src/contexts/semantic-processing/projection/composition/factory.ts` — split vector store resolution
- `packages/core/src/contexts/knowledge-retrieval/composition/factory.ts` — `vectorStoreProvider`
- `packages/core/src/contexts/knowledge-retrieval/semantic-query/composition/factory.ts` — split vector store resolution

### Modified web (4)
- `apps/web/src/services/browser-pipeline-service.ts` — accept profile
- `apps/web/src/services/browser-lifecycle-service.ts` — accept profile
- `apps/web/src/contexts/RuntimeModeContext.tsx` — manage profile state
- `apps/web/src/components/features/settings/SettingsPage.tsx` — per-axis UI with runtime filtering + model selector

## Future Work

- **Local server embedding**: Ollama (HTTP-based, user installs separately) or Transformers.js (ONNX in Node.js, zero external deps)
- **Production adapters**: PostgreSQL, MongoDB (persistence); Qdrant, Weaviate, Chroma (vector store); Cloudinary, S3 (document storage)
- **Edge runtime support**: Would add `"edge"` to `RuntimeEnvironment` and filter out adapters that need Node.js APIs
- **Docker deployment**: Dockerfile with env-var-driven profile resolution
