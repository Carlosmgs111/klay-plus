import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

export interface SemanticUnitInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

export interface ResolvedSemanticUnitInfra {
  repository: SemanticUnitRepository;
  eventPublisher: EventPublisher;
}

export interface SemanticUnitFactoryResult {
  infra: ResolvedSemanticUnitInfra;
}

export async function semanticUnitFactory(
  policy: SemanticUnitInfrastructurePolicy,
): Promise<SemanticUnitFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<SemanticUnitRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemorySemanticUnitRepository } = await import(
          "../infrastructure/persistence/InMemorySemanticUnitRepository"
        );
        return new InMemorySemanticUnitRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBSemanticUnitRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBSemanticUnitRepository"
        );
        return new IndexedDBSemanticUnitRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBSemanticUnitRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBSemanticUnitRepository"
        );
        const filename = p.dbPath ? `${p.dbPath}/semantic-units.db` : undefined;
        return new NeDBSemanticUnitRepository(filename);
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
