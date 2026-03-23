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

async function resolveRepository(policy: SourceInfrastructurePolicy): Promise<SourceRepository> {
  switch (policy.provider) {
    case "browser": {
      const { IndexedDBSourceRepository } = await import(
        "../infrastructure/persistence/indexeddb/IndexedDBSourceRepository"
      );
      return new IndexedDBSourceRepository(
        (policy.dbName as string) ?? "knowledge-platform",
      );
    }
    case "server": {
      const { NeDBSourceRepository } = await import(
        "../infrastructure/persistence/nedb/NeDBSourceRepository"
      );
      const filename = policy.dbPath ? `${policy.dbPath}/sources.db` : undefined;
      return new NeDBSourceRepository(filename);
    }
    default: {
      const { InMemorySourceRepository } = await import(
        "../infrastructure/persistence/InMemorySourceRepository"
      );
      return new InMemorySourceRepository();
    }
  }
}

export async function sourceFactory(
  policy: SourceInfrastructurePolicy,
): Promise<SourceFactoryResult> {
  const { InMemoryEventPublisher } = await import(
    "../../../../shared/InMemoryEventPublisher"
  );

  const repository = await resolveRepository(policy);
  const eventPublisher: EventPublisher = new InMemoryEventPublisher();

  return { infra: { repository, eventPublisher } };
}
