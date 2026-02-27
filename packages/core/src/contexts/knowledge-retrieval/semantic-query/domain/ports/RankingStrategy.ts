import type { SearchHit } from "./VectorReadStore";

export interface RankedHit extends SearchHit {
  rerankedScore: number;
}

export interface RankingStrategy {
  rerank(query: string, hits: SearchHit[]): Promise<RankedHit[]>;
}
