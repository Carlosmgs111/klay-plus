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

async function resolveRepository(policy: ContextInfrastructurePolicy): Promise<ContextRepository> {
  switch (policy.provider) {
    case "browser": {
      const { IndexedDBContextRepository } = await import(
        "../infrastructure/persistence/indexeddb/IndexedDBContextRepository"
      );
      return new IndexedDBContextRepository(
        (policy.dbName as string) ?? "knowledge-platform",
      );
    }
    case "server": {
      const { NeDBContextRepository } = await import(
        "../infrastructure/persistence/nedb/NeDBContextRepository"
      );
      const filename = policy.dbPath
        ? `${policy.dbPath}/context.db`
        : undefined;
      return new NeDBContextRepository(filename);
    }
    default: {
      const { InMemoryContextRepository } = await import(
        "../infrastructure/InMemoryContextRepository"
      );
      return new InMemoryContextRepository();
    }
  }
}

async function resolveEventPublisher(): Promise<EventPublisher> {
  const { InMemoryEventPublisher } = await import(
    "../../../../shared/InMemoryEventPublisher"
  );
  return new InMemoryEventPublisher();
}

export async function contextFactory(
  policy: ContextInfrastructurePolicy,
): Promise<ContextFactoryResult> {
  const [repository, eventPublisher] = await Promise.all([
    resolveRepository(policy),
    resolveEventPublisher(),
  ]);

  return { infra: { repository, eventPublisher } };
}
