import type { QueryEmbedder } from "../domain/ports/QueryEmbedder";
import type { VectorReadStore } from "../domain/ports/VectorReadStore";
import type { RankingStrategy } from "../domain/ports/RankingStrategy";
import type { SearchStrategy } from "../domain/ports/SearchStrategy";
import type { SparseReadStore } from "../domain/ports/SparseReadStore";
import type { QueryExpander } from "../domain/ports/QueryExpander";
import type { VectorEntry } from "../../../../platform/vector/VectorEntry";
import type { SemanticQueryUseCases } from "../application";
import type { ConfigStore } from "../../../../platform/config/ConfigStore";
import type { RetrievalConfig } from "../../../../platform/config/InfrastructureProfile";

export interface VectorStoreConfig {
  dbPath?: string;
  dbName?: string;
  sharedEntries?: Map<string, VectorEntry>;
}

export interface SemanticQueryInfrastructurePolicy {
  provider: string;
  vectorStoreConfig: VectorStoreConfig;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  vectorStoreProvider?: string;
  webLLMModelId?: string;
  retrieval?: RetrievalConfig;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
  [key: string]: unknown;
}

export interface ResolvedSemanticQueryInfra {
  queryEmbedder: QueryEmbedder;
  vectorSearch: VectorReadStore;
  rankingStrategy: RankingStrategy;
  searchStrategy: SearchStrategy;
}

export interface SemanticQueryFactoryResult {
  useCases: SemanticQueryUseCases;
  infra: ResolvedSemanticQueryInfra;
}

