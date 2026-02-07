import type {
  ProjectionInfrastructurePolicy,
  ResolvedProjectionInfra,
} from "./infra-policies.js";

export class ProjectionComposer {
  static async resolve(
    policy: ProjectionInfrastructurePolicy,
  ): Promise<ResolvedProjectionInfra> {
    const { InMemoryEventPublisher } = await import(
      "../../../shared/infrastructure/InMemoryEventPublisher.js"
    );
    const { InMemoryVectorStore } = await import(
      "../infrastructure/adapters/InMemoryVectorStore.js"
    );

    // Side-effect: register default chunking strategies
    await import("../infrastructure/strategies/index.js");
    const { ChunkerFactory } = await import(
      "../infrastructure/strategies/ChunkerFactory.js"
    );

    const chunkingStrategy = ChunkerFactory.create(
      policy.chunkingStrategyId ?? "recursive",
    );
    const vectorStore = new InMemoryVectorStore();

    switch (policy.type) {
      case "in-memory": {
        const { InMemorySemanticProjectionRepository } = await import(
          "../infrastructure/persistence/InMemorySemanticProjectionRepository.js"
        );
        const { HashEmbeddingStrategy } = await import(
          "../infrastructure/strategies/HashEmbeddingStrategy.js"
        );
        return {
          repository: new InMemorySemanticProjectionRepository(),
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
          "../infrastructure/persistence/indexeddb/IndexedDBSemanticProjectionRepository.js"
        );
        const { WebLLMEmbeddingStrategy } = await import(
          "../infrastructure/strategies/WebLLMEmbeddingStrategy.js"
        );
        const dbName = policy.dbName ?? "knowledge-platform";
        const embeddingStrategy = new WebLLMEmbeddingStrategy(policy.webLLMModelId);
        await embeddingStrategy.initialize();

        return {
          repository: new IndexedDBSemanticProjectionRepository(dbName),
          embeddingStrategy,
          chunkingStrategy,
          vectorStore,
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "server": {
        const { NeDBSemanticProjectionRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBSemanticProjectionRepository.js"
        );
        const { AISdkEmbeddingStrategy } = await import(
          "../infrastructure/strategies/AISdkEmbeddingStrategy.js"
        );

        if (!policy.aiSdkEmbeddingModel) {
          throw new Error("Projection server policy requires 'aiSdkEmbeddingModel'");
        }

        const filename = policy.dbPath
          ? `${policy.dbPath}/semantic-projections.db`
          : undefined;
        return {
          repository: new NeDBSemanticProjectionRepository(filename),
          embeddingStrategy: new AISdkEmbeddingStrategy(policy.aiSdkEmbeddingModel),
          chunkingStrategy,
          vectorStore,
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      default:
        throw new Error(`Unknown policy type: ${(policy as any).type}`);
    }
  }
}
