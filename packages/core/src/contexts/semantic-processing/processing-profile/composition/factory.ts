import type { ProcessingProfileRepository } from "../domain/ProcessingProfileRepository";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

export interface ProcessingProfileInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

export interface ResolvedProcessingProfileInfra {
  repository: ProcessingProfileRepository;
}

export interface ProcessingProfileFactoryResult {
  repository: ProcessingProfileRepository;
  eventPublisher: EventPublisher;
}

export async function processingProfileFactory(
  policy: ProcessingProfileInfrastructurePolicy,
): Promise<ProcessingProfileFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<ProcessingProfileRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryProcessingProfileRepository } = await import(
          "../infrastructure/persistence/InMemoryProcessingProfileRepository"
        );
        return new InMemoryProcessingProfileRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBProcessingProfileRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBProcessingProfileRepository"
        );
        return new IndexedDBProcessingProfileRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBProcessingProfileRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBProcessingProfileRepository"
        );
        const filename = p.dbPath
          ? `${p.dbPath}/processing-profiles.db`
          : undefined;
        return new NeDBProcessingProfileRepository(filename);
      },
    })
    .build();

  const repository = await repositoryRegistry
    .resolve(policy.provider)
    .create(policy);

  const { InMemoryEventPublisher } = await import(
    "../../../../platform/eventing/InMemoryEventPublisher"
  );
  const eventPublisher = new InMemoryEventPublisher();

  return { repository, eventPublisher };
}