export async function semanticQueryFactory(
  policy: SemanticQueryInfrastructurePolicy,
): Promise<SemanticQueryFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  const embedderProvider =
    policy.embeddingProvider && policy.embeddingProvider !== "hash"
      ? policy.embeddingProvider
      : "hash";

  const { resolveConfigProvider } = await import("../../../../platform/config/ConfigProvider");
  const config = await resolveConfigProvider(policy);

  const vectorReadStoreRegistry = new ProviderRegistryBuilder<VectorReadStore>()
    .add("in-memory", {
      create: async (p) => {
        const { InMemoryVectorReadStore } = await import(
          "../infrastructure/stores/InMemoryVectorReadStore"
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
          "../infrastructure/stores/IndexedDBVectorReadStore"
        );
        const vectorStoreConfig = (p as SemanticQueryInfrastructurePolicy).vectorStoreConfig;
        const dbName = vectorStoreConfig?.dbName ?? "knowledge-platform";
        return new IndexedDBVectorReadStore(dbName);
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBVectorReadStore } = await import(
          "../infrastructure/stores/NeDBVectorReadStore"
        );
        const vectorStoreConfig = (p as SemanticQueryInfrastructurePolicy).vectorStoreConfig;
        return new NeDBVectorReadStore(vectorStoreConfig?.dbPath);
      },
    })
    .build();

  const queryEmbedderRegistry = new ProviderRegistryBuilder<QueryEmbedder>()
    .add("hash", {
      create: async (p) => {
        const { HashQueryEmbedder } = await import(
          "../infrastructure/embedders/HashQueryEmbedder"
        );
        const dimensions = (p as SemanticQueryInfrastructurePolicy).embeddingDimensions ?? 128;
        return new HashQueryEmbedder(dimensions);
      },
    })
    .add("webllm", {
      create: async (p) => {
        const { WebLLMQueryEmbedder } = await import(
          "../infrastructure/embedders/WebLLMQueryEmbedder"
        );
        const webLLMModelId = (p as SemanticQueryInfrastructurePolicy).webLLMModelId;
        return new WebLLMQueryEmbedder(webLLMModelId);
      },
    })
    .add("openai", {
      create: async (p) => {
        const apiKey = config.require("OPENAI_API_KEY");
        const modelId = ((p as SemanticQueryInfrastructurePolicy).embeddingModel as string) ?? "text-embedding-3-small";
        const { createOpenAI } = await import("@ai-sdk/openai");
        const { AISdkQueryEmbedder } = await import(
          "../infrastructure/embedders/AISdkQueryEmbedder"
        );
        const openai = createOpenAI({ apiKey });
        return new AISdkQueryEmbedder(openai.embedding(modelId));
      },
    })
    .add("cohere", {
      create: async (p) => {
        const apiKey = config.require("COHERE_API_KEY");
        const modelId = ((p as SemanticQueryInfrastructurePolicy).embeddingModel as string) ?? "embed-multilingual-v3.0";
        const { createCohere } = await import(/* @vite-ignore */ "@ai-sdk/cohere");
        const { AISdkQueryEmbedder } = await import(
          "../infrastructure/embedders/AISdkQueryEmbedder"
        );
        const cohere = createCohere({ apiKey });
        return new AISdkQueryEmbedder(cohere.textEmbeddingModel(modelId));
      },
    })
    .add("hf-inference", {
      create: async (p) => {
        const apiKey = config.require("HUGGINGFACE_API_KEY");
        const modelId = ((p as SemanticQueryInfrastructurePolicy).embeddingModel as string) ?? "sentence-transformers/all-MiniLM-L6-v2";
        const { HFInferenceQueryEmbedder } = await import(
          "../infrastructure/embedders/HFInferenceQueryEmbedder"
        );
        return new HFInferenceQueryEmbedder(apiKey, modelId);
      },
    })
    .add("huggingface", {
      create: async (p) => {
        const modelId = ((p as SemanticQueryInfrastructurePolicy).embeddingModel as string) ?? "Xenova/all-MiniLM-L6-v2";
        const { TransformersJSQueryEmbedder } = await import(
          "../infrastructure/embedders/TransformersJSQueryEmbedder"
        );
        const embedder = new TransformersJSQueryEmbedder(modelId);
        await embedder.initialize();
        return embedder;
      },
    })
    .build();

  const vectorProvider = policy.vectorStoreProvider ?? policy.provider;
  const retrieval = policy.retrieval ?? {};

  const [queryEmbedder, vectorSearch] = await Promise.all([
    queryEmbedderRegistry.resolve(embedderProvider).create(policy),
    vectorReadStoreRegistry.resolve(vectorProvider).create(policy),
  ]);

  // ── Search strategy ─────────────────────────────────────────────────
  let searchStrategy: SearchStrategy;

  if (retrieval.search === "hybrid") {
    const sparseStore = await buildSparseStore(vectorProvider, policy);
    const { HybridSearchStrategy } = await import(
      "../infrastructure/search/HybridSearchStrategy"
    );
    searchStrategy = new HybridSearchStrategy(vectorSearch, sparseStore);
  } else {
    const { DenseSearchStrategy } = await import(
      "../infrastructure/search/DenseSearchStrategy"
    );
    searchStrategy = new DenseSearchStrategy(vectorSearch);
  }

  // ── Ranking strategy ────────────────────────────────────────────────
  let rankingStrategy: RankingStrategy;

  if (retrieval.ranking === "mmr") {
    const { MMRRankingStrategy } = await import(
      "../infrastructure/ranking/MMRRankingStrategy"
    );
    rankingStrategy = new MMRRankingStrategy(retrieval.mmrLambda ?? 0.5);
  } else if (retrieval.ranking === "cross-encoder") {
    const { CrossEncoderRankingStrategy } = await import(
      "../infrastructure/ranking/CrossEncoderRankingStrategy"
    );
    rankingStrategy = new CrossEncoderRankingStrategy(
      retrieval.crossEncoderModel ?? "cross-encoder/ms-marco-MiniLM-L-6-v2",
    );
  } else {
    const { PassthroughRankingStrategy } = await import(
      "../infrastructure/ranking/PassthroughRankingStrategy"
    );
    rankingStrategy = new PassthroughRankingStrategy();
  }

  // ── Query expander (optional) ───────────────────────────────────────
  let expander: QueryExpander | undefined;

  // Query expansion requires a language model configured externally;
  // expansion is only active when explicitly set to "multi-query" or "hyde".
  // (No expander built here without a model reference — wired in app layer if needed)

  const infra: ResolvedSemanticQueryInfra = {
    queryEmbedder,
    vectorSearch,
    rankingStrategy,
    searchStrategy,
  };

  const { SemanticQueryUseCases } = await import("../application");
  const useCases = new SemanticQueryUseCases(
    infra.queryEmbedder,
    infra.searchStrategy,
    infra.rankingStrategy,
    expander,
  );

  return { useCases, infra };
}

async function buildSparseStore(
  provider: string,
  policy: SemanticQueryInfrastructurePolicy,
): Promise<import("../domain/ports/SparseReadStore").SparseReadStore> {
  if (provider === "in-memory") {
    const { InMemorySparseReadStore } = await import(
      "../infrastructure/sparse/InMemorySparseReadStore"
    );
    const entries = policy.vectorStoreConfig?.sharedEntries;
    if (!entries) throw new Error("InMemorySparseReadStore requires vectorStoreConfig.sharedEntries");
    return new InMemorySparseReadStore(entries);
  }
  if (provider === "browser") {
    const { IndexedDBSparseReadStore } = await import(
      "../infrastructure/sparse/IndexedDBSparseReadStore"
    );
    const dbName = policy.vectorStoreConfig?.dbName ?? "knowledge-platform";
    return new IndexedDBSparseReadStore(dbName);
  }
  // server (default)
  const { NeDBSparseReadStore } = await import(
    "../infrastructure/sparse/NeDBSparseReadStore"
  );
  return new NeDBSparseReadStore(policy.vectorStoreConfig?.dbPath);
}
