import type { ContextRepository } from "../domain/ContextRepository";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

export interface ContextInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

export interface ResolvedContextInfra {
  repository: ContextRepository;
  eventPublisher: EventPublisher;
}

export interface ContextFactoryResult {
  infra: ResolvedContextInfra;
}

export async function contextFactory(
  policy: ContextInfrastructurePolicy,
): Promise<ContextFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<ContextRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryContextRepository } = await import(
          "../infrastructure/InMemoryContextRepository"
        );
        return new InMemoryContextRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBContextRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBContextRepository"
        );
        return new IndexedDBContextRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBContextRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBContextRepository"
        );
        const filename = p.dbPath
          ? `${p.dbPath}/context.db`
          : undefined;
        return new NeDBContextRepository(filename);
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
