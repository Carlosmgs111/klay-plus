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

async function resolveRepository(policy: ResourceInfrastructurePolicy): Promise<ResourceRepository> {
  switch (policy.provider) {
    case "browser": {
      const { IndexedDBResourceRepository } = await import(
        "../infrastructure/persistence/indexeddb/IndexedDBResourceRepository"
      );
      return new IndexedDBResourceRepository(
        (policy.dbName as string) ?? "knowledge-platform",
      );
    }
    case "server": {
      const { NeDBResourceRepository } = await import(
        "../infrastructure/persistence/nedb/NeDBResourceRepository"
      );
      const filename = policy.dbPath ? `${policy.dbPath}/resources.db` : undefined;
      return new NeDBResourceRepository(filename);
    }
    default: {
      const { InMemoryResourceRepository } = await import(
        "../infrastructure/persistence/InMemoryResourceRepository"
      );
      return new InMemoryResourceRepository();
    }
  }
}

async function resolveStorage(policy: ResourceInfrastructurePolicy): Promise<ResourceStorage> {
  if (policy.provider === "server") {
    const { LocalFileResourceStorage } = await import(
      "../infrastructure/storage/LocalFileResourceStorage"
    );
    const uploadPath = (policy.uploadPath as string) ??
                       (policy.dbPath ? `${policy.dbPath}/uploads` : "./uploads");
    return new LocalFileResourceStorage(uploadPath);
  }
  // in-memory and browser both use InMemoryResourceStorage
  const { InMemoryResourceStorage } = await import(
    "../infrastructure/storage/InMemoryResourceStorage"
  );
  return new InMemoryResourceStorage();
}

export async function resourceFactory(
  policy: ResourceInfrastructurePolicy,
): Promise<ResourceFactoryResult> {
  const { InMemoryEventPublisher } = await import(
    "../../../../shared/InMemoryEventPublisher"
  );

  const [repository, storage] = await Promise.all([
    resolveRepository(policy),
    resolveStorage(policy),
  ]);

  const eventPublisher: EventPublisher = new InMemoryEventPublisher();
  const storageProvider = policy.provider === "in-memory" ? "in-memory" : "local";

  return { infra: { repository, storage, storageProvider, eventPublisher } };
}
