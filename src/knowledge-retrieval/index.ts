export {
  Query,
  QueryId,
  RetrievalResult,
  RetrievalItem,
} from "./semantic-query/domain/index.js";

export type {
  VectorSearchAdapter,
  SearchHit,
  RankingStrategy,
  RankedHit,
  QueryEmbedder,
} from "./semantic-query/domain/index.js";

export { ExecuteSemanticQuery } from "./semantic-query/application/index.js";
export type { ExecuteSemanticQueryCommand } from "./semantic-query/application/index.js";

// ─── Infrastructure ────────────────────────────────────────────────
export {
  HashQueryEmbedder,
  WebLLMQueryEmbedder,
  AISdkQueryEmbedder,
  InMemoryVectorSearchAdapter,
  PassthroughRankingStrategy,
} from "./semantic-query/infrastructure/adapters/index.js";

// ─── Composition ───────────────────────────────────────────────────
export { KnowledgeRetrievalUseCases } from "./KnowledgeRetrievalUseCases.js";
export { KnowledgeRetrievalComposer } from "./composition/KnowledgeRetrievalComposer.js";
export type {
  KnowledgeRetrievalInfrastructurePolicy,
  ResolvedKnowledgeRetrievalInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { KnowledgeRetrievalInfrastructurePolicy } from "./composition/infra-policies.js";
import type { KnowledgeRetrievalUseCases as _KRUseCases } from "./KnowledgeRetrievalUseCases.js";

export async function knowledgeRetrievalFactory(
  policy: KnowledgeRetrievalInfrastructurePolicy,
): Promise<_KRUseCases> {
  const { KnowledgeRetrievalComposer } = await import(
    "./composition/KnowledgeRetrievalComposer.js"
  );
  const { KnowledgeRetrievalUseCases } = await import(
    "./KnowledgeRetrievalUseCases.js"
  );
  const infra = await KnowledgeRetrievalComposer.resolve(policy);
  return new KnowledgeRetrievalUseCases(
    infra.queryEmbedder,
    infra.vectorSearch,
    infra.rankingStrategy,
  );
}
