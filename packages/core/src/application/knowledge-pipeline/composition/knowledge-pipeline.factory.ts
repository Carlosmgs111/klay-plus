import type { KnowledgePipelinePort } from "../contracts/KnowledgePipelinePort";
import type { ResolvedPipelineDependencies } from "../application/KnowledgePipelineOrchestrator";
import type { ManifestRepository } from "../contracts/ManifestRepository";
import type { OrchestratorPolicy } from "../../composition/OrchestratorPolicy";

export async function resolvePipelineDependencies(
  policy: OrchestratorPolicy,
): Promise<ResolvedPipelineDependencies> {
  const { resolvePlatformDependencies } = await import(
    "../../composition/resolvePlatformDependencies"
  );

  const platform = await resolvePlatformDependencies(policy);
  const { persistenceProvider, embeddingProvider, vectorStoreProvider, embeddingDimensions, embeddingModel } =
    platform.resolved;

  // ── Knowledge retrieval context (pipeline-specific) ───────────────
  const { createKnowledgeRetrievalService } = await import(
    "../../../contexts/knowledge-retrieval/service"
  );

  const retrieval = await createKnowledgeRetrievalService({
    provider: persistenceProvider,
    vectorStoreConfig: platform.processing.vectorStoreConfig,
    embeddingDimensions,
    embeddingProvider,
    embeddingModel,
    vectorStoreProvider,
    configOverrides: policy.configOverrides,
    configStore: policy.configStore,
  });

  // ── Manifest repository (pipeline-specific) ───────────────────────
  const manifestRepository = await createManifestRepository(policy, persistenceProvider);

  return {
    ingestion: platform.ingestion,
    processing: platform.processing,
    contextManagement: platform.contextManagement,
    retrieval,
    manifestRepository,
  };
}

async function createManifestRepository(
  policy: OrchestratorPolicy,
  persistenceProvider: string,
): Promise<ManifestRepository> {
  if (persistenceProvider === "in-memory") {
    const { InMemoryManifestRepository } = await import(
      "../infrastructure/InMemoryManifestRepository"
    );
    return new InMemoryManifestRepository();
  }

  if (persistenceProvider === "browser") {
    const { IndexedDBManifestRepository } = await import(
      "../infrastructure/IndexedDBManifestRepository"
    );
    return new IndexedDBManifestRepository(policy.dbName);
  }

  const { NeDBManifestRepository } = await import(
    "../infrastructure/NeDBManifestRepository"
  );
  const filename = policy.dbPath ? `${policy.dbPath}/manifests.db` : undefined;
  return new NeDBManifestRepository(filename);
}

export async function createKnowledgePipeline(
  policy: OrchestratorPolicy,
): Promise<KnowledgePipelinePort> {
  const { KnowledgePipelineOrchestrator } = await import(
    "../application/KnowledgePipelineOrchestrator"
  );

  const deps = await resolvePipelineDependencies(policy);
  return new KnowledgePipelineOrchestrator(deps);
}
