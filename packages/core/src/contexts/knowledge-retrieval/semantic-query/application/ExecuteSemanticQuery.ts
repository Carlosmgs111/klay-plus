import { Query } from "../domain/Query.js";
import { RetrievalResult, RetrievalItem } from "../domain/RetrievalResult.js";
import type { QueryEmbedder } from "../domain/ports/QueryEmbedder.js";
import type { VectorReadStore } from "../domain/ports/VectorReadStore.js";
import type { RankingStrategy } from "../domain/ports/RankingStrategy.js";

export interface ExecuteSemanticQueryCommand {
  text: string;
  topK?: number;
  filters?: Record<string, unknown>;
  minScore?: number;
}

export class ExecuteSemanticQuery {
  constructor(
    private readonly embedder: QueryEmbedder,
    private readonly vectorSearch: VectorReadStore,
    private readonly rankingStrategy: RankingStrategy,
  ) {}

  async execute(command: ExecuteSemanticQueryCommand): Promise<RetrievalResult> {
    const query = Query.create(
      command.text,
      command.topK,
      command.filters,
      command.minScore,
    );

    const queryVector = await this.embedder.embed(query.text);

    const hits = await this.vectorSearch.search(
      queryVector,
      query.topK * 2,
      query.filters,
    );

    const rankedHits = await this.rankingStrategy.rerank(query.text, hits);

    const items = rankedHits
      .filter((hit) => hit.rerankedScore >= query.minScore)
      .slice(0, query.topK)
      .map((hit) =>
        RetrievalItem.create(
          hit.semanticUnitId,
          hit.content,
          hit.rerankedScore,
          (hit.metadata["version"] as number) ?? 0,
          hit.metadata,
        ),
      );

    return RetrievalResult.create(query.text, items, rankedHits.length);
  }
}
