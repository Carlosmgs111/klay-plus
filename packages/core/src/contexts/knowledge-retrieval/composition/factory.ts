import type { VectorStoreConfig } from "../semantic-query/composition/factory";
import type { SemanticQueryUseCases } from "../semantic-query/application";
import type { ResolvedSemanticQueryInfra } from "../semantic-query/composition/factory";
import type { SemanticQueryInfrastructurePolicy } from "../semantic-query/composition/factory";
import type { ConfigStore } from "../../../config/ConfigStore";
import type { RetrievalConfig } from "../../../config/InfrastructureProfile";
import type { SearchKnowledge as SearchKnowledgeType } from "../semantic-query/application/use-cases/SearchKnowledge";

interface SemanticQueryOverrides {
  provider?: string;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  webLLMModelId?: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
}

export interface KnowledgeRetrievalServicePolicy {
  provider: string;
  vectorStoreConfig: VectorStoreConfig;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  vectorStoreProvider?: string;
  retrieval?: RetrievalConfig;
  overrides?: {
    semanticQuery?: SemanticQueryOverrides;
  };
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
}

export interface ResolvedKnowledgeRetrievalModules {
  semanticQuery: SemanticQueryUseCases;
  semanticQueryInfra: ResolvedSemanticQueryInfra;
}

export async function resolveKnowledgeRetrievalModules(
  policy: KnowledgeRetrievalServicePolicy,
): Promise<ResolvedKnowledgeRetrievalModules> {
  const semanticQueryPolicy: SemanticQueryInfrastructurePolicy = {
    provider: policy.overrides?.semanticQuery?.provider ?? policy.provider,
    vectorStoreProvider: policy.vectorStoreProvider,
    vectorStoreConfig: policy.vectorStoreConfig,
    embeddingDimensions:
      policy.overrides?.semanticQuery?.embeddingDimensions ??
      policy.embeddingDimensions,
    embeddingProvider:
      policy.overrides?.semanticQuery?.embeddingProvider ??
      policy.embeddingProvider,
    embeddingModel:
      policy.overrides?.semanticQuery?.embeddingModel ??
      policy.embeddingModel,
    webLLMModelId:
      policy.overrides?.semanticQuery?.webLLMModelId,
    retrieval: policy.retrieval,
    configOverrides:
      policy.overrides?.semanticQuery?.configOverrides ??
      policy.configOverrides,
    configStore:
      policy.overrides?.semanticQuery?.configStore ??
      policy.configStore,
  };

  const semanticQueryResult = await import(
    "../semantic-query/composition/factory"
  ).then((m) => m.semanticQueryFactory(semanticQueryPolicy));

  return {
    semanticQuery: semanticQueryResult.useCases,
    semanticQueryInfra: semanticQueryResult.infra,
  };
}

// ── Self-contained context factory ──────────────────────────────────

export interface KnowledgeRetrievalCapabilities {
  searchKnowledge: SearchKnowledgeType;
}

export async function createKnowledgeRetrieval(
  config: KnowledgeRetrievalServicePolicy,
): Promise<KnowledgeRetrievalCapabilities> {
  const semanticQueryPolicy: SemanticQueryInfrastructurePolicy = {
    provider: config.overrides?.semanticQuery?.provider ?? config.provider,
    vectorStoreProvider: config.vectorStoreProvider,
    vectorStoreConfig: config.vectorStoreConfig,
    embeddingDimensions:
      config.overrides?.semanticQuery?.embeddingDimensions ??
      config.embeddingDimensions,
    embeddingProvider:
      config.overrides?.semanticQuery?.embeddingProvider ??
      config.embeddingProvider,
    embeddingModel:
      config.overrides?.semanticQuery?.embeddingModel ??
      config.embeddingModel,
    webLLMModelId:
      config.overrides?.semanticQuery?.webLLMModelId,
    retrieval: config.retrieval,
    configOverrides:
      config.overrides?.semanticQuery?.configOverrides ??
      config.configOverrides,
    configStore:
      config.overrides?.semanticQuery?.configStore ??
      config.configStore,
  };

  const { semanticQueryFactory } = await import(
    "../semantic-query/composition/factory"
  );
  const { infra: retrievalInfra } = await semanticQueryFactory(semanticQueryPolicy);

  const { SearchKnowledge } = await import(
    "../semantic-query/application/use-cases/SearchKnowledge"
  );
  const searchKnowledge = new SearchKnowledge(retrievalInfra);

  return { searchKnowledge };
}
