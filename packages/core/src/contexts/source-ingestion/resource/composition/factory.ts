import type { ResourceRepository } from "../domain/ResourceRepository";
import type { ResourceStorage } from "../domain/ResourceStorage";
import type { EventPublisher } from "../../../../shared/domain/EventPublisher";

export interface ResourceInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  uploadPath?: string;
  [key: string]: unknown;
}

export interface ResolvedResourceInfra {
  repository: ResourceRepository;
  storage: ResourceStorage;
  storageProvider: string;
  eventPublisher: EventPublisher;
}

export interface ResourceFactoryResult {
  infra: ResolvedResourceInfra;
}

export async function resourceFactory(
  policy: ResourceInfrastructurePolicy,
): Promise<ResourceFactoryResult> {
  const { ProviderRegistryBuilder } = await import(
    "../../../../platform/composition/ProviderRegistryBuilder"
  );

  const repositoryRegistry = new ProviderRegistryBuilder<ResourceRepository>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryResourceRepository } = await import(
          "../infrastructure/persistence/InMemoryResourceRepository"
        );
        return new InMemoryResourceRepository();
      },
    })
    .add("browser", {
      create: async (p) => {
        const { IndexedDBResourceRepository } = await import(
          "../infrastructure/persistence/indexeddb/IndexedDBResourceRepository"
        );
        return new IndexedDBResourceRepository(
          (p.dbName as string) ?? "knowledge-platform",
        );
      },
    })
    .add("server", {
      create: async (p) => {
        const { NeDBResourceRepository } = await import(
          "../infrastructure/persistence/nedb/NeDBResourceRepository"
        );
        const filename = p.dbPath ? `${p.dbPath}/resources.db` : undefined;
        return new NeDBResourceRepository(filename);
      },
    })
    .build();

  const storageRegistry = new ProviderRegistryBuilder<ResourceStorage>()
    .add("in-memory", {
      create: async () => {
        const { InMemoryResourceStorage } = await import(
          "../infrastructure/storage/InMemoryResourceStorage"
        );
        return new InMemoryResourceStorage();
      },
    })
    .add("browser", {
      create: async () => {
        const { InMemoryResourceStorage } = await import(
          "../infrastructure/storage/InMemoryResourceStorage"
        );
        return new InMemoryResourceStorage();
      },
    })
    .add("server", {
      create: async (p) => {
        const { LocalFileResourceStorage } = await import(
          "../infrastructure/storage/LocalFileResourceStorage"
        );
        const uploadPath = (p.uploadPath as string) ??
                           (p.dbPath ? `${p.dbPath}/uploads` : "./uploads");
        return new LocalFileResourceStorage(uploadPath);
      },
    })
    .build();

  const { createEventPublisherRegistry } = await import(
    "../../../../platform/composition/createEventPublisherRegistry"
  );
  const eventPublisherRegistry = createEventPublisherRegistry();

  const [repository, storage, eventPublisher] = await Promise.all([
    repositoryRegistry.resolve(policy.provider).create(policy),
    storageRegistry.resolve(policy.provider).create(policy),
    eventPublisherRegistry.resolve(policy.provider).create(policy),
  ]);

  const storageProvider = policy.provider === "in-memory" ? "in-memory" : "local";

  return { infra: { repository, storage, storageProvider, eventPublisher } };
}
