import type { KnowledgeCoordinator, ResolvedDependencies } from "../KnowledgeCoordinator";
import type { OrchestratorPolicy } from "../../composition/OrchestratorPolicy";

export async function resolveDependencies(
  policy: OrchestratorPolicy,
): Promise<ResolvedDependencies> {
  const { resolvePlatformDependencies } = await import(
    "../../composition/resolvePlatformDependencies"
  );

  const platform = await resolvePlatformDependencies(policy);
  const { persistenceProvider, embeddingProvider, embeddingDimensions, embeddingModel, vectorStoreProvider } =
    platform.resolved;

  // ── Knowledge retrieval context ────────────────────────────────────
  const { resolveKnowledgeRetrievalModules } = await import(
    "../../../contexts/knowledge-retrieval/composition/factory"
  );
  const { KnowledgeRetrievalService } = await import(
    "../../../contexts/knowledge-retrieval/service/KnowledgeRetrievalService"
  );

  const modules = await resolveKnowledgeRetrievalModules({
    provider: persistenceProvider,
    vectorStoreConfig: platform.processing.vectorStoreConfig,
    embeddingDimensions,
    embeddingProvider,
    embeddingModel,
    vectorStoreProvider,
    retrieval: policy.infrastructure?.retrieval,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  const retrieval = new KnowledgeRetrievalService(modules);
  const retrievalInfra = modules.semanticQueryInfra;

  return {
    ingestion: platform.ingestion,
    processing: platform.processing,
    contextManagement: platform.contextManagement,
    retrieval,
    retrievalInfra,
  };
}

export async function createKnowledgePlatform(
  policy: OrchestratorPolicy,
): Promise<KnowledgeCoordinator> {
  const { KnowledgeCoordinator } = await import(
    "../KnowledgeCoordinator"
  );

  const deps = await resolveDependencies(policy);
  return new KnowledgeCoordinator(deps);
}
