import type { SourceRepository } from "../domain/SourceRepository";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

export interface SourceInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

export interface ResolvedSourceInfra {
  repository: SourceRepository;
  eventPublisher: EventPublisher;
}

export interface SourceFactoryResult {
  infra: ResolvedSourceInfra;
}

export async function sourceFactory(
  policy: SourceInfrastructurePolicy,
): Promise<SourceFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<SourceRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemorySourceRepository } = await import(
          "../infrastructure/persistence/InMemorySourceRepository"
        );
        return new InMemorySourceRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBSourceRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBSourceRepository"
        );
        return new IndexedDBSourceRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBSourceRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBSourceRepository"
        );
        const filename = p.dbPath ? `${p.dbPath}/sources.db` : undefined;
        return new NeDBSourceRepository(filename);
      },
    })
    .build();

  const { createEventPublisherRegistry } = await import(
    "../../../../platform/composition/createEventPublisherRegistry"
  );
  const eventPublisherRegistry = createEventPublisherRegistry();

  const [repository, eventPublisher] = await Promise.all([
    repositoryRegistry.resolve(policy.provider).create(policy),
    eventPublisherRegistry.resolve(policy.provider).create(policy),
  ]);

  return { infra: { repository, eventPublisher } };
}
