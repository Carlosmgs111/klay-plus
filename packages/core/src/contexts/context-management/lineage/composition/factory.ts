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

async function resolveRepository(policy: LineageInfrastructurePolicy): Promise<KnowledgeLineageRepository> {
  switch (policy.provider) {
    case "browser": {
      const { IndexedDBKnowledgeLineageRepository } = await import(
        "../infrastructure/persistence/indexeddb/IndexedDBKnowledgeLineageRepository"
      );
      return new IndexedDBKnowledgeLineageRepository(
        (policy.dbName as string) ?? "knowledge-platform",
      );
    }
    case "server": {
      const { NeDBKnowledgeLineageRepository } = await import(
        "../infrastructure/persistence/nedb/NeDBKnowledgeLineageRepository"
      );
      const filename = policy.dbPath
        ? `${policy.dbPath}/lineage.db`
        : undefined;
      return new NeDBKnowledgeLineageRepository(filename);
    }
    default: {
      const { InMemoryKnowledgeLineageRepository } = await import(
        "../infrastructure/persistence/InMemoryKnowledgeLineageRepository"
      );
      return new InMemoryKnowledgeLineageRepository();
    }
  }
}

async function resolveEventPublisher(): Promise<EventPublisher> {
  const { InMemoryEventPublisher } = await import(
    "../../../../shared/InMemoryEventPublisher"
  );
  return new InMemoryEventPublisher();
}

export async function lineageFactory(
  policy: LineageInfrastructurePolicy,
): Promise<LineageFactoryResult> {
  const [repository, eventPublisher] = await Promise.all([
    resolveRepository(policy),
    resolveEventPublisher(),
  ]);

  return { infra: { repository, eventPublisher } };
}
