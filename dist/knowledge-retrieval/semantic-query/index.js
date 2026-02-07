// ─── Domain ────────────────────────────────────────────────────────
export { Query, QueryId, RetrievalResult, RetrievalItem } from "./domain/index.js";
// ─── Application ───────────────────────────────────────────────────
export { ExecuteSemanticQuery, SemanticQueryUseCases } from "./application/index.js";
// ─── Infrastructure ────────────────────────────────────────────────
export { HashQueryEmbedder, WebLLMQueryEmbedder, AISdkQueryEmbedder, InMemoryVectorSearchAdapter, PassthroughRankingStrategy, } from "./infrastructure/adapters/index.js";
// ─── Composition ───────────────────────────────────────────────────
export { SemanticQueryComposer } from "./composition/SemanticQueryComposer.js";
export async function semanticQueryFactory(policy) {
    const { SemanticQueryComposer } = await import("./composition/SemanticQueryComposer.js");
    const { SemanticQueryUseCases } = await import("./application/index.js");
    const infra = await SemanticQueryComposer.resolve(policy);
    return new SemanticQueryUseCases(infra.queryEmbedder, infra.vectorSearch, infra.rankingStrategy);
}
//# sourceMappingURL=index.js.map