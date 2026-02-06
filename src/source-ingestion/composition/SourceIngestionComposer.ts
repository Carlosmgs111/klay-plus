import type {
  SourceIngestionInfrastructurePolicy,
  ResolvedSourceIngestionInfra,
} from "./infra-policies.js";
import type { SourceExtractor } from "../source/domain/SourceExtractor.js";

/**
 * Composes a SourceExtractor that chains multiple extractors.
 * Routes to the first extractor that supports the given type.
 */
class CompositeSourceExtractor implements SourceExtractor {
  constructor(private readonly extractors: SourceExtractor[]) {}

  supports(type: any): boolean {
    return this.extractors.some((e) => e.supports(type));
  }

  async extract(uri: string, type: any) {
    const extractor = this.extractors.find((e) => e.supports(type));
    if (!extractor) {
      throw new Error(`No extractor supports type: ${type}`);
    }
    return extractor.extract(uri, type);
  }
}

export class SourceIngestionComposer {
  static async resolve(
    policy: SourceIngestionInfrastructurePolicy,
  ): Promise<ResolvedSourceIngestionInfra> {
    const { InMemoryEventPublisher } = await import(
      "../../shared/infrastructure/InMemoryEventPublisher.js"
    );
    const { TextSourceExtractor } = await import(
      "../source/infrastructure/adapters/TextSourceExtractor.js"
    );

    switch (policy.type) {
      case "in-memory": {
        const { InMemorySourceRepository } = await import(
          "../source/infrastructure/persistence/InMemorySourceRepository.js"
        );
        const { InMemoryExtractionJobRepository } = await import(
          "../extraction/infrastructure/persistence/InMemoryExtractionJobRepository.js"
        );
        return {
          sourceRepository: new InMemorySourceRepository(),
          extractionJobRepository: new InMemoryExtractionJobRepository(),
          sourceExtractor: new TextSourceExtractor(),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "browser": {
        const { IndexedDBSourceRepository } = await import(
          "../source/infrastructure/persistence/indexeddb/IndexedDBSourceRepository.js"
        );
        const { IndexedDBExtractionJobRepository } = await import(
          "../extraction/infrastructure/persistence/indexeddb/IndexedDBExtractionJobRepository.js"
        );
        const { PdfBrowserExtractor } = await import(
          "../source/infrastructure/adapters/PdfBrowserExtractor.js"
        );
        const dbName = policy.dbName ?? "knowledge-platform";
        return {
          sourceRepository: new IndexedDBSourceRepository(dbName),
          extractionJobRepository: new IndexedDBExtractionJobRepository(dbName),
          sourceExtractor: new CompositeSourceExtractor([
            new TextSourceExtractor(),
            new PdfBrowserExtractor(),
          ]),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "server": {
        const { NeDBSourceRepository } = await import(
          "../source/infrastructure/persistence/nedb/NeDBSourceRepository.js"
        );
        const { NeDBExtractionJobRepository } = await import(
          "../extraction/infrastructure/persistence/nedb/NeDBExtractionJobRepository.js"
        );
        const { PdfServerExtractor } = await import(
          "../source/infrastructure/adapters/PdfServerExtractor.js"
        );
        const prefix = policy.dbPath ? `${policy.dbPath}/` : undefined;
        return {
          sourceRepository: new NeDBSourceRepository(
            prefix ? `${prefix}sources.db` : undefined,
          ),
          extractionJobRepository: new NeDBExtractionJobRepository(
            prefix ? `${prefix}extraction-jobs.db` : undefined,
          ),
          sourceExtractor: new CompositeSourceExtractor([
            new TextSourceExtractor(),
            new PdfServerExtractor(),
          ]),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      default:
        throw new Error(`Unknown infrastructure policy: ${(policy as any).type}`);
    }
  }
}
