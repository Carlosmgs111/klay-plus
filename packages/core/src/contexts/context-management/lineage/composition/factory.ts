import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

export interface LineageInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

export interface ResolvedLineageInfra {
  repository: KnowledgeLineageRepository;
  eventPublisher: EventPublisher;
}

export interface LineageFactoryResult {
  infra: ResolvedLineageInfra;
}

export async function lineageFactory(
  policy: LineageInfrastructurePolicy,
): Promise<LineageFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<KnowledgeLineageRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryKnowledgeLineageRepository } = await import(
          "../infrastructure/persistence/InMemoryKnowledgeLineageRepository"
        );
        return new InMemoryKnowledgeLineageRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBKnowledgeLineageRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBKnowledgeLineageRepository"
        );
        return new IndexedDBKnowledgeLineageRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBKnowledgeLineageRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBKnowledgeLineageRepository"
        );
        const filename = p.dbPath
          ? `${p.dbPath}/knowledge-lineage.db`
          : undefined;
        return new NeDBKnowledgeLineageRepository(filename);
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
