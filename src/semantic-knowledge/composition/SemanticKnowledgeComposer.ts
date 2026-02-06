import type {
  SemanticKnowledgeInfrastructurePolicy,
  ResolvedSemanticKnowledgeInfra,
} from "./infra-policies.js";

export class SemanticKnowledgeComposer {
  static async resolve(
    policy: SemanticKnowledgeInfrastructurePolicy,
  ): Promise<ResolvedSemanticKnowledgeInfra> {
    const { InMemoryEventPublisher } = await import(
      "../../shared/infrastructure/InMemoryEventPublisher.js"
    );

    switch (policy.type) {
      case "in-memory": {
        const { InMemorySemanticUnitRepository } = await import(
          "../semantic-unit/infrastructure/persistence/InMemorySemanticUnitRepository.js"
        );
        const { InMemoryKnowledgeLineageRepository } = await import(
          "../lineage/infrastructure/persistence/InMemoryKnowledgeLineageRepository.js"
        );
        return {
          semanticUnitRepository: new InMemorySemanticUnitRepository(),
          lineageRepository: new InMemoryKnowledgeLineageRepository(),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "browser": {
        const { IndexedDBSemanticUnitRepository } = await import(
          "../semantic-unit/infrastructure/persistence/indexeddb/IndexedDBSemanticUnitRepository.js"
        );
        const { IndexedDBKnowledgeLineageRepository } = await import(
          "../lineage/infrastructure/persistence/indexeddb/IndexedDBKnowledgeLineageRepository.js"
        );
        const dbName = policy.dbName ?? "knowledge-platform";
        return {
          semanticUnitRepository: new IndexedDBSemanticUnitRepository(dbName),
          lineageRepository: new IndexedDBKnowledgeLineageRepository(dbName),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "server": {
        const { NeDBSemanticUnitRepository } = await import(
          "../semantic-unit/infrastructure/persistence/nedb/NeDBSemanticUnitRepository.js"
        );
        const { NeDBKnowledgeLineageRepository } = await import(
          "../lineage/infrastructure/persistence/nedb/NeDBKnowledgeLineageRepository.js"
        );
        const prefix = policy.dbPath ? `${policy.dbPath}/` : undefined;
        return {
          semanticUnitRepository: new NeDBSemanticUnitRepository(
            prefix ? `${prefix}semantic-units.db` : undefined,
          ),
          lineageRepository: new NeDBKnowledgeLineageRepository(
            prefix ? `${prefix}knowledge-lineage.db` : undefined,
          ),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      default:
        throw new Error(`Unknown infrastructure policy: ${(policy as any).type}`);
    }
  }
}
