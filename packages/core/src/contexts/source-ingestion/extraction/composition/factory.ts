import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository";
import type { ContentExtractor } from "../domain/ContentExtractor";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";
import type { ExtractionUseCases } from "../application";

export type ExtractorMap = Map<string, ContentExtractor>;

export interface ExtractionInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  customExtractors?: ExtractorMap;
  [key: string]: unknown;
}

export interface ResolvedExtractionInfra {
  repository: ExtractionJobRepository;
  extractors: ExtractorMap;
  eventPublisher: EventPublisher;
}

export interface ExtractionFactoryResult {
  useCases: ExtractionUseCases;
  infra: ResolvedExtractionInfra;
}

const TEXT_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/json",
] as const;

async function resolveExtractors(
  policy: ExtractionInfrastructurePolicy,
): Promise<ExtractorMap> {
  if (policy.customExtractors) {
    return policy.customExtractors;
  }

  const extractors: ExtractorMap = new Map();

  const { TextContentExtractor } = await import(
    "../infrastructure/adapters/TextContentExtractor"
  );
  const textExtractor = new TextContentExtractor();

  for (const mimeType of TEXT_MIME_TYPES) {
    extractors.set(mimeType, textExtractor);
  }

  if (policy.provider === "browser") {
    const { BrowserPdfContentExtractor } = await import(
      "../infrastructure/adapters/BrowserPdfContentExtractor"
    );
    extractors.set("application/pdf", new BrowserPdfContentExtractor());
  } else {
    const { ServerPdfContentExtractor } = await import(
      "../infrastructure/adapters/ServerPdfContentExtractor"
    );
    extractors.set("application/pdf", new ServerPdfContentExtractor());
  }

  return extractors;
}

export async function extractionFactory(
  policy: ExtractionInfrastructurePolicy,
): Promise<ExtractionFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<ExtractionJobRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryExtractionJobRepository } = await import(
          "../infrastructure/persistence/InMemoryExtractionJobRepository"
        );
        return new InMemoryExtractionJobRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBExtractionJobRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBExtractionJobRepository"
        );
        return new IndexedDBExtractionJobRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBExtractionJobRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBExtractionJobRepository"
        );
        const filename = p.dbPath ? `${p.dbPath}/extraction-jobs.db` : undefined;
        return new NeDBExtractionJobRepository(filename);
      },
    })
    .build();

  const { createEventPublisherRegistry } = await import(
    "../../../../platform/composition/createEventPublisherRegistry"
  );
  const eventPublisherRegistry = createEventPublisherRegistry();

  const [repository, extractors, eventPublisher] = await Promise.all([
    repositoryRegistry.resolve(policy.provider).create(policy),
    resolveExtractors(policy),
    eventPublisherRegistry.resolve(policy.provider).create(policy),
  ]);

  const infra: ResolvedExtractionInfra = { repository, extractors, eventPublisher };

  const { ExtractionUseCases } = await import("../application");
  const useCases = new ExtractionUseCases(
    infra.repository,
    infra.extractors,
    infra.eventPublisher,
  );

  return { useCases, infra };
}
