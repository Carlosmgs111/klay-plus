import type { SearchHit } from "./VectorSearchAdapter.js";

export interface RankedHit extends SearchHit {
  rerankedScore: number;
}

export interface RankingStrategy {
  rerank(query: string, hits: SearchHit[]): Promise<RankedHit[]>;
}
