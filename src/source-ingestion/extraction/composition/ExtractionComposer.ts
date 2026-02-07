import type {
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
} from "./infra-policies.js";

export class ExtractionComposer {
  static async resolve(
    policy: ExtractionInfrastructurePolicy,
  ): Promise<ResolvedExtractionInfra> {
    const { InMemoryEventPublisher } = await import(
      "../../../shared/infrastructure/InMemoryEventPublisher.js"
    );

    if (!policy.sourceRepository || !policy.sourceExtractor) {
      throw new Error(
        "ExtractionComposer requires 'sourceRepository' and 'sourceExtractor' in policy",
      );
    }

    switch (policy.type) {
      case "in-memory": {
        const { InMemoryExtractionJobRepository } = await import(
          "../infrastructure/persistence/InMemoryExtractionJobRepository.js"
        );
        return {
          repository: new InMemoryExtractionJobRepository(),
          sourceRepository: policy.sourceRepository,
          sourceExtractor: policy.sourceExtractor,
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "browser": {
        const { IndexedDBExtractionJobRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBExtractionJobRepository.js"
        );
        const dbName = policy.dbName ?? "knowledge-platform";
        return {
          repository: new IndexedDBExtractionJobRepository(dbName),
          sourceRepository: policy.sourceRepository,
          sourceExtractor: policy.sourceExtractor,
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "server": {
        const { NeDBExtractionJobRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBExtractionJobRepository.js"
        );
        const filename = policy.dbPath
          ? `${policy.dbPath}/extraction-jobs.db`
          : undefined;
        return {
          repository: new NeDBExtractionJobRepository(filename),
          sourceRepository: policy.sourceRepository,
          sourceExtractor: policy.sourceExtractor,
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      default:
        throw new Error(`Unknown policy type: ${(policy as any).type}`);
    }
  }
}
