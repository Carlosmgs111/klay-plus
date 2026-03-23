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

async function resolveRepository(policy: ProcessingProfileInfrastructurePolicy): Promise<ProcessingProfileRepository> {
  switch (policy.provider) {
    case "browser": {
      const { IndexedDBProcessingProfileRepository } = await import(
        "../infrastructure/persistence/indexeddb/IndexedDBProcessingProfileRepository"
      );
      return new IndexedDBProcessingProfileRepository(
        (policy.dbName as string) ?? "knowledge-platform",
      );
    }
    case "server": {
      const { NeDBProcessingProfileRepository } = await import(
        "../infrastructure/persistence/nedb/NeDBProcessingProfileRepository"
      );
      const filename = policy.dbPath
        ? `${policy.dbPath}/processing-profiles.db`
        : undefined;
      return new NeDBProcessingProfileRepository(filename);
    }
    default: {
      const { InMemoryProcessingProfileRepository } = await import(
        "../infrastructure/persistence/InMemoryProcessingProfileRepository"
      );
      return new InMemoryProcessingProfileRepository();
    }
  }
}

export async function processingProfileFactory(
  policy: ProcessingProfileInfrastructurePolicy,
): Promise<ProcessingProfileFactoryResult> {
  const repository = await resolveRepository(policy);

  const { InMemoryEventPublisher } = await import(
    "../../../../shared/InMemoryEventPublisher"
  );
  const eventPublisher = new InMemoryEventPublisher();

  return { repository, eventPublisher };
}
