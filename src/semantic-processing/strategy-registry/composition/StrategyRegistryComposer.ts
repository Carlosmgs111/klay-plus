import type {
  StrategyRegistryInfrastructurePolicy,
  ResolvedStrategyRegistryInfra,
} from "./infra-policies.js";

export class StrategyRegistryComposer {
  static async resolve(
    policy: StrategyRegistryInfrastructurePolicy,
  ): Promise<ResolvedStrategyRegistryInfra> {
    const { InMemoryEventPublisher } = await import(
      "../../../shared/infrastructure/InMemoryEventPublisher.js"
    );

    switch (policy.type) {
      case "in-memory": {
        const { InMemoryProcessingStrategyRepository } = await import(
          "../infrastructure/persistence/InMemoryProcessingStrategyRepository.js"
        );
        return {
          repository: new InMemoryProcessingStrategyRepository(),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "browser": {
        const { IndexedDBProcessingStrategyRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBProcessingStrategyRepository.js"
        );
        const dbName = policy.dbName ?? "knowledge-platform";
        return {
          repository: new IndexedDBProcessingStrategyRepository(dbName),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "server": {
        const { NeDBProcessingStrategyRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBProcessingStrategyRepository.js"
        );
        const filename = policy.dbPath
          ? `${policy.dbPath}/processing-strategies.db`
          : undefined;
        return {
          repository: new NeDBProcessingStrategyRepository(filename),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      default:
        throw new Error(`Unknown policy type: ${(policy as any).type}`);
    }
  }
}
