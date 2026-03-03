import type { KnowledgeManagementPort } from "../contracts/KnowledgeManagementPort";
import type { ResolvedManagementDependencies } from "../application/KnowledgeManagementOrchestrator";

export interface KnowledgeManagementPolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  configOverrides?: Record<string, string>;
}

async function resolveManagementDependencies(
  policy: KnowledgeManagementPolicy,
): Promise<ResolvedManagementDependencies> {
  const [
    { createSourceIngestionService },
    { createSemanticProcessingService },
  ] = await Promise.all([
    import("../../../contexts/source-ingestion/service"),
    import("../../../contexts/semantic-processing/service"),
  ]);

  const [ingestion, processing] = await Promise.all([
    createSourceIngestionService({
      provider: policy.provider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      configOverrides: policy.configOverrides,
    }),
    createSemanticProcessingService({
      provider: policy.provider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      embeddingDimensions: policy.embeddingDimensions,
      embeddingProvider: policy.embeddingProvider,
      embeddingModel: policy.embeddingModel,
      configOverrides: policy.configOverrides,
    }),
  ]);

  // ── Source-knowledge context ──────────────────────────────────────
  const { createSourceKnowledgeContext } = await import(
    "../../../contexts/source-knowledge/composition/factory"
  );
  const { InMemorySourceKnowledgeRepository } = await import(
    "../../../contexts/source-knowledge/source/infrastructure/InMemorySourceKnowledgeRepository"
  );
  const { InMemoryEventPublisher } = await import(
    "../../../platform/eventing/InMemoryEventPublisher"
  );

  const { service: sourceKnowledge } = createSourceKnowledgeContext({
    sourceKnowledgeRepository: new InMemorySourceKnowledgeRepository(),
    sourceKnowledgeEventPublisher: new InMemoryEventPublisher(),
  });

  // ── Context-management context ───────────────────────────────────
  const { createContextManagementContext } = await import(
    "../../../contexts/context-management/composition/factory"
  );
  const { InMemoryContextRepository } = await import(
    "../../../contexts/context-management/context/infrastructure/InMemoryContextRepository"
  );

  const { service: contextManagement } = createContextManagementContext({
    contextRepository: new InMemoryContextRepository(),
    contextEventPublisher: new InMemoryEventPublisher(),
  });

  return { ingestion, sourceKnowledge, processing, contextManagement };
}

export async function createKnowledgeManagement(
  policy: KnowledgeManagementPolicy,
): Promise<KnowledgeManagementPort> {
  const { KnowledgeManagementOrchestrator } = await import(
    "../application/KnowledgeManagementOrchestrator"
  );

  const deps = await resolveManagementDependencies(policy);
  return new KnowledgeManagementOrchestrator(deps);
}
