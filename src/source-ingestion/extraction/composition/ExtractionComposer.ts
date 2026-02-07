import type {
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
} from "./infra-policies.js";

export class ExtractionComposer {
  private static async createDefaultExtractor() {
    const { CompositeContentExtractor } = await import(
      "../infrastructure/adapters/CompositeContentExtractor.js"
    );
    const { TextContentExtractor } = await import(
      "../infrastructure/adapters/TextContentExtractor.js"
    );
    const { PdfContentExtractor } = await import(
      "../infrastructure/adapters/PdfContentExtractor.js"
    );

    return new CompositeContentExtractor()
      .register(new TextContentExtractor())
      .register(new PdfContentExtractor());
  }

  static async resolve(
    policy: ExtractionInfrastructurePolicy,
  ): Promise<ResolvedExtractionInfra> {
    const { InMemoryEventPublisher } = await import(
      "../../../shared/infrastructure/InMemoryEventPublisher.js"
    );

    const extractor = policy.contentExtractor ?? await this.createDefaultExtractor();

    switch (policy.type) {
      case "in-memory": {
        const { InMemoryExtractionJobRepository } = await import(
          "../infrastructure/persistence/InMemoryExtractionJobRepository.js"
        );
        return {
          repository: new InMemoryExtractionJobRepository(),
          extractor,
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
          extractor,
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
          extractor,
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      default:
        throw new Error(`Unknown policy type: ${(policy as any).type}`);
    }
  }
}
