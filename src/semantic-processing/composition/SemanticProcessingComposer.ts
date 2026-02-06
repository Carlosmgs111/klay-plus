import type {
  SemanticProcessingInfrastructurePolicy,
  ResolvedSemanticProcessingInfra,
} from "./infra-policies.js";

export class SemanticProcessingComposer {
  static async resolve(
    policy: SemanticProcessingInfrastructurePolicy,
  ): Promise<ResolvedSemanticProcessingInfra> {
    const { InMemoryEventPublisher } = await import(
      "../../shared/infrastructure/InMemoryEventPublisher.js"
    );
    const { InMemoryVectorStore } = await import(
      "../projection/infrastructure/adapters/InMemoryVectorStore.js"
    );

    // Side-effect: register default chunking strategies
    await import("../projection/infrastructure/strategies/index.js");
    const { ChunkerFactory } = await import(
      "../projection/infrastructure/strategies/ChunkerFactory.js"
    );

    const chunkingStrategy = ChunkerFactory.create(
      policy.chunkingStrategyId ?? "recursive",
    );
    const vectorStore = new InMemoryVectorStore();

    switch (policy.type) {
      case "in-memory": {
        const { InMemorySemanticProjectionRepository } = await import(
          "../projection/infrastructure/persistence/InMemorySemanticProjectionRepository.js"
        );
        const { InMemoryProcessingStrategyRepository } = await import(
          "../strategy-registry/infrastructure/persistence/InMemoryProcessingStrategyRepository.js"
        );
        const { HashEmbeddingStrategy } = await import(
          "../projection/infrastructure/strategies/HashEmbeddingStrategy.js"
        );
        return {
          projectionRepository: new InMemorySemanticProjectionRepository(),
          strategyRepository: new InMemoryProcessingStrategyRepository(),
          embeddingStrategy: new HashEmbeddingStrategy(
            policy.embeddingDimensions ?? 128,
          ),
          chunkingStrategy,
          vectorStore,
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "browser": {
        const { IndexedDBSemanticProjectionRepository } = await import(
          "../projection/infrastructure/persistence/indexeddb/IndexedDBSemanticProjectionRepository.js"
        );
        const { IndexedDBProcessingStrategyRepository } = await import(
          "../strategy-registry/infrastructure/persistence/indexeddb/IndexedDBProcessingStrategyRepository.js"
        );
        const { WebLLMEmbeddingStrategy } = await import(
          "../projection/infrastructure/strategies/WebLLMEmbeddingStrategy.js"
        );
        const dbName = policy.dbName ?? "knowledge-platform";
        const embeddingStrategy = new WebLLMEmbeddingStrategy(
          policy.webLLMModelId,
        );
        await embeddingStrategy.initialize();

        return {
          projectionRepository: new IndexedDBSemanticProjectionRepository(dbName),
          strategyRepository: new IndexedDBProcessingStrategyRepository(dbName),
          embeddingStrategy,
          chunkingStrategy,
          vectorStore,
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "server": {
        const { NeDBSemanticProjectionRepository } = await import(
          "../projection/infrastructure/persistence/nedb/NeDBSemanticProjectionRepository.js"
        );
        const { NeDBProcessingStrategyRepository } = await import(
          "../strategy-registry/infrastructure/persistence/nedb/NeDBProcessingStrategyRepository.js"
        );
        const { AISdkEmbeddingStrategy } = await import(
          "../projection/infrastructure/strategies/AISdkEmbeddingStrategy.js"
        );

        if (!policy.aiSdkEmbeddingModel) {
          throw new Error(
            "SemanticProcessing server policy requires 'aiSdkEmbeddingModel'",
          );
        }

        const prefix = policy.dbPath ? `${policy.dbPath}/` : undefined;
        return {
          projectionRepository: new NeDBSemanticProjectionRepository(
            prefix ? `${prefix}semantic-projections.db` : undefined,
          ),
          strategyRepository: new NeDBProcessingStrategyRepository(
            prefix ? `${prefix}processing-strategies.db` : undefined,
          ),
          embeddingStrategy: new AISdkEmbeddingStrategy(
            policy.aiSdkEmbeddingModel,
          ),
          chunkingStrategy,
          vectorStore,
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      default:
        throw new Error(`Unknown infrastructure policy: ${(policy as any).type}`);
    }
  }
}
