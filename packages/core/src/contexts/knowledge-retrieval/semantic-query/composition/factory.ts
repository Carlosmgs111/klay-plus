import type { QueryEmbedder } from "../domain/ports/QueryEmbedder";
import type { VectorReadStore } from "../domain/ports/VectorReadStore";
import type { RankingStrategy } from "../domain/ports/RankingStrategy";
import type { VectorEntry } from "../../../../platform/vector/VectorEntry";
import type { ConfigProvider } from "../../../../platform/config";
import type { SemanticQueryUseCases } from "../application";

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
  webLLMModelId?: string;
  configOverrides?: Record<string, string>;
  [key: string]: unknown;
}

export interface ResolvedSemanticQueryInfra {
  queryEmbedder: QueryEmbedder;
  vectorSearch: VectorReadStore;
  rankingStrategy: RankingStrategy;
}

export interface SemanticQueryFactoryResult {
  useCases: SemanticQueryUseCases;
  infra: ResolvedSemanticQueryInfra;
}

async function resolveConfigProvider(
  policy: SemanticQueryInfrastructurePolicy,
): Promise<ConfigProvider> {
  if (policy.configOverrides) {
    const { InMemoryConfigProvider } = await import(
      "../../../../platform/config/InMemoryConfigProvider"
    );
    return new InMemoryConfigProvider(policy.configOverrides);
  }
  const { NodeConfigProvider } = await import(
    "../../../../platform/config/NodeConfigProvider"
  );
  return new NodeConfigProvider();
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
      : policy.provider === "browser"
        ? "browser-webllm"
        : "hash";

  const config = await resolveConfigProvider(policy);

  const vectorReadStoreRegistry = new ProviderRegistryBuilder<VectorReadStore>()
    .add("in-memory", {
      create: async (p) => {
        const { InMemoryVectorReadStore } = await import(
          "../infrastructure/adapters/InMemoryVectorReadStore"
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
          "../infrastructure/adapters/IndexedDBVectorReadStore"
        );
        const vectorStoreConfig = (p as SemanticQueryInfrastructurePolicy).vectorStoreConfig;
        const dbName = vectorStoreConfig?.dbName ?? "knowledge-platform";
        return new IndexedDBVectorReadStore(dbName);
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBVectorReadStore } = await import(
          "../infrastructure/adapters/NeDBVectorReadStore"
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
          "../infrastructure/adapters/HashQueryEmbedder"
        );
        const dimensions = (p as SemanticQueryInfrastructurePolicy).embeddingDimensions ?? 128;
        return new HashQueryEmbedder(dimensions);
      },
    })
    .add("browser-webllm", {
      create: async (p) => {
        const { WebLLMQueryEmbedder } = await import(
          "../infrastructure/adapters/WebLLMQueryEmbedder"
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
          "../infrastructure/adapters/AISdkQueryEmbedder"
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
          "../infrastructure/adapters/AISdkQueryEmbedder"
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
          "../infrastructure/adapters/AISdkQueryEmbedder"
        );
        const hf = createHuggingFace({ apiKey });
        return new AISdkQueryEmbedder(hf.textEmbeddingModel(modelId));
      },
    })
    .build();

  const { PassthroughRankingStrategy } = await import(
    "../infrastructure/adapters/PassthroughRankingStrategy"
  );

  const [queryEmbedder, vectorSearch] = await Promise.all([
    queryEmbedderRegistry.resolve(embedderProvider).create(policy),
    vectorReadStoreRegistry.resolve(policy.provider).create(policy),
  ]);

  const infra: ResolvedSemanticQueryInfra = {
    queryEmbedder,
    vectorSearch,
    rankingStrategy: new PassthroughRankingStrategy(),
  };

  const { SemanticQueryUseCases } = await import("../application");
  const useCases = new SemanticQueryUseCases(
    infra.queryEmbedder,
    infra.vectorSearch,
    infra.rankingStrategy,
  );

  return { useCases, infra };
}
