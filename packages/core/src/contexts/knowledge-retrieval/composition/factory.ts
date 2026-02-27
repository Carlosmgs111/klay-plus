import type { VectorStoreConfig } from "../semantic-query/composition/factory";
import type { SemanticQueryUseCases } from "../semantic-query/application";
import type { ResolvedSemanticQueryInfra } from "../semantic-query/composition/factory";
import type { SemanticQueryInfrastructurePolicy } from "../semantic-query/composition/factory";

interface SemanticQueryOverrides {
  provider?: string;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  webLLMModelId?: string;
  configOverrides?: Record<string, string>;
}

export interface KnowledgeRetrievalServicePolicy {
  provider: string;
  vectorStoreConfig: VectorStoreConfig;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  embeddingModel?: string;
  overrides?: {
    semanticQuery?: SemanticQueryOverrides;
  };
  configOverrides?: Record<string, string>;
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
    configOverrides:
      policy.overrides?.semanticQuery?.configOverrides ??
      policy.configOverrides,
  };

  const semanticQueryResult = await import(
    "../semantic-query/composition/factory"
  ).then((m) => m.semanticQueryFactory(semanticQueryPolicy));

  return {
    semanticQuery: semanticQueryResult.useCases,
    semanticQueryInfra: semanticQueryResult.infra,
  };
}
