import type {
  KnowledgeRetrievalInfrastructurePolicy,
  ResolvedKnowledgeRetrievalInfra,
} from "./infra-policies.js";

export class KnowledgeRetrievalComposer {
  static async resolve(
    policy: KnowledgeRetrievalInfrastructurePolicy,
  ): Promise<ResolvedKnowledgeRetrievalInfra> {
    const { PassthroughRankingStrategy } = await import(
      "../semantic-query/infrastructure/adapters/PassthroughRankingStrategy.js"
    );
    const { InMemoryVectorSearchAdapter } = await import(
      "../semantic-query/infrastructure/adapters/InMemoryVectorSearchAdapter.js"
    );

    const rankingStrategy = new PassthroughRankingStrategy();

    // Resolve vector store: either from explicit ref or create a new one
    let vectorStoreForSearch = policy.vectorStoreRef;
    if (!vectorStoreForSearch) {
      const { InMemoryVectorStore } = await import(
        "../../semantic-processing/projection/infrastructure/adapters/InMemoryVectorStore.js"
      );
      vectorStoreForSearch = new InMemoryVectorStore();
    }

    const vectorSearch = new InMemoryVectorSearchAdapter(vectorStoreForSearch);

    switch (policy.type) {
      case "in-memory": {
        const { HashQueryEmbedder } = await import(
          "../semantic-query/infrastructure/adapters/HashQueryEmbedder.js"
        );
        return {
          queryEmbedder: new HashQueryEmbedder(policy.embeddingDimensions ?? 128),
          vectorSearch,
          rankingStrategy,
        };
      }

      case "browser": {
        const { WebLLMQueryEmbedder } = await import(
          "../semantic-query/infrastructure/adapters/WebLLMQueryEmbedder.js"
        );
        const embedder = new WebLLMQueryEmbedder(policy.webLLMModelId);
        await embedder.initialize();
        return {
          queryEmbedder: embedder,
          vectorSearch,
          rankingStrategy,
        };
      }

      case "server": {
        const { AISdkQueryEmbedder } = await import(
          "../semantic-query/infrastructure/adapters/AISdkQueryEmbedder.js"
        );
        if (!policy.aiSdkEmbeddingModel) {
          throw new Error(
            "KnowledgeRetrieval server policy requires 'aiSdkEmbeddingModel'",
          );
        }
        return {
          queryEmbedder: new AISdkQueryEmbedder(policy.aiSdkEmbeddingModel),
          vectorSearch,
          rankingStrategy,
        };
      }

      default:
        throw new Error(`Unknown infrastructure policy: ${(policy as any).type}`);
    }
  }
}
