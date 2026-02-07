/**
 * No-op ranking strategy that preserves the original vector similarity score.
 * Suitable for cases where reranking is not needed or not available.
 */
export class PassthroughRankingStrategy {
    async rerank(_query, hits) {
        return hits
            .map((hit) => ({ ...hit, rerankedScore: hit.score }))
            .sort((a, b) => b.rerankedScore - a.rerankedScore);
    }
}
//# sourceMappingURL=PassthroughRankingStrategy.js.map