import type {
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
} from "./infra-policies.js";
import type { SourceExtractor } from "../domain/SourceExtractor.js";

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

export class SourceComposer {
  static async resolve(
    policy: SourceInfrastructurePolicy,
  ): Promise<ResolvedSourceInfra> {
    const { InMemoryEventPublisher } = await import(
      "../../../shared/infrastructure/InMemoryEventPublisher.js"
    );
    const { TextSourceExtractor } = await import(
      "../infrastructure/adapters/TextSourceExtractor.js"
    );

    switch (policy.type) {
      case "in-memory": {
        const { InMemorySourceRepository } = await import(
          "../infrastructure/persistence/InMemorySourceRepository.js"
        );
        return {
          repository: new InMemorySourceRepository(),
          extractor: new TextSourceExtractor(),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "browser": {
        const { IndexedDBSourceRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBSourceRepository.js"
        );
        const { PdfBrowserExtractor } = await import(
          "../infrastructure/adapters/PdfBrowserExtractor.js"
        );
        const dbName = policy.dbName ?? "knowledge-platform";
        return {
          repository: new IndexedDBSourceRepository(dbName),
          extractor: new CompositeSourceExtractor([
            new TextSourceExtractor(),
            new PdfBrowserExtractor(),
          ]),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      case "server": {
        const { NeDBSourceRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBSourceRepository.js"
        );
        const { PdfServerExtractor } = await import(
          "../infrastructure/adapters/PdfServerExtractor.js"
        );
        const filename = policy.dbPath
          ? `${policy.dbPath}/sources.db`
          : undefined;
        return {
          repository: new NeDBSourceRepository(filename),
          extractor: new CompositeSourceExtractor([
            new TextSourceExtractor(),
            new PdfServerExtractor(),
          ]),
          eventPublisher: new InMemoryEventPublisher(),
        };
      }

      default:
        throw new Error(`Unknown policy type: ${(policy as any).type}`);
    }
  }
}
