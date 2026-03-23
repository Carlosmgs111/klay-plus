import type { VectorStoreConfig } from "../semantic-query/composition/factory";
import type { SemanticQueryUseCases } from "../semantic-query/application";
import type { ResolvedSemanticQueryInfra } from "../semantic-query/composition/factory";
import type { SemanticQueryInfrastructurePolicy } from "../semantic-query/composition/factory";
import type { ConfigStore } from "../../../config/ConfigStore";
import type { RetrievalConfig } from "../../../config/InfrastructureProfile";

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
