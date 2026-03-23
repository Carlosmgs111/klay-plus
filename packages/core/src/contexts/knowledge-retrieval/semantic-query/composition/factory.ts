import type { QueryEmbedder } from "../domain/ports/QueryEmbedder";
import type { VectorReadStore } from "../domain/ports/VectorReadStore";
import type { RankingStrategy } from "../domain/ports/RankingStrategy";
import type { SearchStrategy } from "../domain/ports/SearchStrategy";
import type { SparseReadStore } from "../domain/ports/SparseReadStore";
import type { QueryExpander } from "../domain/ports/QueryExpander";
import type { VectorEntry } from "../../../../shared/vector/VectorEntry";
import type { SemanticQueryUseCases } from "../application";
import type { ConfigStore } from "../../../../config/ConfigStore";
import type { RetrievalConfig } from "../../../../config/InfrastructureProfile";

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

async function resolveVectorReadStore(
  provider: string,
  policy: SemanticQueryInfrastructurePolicy,
): Promise<VectorReadStore> {
  switch (provider) {
    case "browser": {
      const { IndexedDBVectorReadStore } = await import(
        "../infrastructure/stores/IndexedDBVectorReadStore"
      );
      const dbName = policy.vectorStoreConfig?.dbName ?? "knowledge-platform";
      return new IndexedDBVectorReadStore(dbName);
    }
    case "server": {
      const { NeDBVectorReadStore } = await import(
        "../infrastructure/stores/NeDBVectorReadStore"
      );
      return new NeDBVectorReadStore(policy.vectorStoreConfig?.dbPath);
    }
    default: {
      const { InMemoryVectorReadStore } = await import(
        "../infrastructure/stores/InMemoryVectorReadStore"
      );
      if (!policy.vectorStoreConfig?.sharedEntries) {
        throw new Error(
          "InMemoryVectorReadStore requires vectorStoreConfig.sharedEntries",
        );
      }
      return new InMemoryVectorReadStore(policy.vectorStoreConfig.sharedEntries);
    }
  }
}

async function resolveQueryEmbedder(
  embedderProvider: string,
  policy: SemanticQueryInfrastructurePolicy,
  config: import("../../../../config/ConfigProvider").ConfigProvider,
): Promise<QueryEmbedder> {
  switch (embedderProvider) {
    case "webllm": {
      const { WebLLMQueryEmbedder } = await import(
        "../infrastructure/embedders/WebLLMQueryEmbedder"
      );
      return new WebLLMQueryEmbedder(policy.webLLMModelId);
    }
    case "openai": {
      const apiKey = config.require("OPENAI_API_KEY");
      const modelId = (policy.embeddingModel as string) ?? "text-embedding-3-small";
      const { createOpenAI } = await import("@ai-sdk/openai");
      const { AISdkQueryEmbedder } = await import(
        "../infrastructure/embedders/AISdkQueryEmbedder"
      );
      const openai = createOpenAI({ apiKey });
      return new AISdkQueryEmbedder(openai.embedding(modelId));
    }
    case "cohere": {
      const apiKey = config.require("COHERE_API_KEY");
      const modelId = (policy.embeddingModel as string) ?? "embed-multilingual-v3.0";
      const { createCohere } = await import(/* @vite-ignore */ "@ai-sdk/cohere");
      const { AISdkQueryEmbedder } = await import(
        "../infrastructure/embedders/AISdkQueryEmbedder"
      );
      const cohere = createCohere({ apiKey });
      return new AISdkQueryEmbedder(cohere.textEmbeddingModel(modelId));
    }
    case "hf-inference": {
      const apiKey = config.require("HUGGINGFACE_API_KEY");
      const modelId = (policy.embeddingModel as string) ?? "sentence-transformers/all-MiniLM-L6-v2";
      const { HFInferenceQueryEmbedder } = await import(
        "../infrastructure/embedders/HFInferenceQueryEmbedder"
      );
      return new HFInferenceQueryEmbedder(apiKey, modelId);
    }
    case "huggingface": {
      const modelId = (policy.embeddingModel as string) ?? "Xenova/all-MiniLM-L6-v2";
      const { TransformersJSQueryEmbedder } = await import(
        "../infrastructure/embedders/TransformersJSQueryEmbedder"
      );
      const embedder = new TransformersJSQueryEmbedder(modelId);
      await embedder.initialize();
      return embedder;
    }
    default: {
      const { HashQueryEmbedder } = await import(
        "../infrastructure/embedders/HashQueryEmbedder"
      );
      const dimensions = policy.embeddingDimensions ?? 128;
      return new HashQueryEmbedder(dimensions);
    }
  }
}

export async function semanticQueryFactory(
  policy: SemanticQueryInfrastructurePolicy,
): Promise<SemanticQueryFactoryResult> {
  const embedderProvider =
    policy.embeddingProvider && policy.embeddingProvider !== "hash"
      ? policy.embeddingProvider
      : "hash";

  const { resolveConfigProvider } = await import("../../../../config/ConfigProvider");
  const config = await resolveConfigProvider(policy);

  const vectorProvider = policy.vectorStoreProvider ?? policy.provider;
  const retrieval = policy.retrieval ?? {};

  const [queryEmbedder, vectorSearch] = await Promise.all([
    resolveQueryEmbedder(embedderProvider, policy, config),
    resolveVectorReadStore(vectorProvider, policy),
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
): Promise<SparseReadStore> {
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
