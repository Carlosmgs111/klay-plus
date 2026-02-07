import type {
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
} from "./infra-policies.js";

export class SemanticQueryComposer {
  static async resolve(
    policy: SemanticQueryInfrastructurePolicy,
  ): Promise<ResolvedSemanticQueryInfra> {
    const dimensions = policy.embeddingDimensions ?? 128;

    switch (policy.type) {
      case "in-memory": {
        const { HashQueryEmbedder } = await import(
          "../infrastructure/adapters/HashQueryEmbedder.js"
        );
        const { InMemoryVectorSearchAdapter } = await import(
          "../infrastructure/adapters/InMemoryVectorSearchAdapter.js"
        );
        const { PassthroughRankingStrategy } = await import(
          "../infrastructure/adapters/PassthroughRankingStrategy.js"
        );

        return {
          queryEmbedder: new HashQueryEmbedder(dimensions),
          vectorSearch: new InMemoryVectorSearchAdapter(policy.vectorStoreRef),
          rankingStrategy: new PassthroughRankingStrategy(),
        };
      }

      case "browser": {
        const { WebLLMQueryEmbedder } = await import(
          "../infrastructure/adapters/WebLLMQueryEmbedder.js"
        );
        const { InMemoryVectorSearchAdapter } = await import(
          "../infrastructure/adapters/InMemoryVectorSearchAdapter.js"
        );
        const { PassthroughRankingStrategy } = await import(
          "../infrastructure/adapters/PassthroughRankingStrategy.js"
        );

        return {
          queryEmbedder: new WebLLMQueryEmbedder(),
          vectorSearch: new InMemoryVectorSearchAdapter(policy.vectorStoreRef),
          rankingStrategy: new PassthroughRankingStrategy(),
        };
      }

      case "server": {
        const { AISdkQueryEmbedder } = await import(
          "../infrastructure/adapters/AISdkQueryEmbedder.js"
        );
        const { InMemoryVectorSearchAdapter } = await import(
          "../infrastructure/adapters/InMemoryVectorSearchAdapter.js"
        );
        const { PassthroughRankingStrategy } = await import(
          "../infrastructure/adapters/PassthroughRankingStrategy.js"
        );

        const modelId = policy.aiSdkModelId ?? "openai:text-embedding-3-small";

        return {
          queryEmbedder: new AISdkQueryEmbedder(modelId),
          vectorSearch: new InMemoryVectorSearchAdapter(policy.vectorStoreRef),
          rankingStrategy: new PassthroughRankingStrategy(),
        };
      }

      default: {
        const _exhaustive: never = policy.type;
        throw new Error(`Unknown policy type: ${_exhaustive}`);
      }
    }
  }
}
