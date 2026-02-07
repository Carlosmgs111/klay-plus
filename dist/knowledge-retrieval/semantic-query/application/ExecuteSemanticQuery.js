import { Query } from "../domain/Query.js";
import { RetrievalResult, RetrievalItem } from "../domain/RetrievalResult.js";
export class ExecuteSemanticQuery {
    embedder;
    vectorSearch;
    rankingStrategy;
    constructor(embedder, vectorSearch, rankingStrategy) {
        this.embedder = embedder;
        this.vectorSearch = vectorSearch;
        this.rankingStrategy = rankingStrategy;
    }
    async execute(command) {
        const query = Query.create(command.text, command.topK, command.filters, command.minScore);
        const queryVector = await this.embedder.embed(query.text);
        const hits = await this.vectorSearch.search(queryVector, query.topK * 2, query.filters);
        const rankedHits = await this.rankingStrategy.rerank(query.text, hits);
        const items = rankedHits
            .filter((hit) => hit.rerankedScore >= query.minScore)
            .slice(0, query.topK)
            .map((hit) => RetrievalItem.create(hit.semanticUnitId, hit.content, hit.rerankedScore, hit.metadata["version"] ?? 0, hit.metadata));
        return RetrievalResult.create(query.text, items, rankedHits.length);
    }
}
//# sourceMappingURL=ExecuteSemanticQuery.js.map