// ─── Domain ────────────────────────────────────────────────────────
export { Query, QueryId, RetrievalResult, RetrievalItem } from "./domain/index.js";

export type {
  VectorSearchAdapter,
  SearchHit,
  RankingStrategy,
  RankedHit,
  QueryEmbedder,
} from "./domain/index.js";

// ─── Application ───────────────────────────────────────────────────
export { ExecuteSemanticQuery, SemanticQueryUseCases } from "./application/index.js";
export type { ExecuteSemanticQueryCommand } from "./application/index.js";

// ─── Infrastructure ────────────────────────────────────────────────
export {
  HashQueryEmbedder,
  WebLLMQueryEmbedder,
  AISdkQueryEmbedder,
  InMemoryVectorSearchAdapter,
  PassthroughRankingStrategy,
} from "./infrastructure/adapters/index.js";

// ─── Composition ───────────────────────────────────────────────────
export { SemanticQueryComposer } from "./composition/SemanticQueryComposer.js";
export type {
  SemanticQueryInfrastructurePolicy,
  ResolvedSemanticQueryInfra,
} from "./composition/infra-policies.js";

// ─── Module Factory ────────────────────────────────────────────────
import type { SemanticQueryInfrastructurePolicy } from "./composition/infra-policies.js";
import type { SemanticQueryUseCases as _UseCases } from "./application/index.js";

export async function semanticQueryFactory(
  policy: SemanticQueryInfrastructurePolicy,
): Promise<_UseCases> {
  const { SemanticQueryComposer } = await import("./composition/SemanticQueryComposer.js");
  const { SemanticQueryUseCases } = await import("./application/index.js");
  const infra = await SemanticQueryComposer.resolve(policy);
  return new SemanticQueryUseCases(
    infra.queryEmbedder,
    infra.vectorSearch,
    infra.rankingStrategy,
  );
}
