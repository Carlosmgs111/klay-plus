/**
 * Semantic Query Module Factory
 *
 * Entry point for creating the Semantic Query module.
 * Builds provider registries and delegates to Composer for wiring.
 *
 * @example
 * ```typescript
 * const { useCases, infra } = await semanticQueryFactory({
 *   provider: "in-memory",
 *   vectorStoreConfig: { sharedEntries: myEntriesMap },
 * });
 * await useCases.executeSemanticQuery.execute({ text: "query" });
 * ```
 */

import type {
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
} from "./infra-policies.js";
import type { SemanticQueryUseCases } from "../application/index.js";
import type { QueryEmbedder } from "../domain/ports/QueryEmbedder.js";
import type { VectorReadStore } from "../domain/ports/VectorReadStore.js";
import type { ConfigProvider } from "../../../../platform/config/index.js";

// ─── Factory Result Contract ─────────────────────────────────────────────────

export interface SemanticQueryFactoryResult {
  /** Assembled use cases ready for consumption */
  useCases: SemanticQueryUseCases;
  /**
   * Resolved infrastructure.
   * Exposed for facade coordination (e.g., embedder or vector search access).
   * Should NOT be used directly by external consumers.
   */
  infra: ResolvedSemanticQueryInfra;
}

// ─── Config Resolution ──────────────────────────────────────────────────────

async function resolveConfigProvider(
  policy: SemanticQueryInfrastructurePolicy,
): Promise<ConfigProvider> {
  if (policy.configOverrides) {
    const { InMemoryConfigProvider } = await import(
      "../../../../platform/config/InMemoryConfigProvider.js"
    );
    return new InMemoryConfigProvider(policy.configOverrides);
  }
  const { NodeConfigProvider } = await import(
    "../../../../platform/config/NodeConfigProvider.js"
  );
  return new NodeConfigProvider();
}

// ─── Factory Function ────────────────────────────────────────────────────────

export async function semanticQueryFactory(
  policy: SemanticQueryInfrastructurePolicy,
): Promise<SemanticQueryFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder.js"
  );

  // ─── Determine embedder provider name ────────────────────────────────────
  const embedderProvider =
    policy.embeddingProvider && policy.embeddingProvider !== "hash"
      ? policy.embeddingProvider
      : policy.provider === "browser"
        ? "browser-webllm"
        : "hash";

  // ─── Resolve ConfigProvider for AI embedder factories ────────────────────
  const config = await resolveConfigProvider(policy);

  // ─── VectorReadStore Registry ────────────────────────────────────────────
  const vectorReadStoreRegistry = new ProviderRegistryBuilder<VectorReadStore>()
    .add("in-memory", {
      create: async (p) => {
        const { InMemoryVectorReadStore } = await import(
          "../infrastructure/adapters/InMemoryVectorReadStore.js"
        );
        const vectorStoreConfig = (p as SemanticQueryInfrastructurePolicy).vectorStoreConfig;
        if (!vectorStoreConfig?.sharedEntries) {
          throw new Error(
            "InMemoryVectorReadStore requires vectorStoreConfig.sharedEntries",
          );
        }
        return new InMemoryVectorReadStore(vectorStoreConfig.sharedEntries);
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBVectorReadStore } = await import(
          "../infrastructure/adapters/IndexedDBVectorReadStore.js"
        );
        const vectorStoreConfig = (p as SemanticQueryInfrastructurePolicy).vectorStoreConfig;
        const dbName = vectorStoreConfig?.dbName ?? "knowledge-platform";
        return new IndexedDBVectorReadStore(dbName);
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBVectorReadStore } = await import(
          "../infrastructure/adapters/NeDBVectorReadStore.js"
        );
        const vectorStoreConfig = (p as SemanticQueryInfrastructurePolicy).vectorStoreConfig;
        return new NeDBVectorReadStore(vectorStoreConfig?.dbPath);
      },
    })
    .build();

  // ─── QueryEmbedder Registry ──────────────────────────────────────────────
  const queryEmbedderRegistry = new ProviderRegistryBuilder<QueryEmbedder>()
    .add("hash", {
      create: async (p) => {
        const { HashQueryEmbedder } = await import(
          "../infrastructure/adapters/HashQueryEmbedder.js"
        );
        const dimensions = (p as SemanticQueryInfrastructurePolicy).embeddingDimensions ?? 128;
        return new HashQueryEmbedder(dimensions);
      },
    })
    .add("browser-webllm", {
      create: async (p) => {
        const { WebLLMQueryEmbedder } = await import(
          "../infrastructure/adapters/WebLLMQueryEmbedder.js"
        );
        const webLLMModelId = (p as SemanticQueryInfrastructurePolicy).webLLMModelId;
        const embedder = new WebLLMQueryEmbedder(webLLMModelId);
        await embedder.initialize();
        return embedder;
      },
    })
    .add("openai", {
      create: async (p) => {
        const apiKey = config.require("OPENAI_API_KEY");
        const modelId = ((p as SemanticQueryInfrastructurePolicy).embeddingModel as string) ?? "text-embedding-3-small";
        const { createOpenAI } = await import("@ai-sdk/openai");
        const { AISdkQueryEmbedder } = await import(
          "../infrastructure/adapters/AISdkQueryEmbedder.js"
        );
        const openai = createOpenAI({ apiKey });
        return new AISdkQueryEmbedder(openai.embedding(modelId));
      },
    })
    .add("cohere", {
      create: async (p) => {
        const apiKey = config.require("COHERE_API_KEY");
        const modelId = ((p as SemanticQueryInfrastructurePolicy).embeddingModel as string) ?? "embed-multilingual-v3.0";
        const { createCohere } = await import("@ai-sdk/cohere");
        const { AISdkQueryEmbedder } = await import(
          "../infrastructure/adapters/AISdkQueryEmbedder.js"
        );
        const cohere = createCohere({ apiKey });
        return new AISdkQueryEmbedder(cohere.textEmbeddingModel(modelId));
      },
    })
    .add("huggingface", {
      create: async (p) => {
        const apiKey = config.require("HUGGINGFACE_API_KEY");
        const modelId = ((p as SemanticQueryInfrastructurePolicy).embeddingModel as string) ?? "sentence-transformers/all-MiniLM-L6-v2";
        const { createHuggingFace } = await import("@ai-sdk/huggingface");
        const { AISdkQueryEmbedder } = await import(
          "../infrastructure/adapters/AISdkQueryEmbedder.js"
        );
        const hf = createHuggingFace({ apiKey });
        return new AISdkQueryEmbedder(hf.textEmbeddingModel(modelId));
      },
    })
    .build();

  // ─── Compose ─────────────────────────────────────────────────────────────
  const { SemanticQueryComposer } = await import("./SemanticQueryComposer.js");
  const infra = await SemanticQueryComposer.resolve(policy, embedderProvider, {
    vectorReadStore: vectorReadStoreRegistry,
    queryEmbedder: queryEmbedderRegistry,
  });

  // 2. Construct use cases with resolved dependencies
  const { SemanticQueryUseCases } = await import("../application/index.js");
  const useCases = new SemanticQueryUseCases(
    infra.queryEmbedder,
    infra.vectorSearch,
    infra.rankingStrategy,
  );

  return { useCases, infra };
}
