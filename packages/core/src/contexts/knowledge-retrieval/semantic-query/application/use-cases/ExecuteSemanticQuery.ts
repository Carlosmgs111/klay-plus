import { Query } from "../../domain/Query";
import { RetrievalResult, RetrievalItem } from "../../domain/RetrievalResult";
import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder";
import type { SearchStrategy } from "../../domain/ports/SearchStrategy";
import type { SearchHit } from "../../domain/ports/VectorReadStore";
import type { RankingStrategy } from "../../domain/ports/RankingStrategy";
import type { QueryExpander } from "../../domain/ports/QueryExpander";

export interface ExecuteSemanticQueryCommand {
  text: string;
  topK?: number;
  filters?: Record<string, unknown>;
  minScore?: number;
}

function deduplicateByHighestScore(hits: SearchHit[]): SearchHit[] {
  const best = new Map<string, SearchHit>();
  for (const hit of hits) {
    const existing = best.get(hit.id);
    if (!existing || hit.score > existing.score) {
      best.set(hit.id, hit);
    }
  }
  return [...best.values()];
}

export class ExecuteSemanticQuery {
  constructor(
    private readonly embedder: QueryEmbedder,
    private readonly searchStrategy: SearchStrategy,
    private readonly rankingStrategy: RankingStrategy,
    private readonly expander?: QueryExpander,
  ) {}

  async execute(command: ExecuteSemanticQueryCommand): Promise<RetrievalResult> {
    const query = Query.create(
      command.text,
      command.topK,
      command.filters,
      command.minScore,
    );

    // Query expansion: generate alternative formulations
    const queries = this.expander
      ? [query.text, ...await this.expander.expand(query.text)]
      : [query.text];

    // Embed all query variants
    const vectors = await Promise.all(queries.map((q) => this.embedder.embed(q)));

    // Search with each vector, merge + deduplicate by id (keep highest score)
    const hitSets = await Promise.all(
      vectors.map((v, i) =>
        this.searchStrategy.search(
          { vector: v, text: queries[i] },
          query.topK * 2,
          query.filters,
        ),
      ),
    );
    const hits = deduplicateByHighestScore(hitSets.flat());

    // Rerank with original query vector (first = original query)
    const rankedHits = await this.rankingStrategy.rerank(query.text, vectors[0], hits);

    // Normalize scores relative to the best match so minScore works as
    // a meaningful relative threshold regardless of embedding strategy.
    const maxScore = rankedHits.length > 0
      ? Math.max(...rankedHits.map((h) => h.rerankedScore))
      : 0;

    const items = rankedHits
      .map((hit) => ({
        ...hit,
        normalizedScore: maxScore > 0 ? hit.rerankedScore / maxScore : 0,
      }))
      .filter((hit) => hit.normalizedScore >= query.minScore)
      .slice(0, query.topK)
      .map((hit) =>
        RetrievalItem.create(
          hit.sourceId,
          hit.content,
          hit.normalizedScore,
          (hit.metadata["version"] as number) ?? 0,
          hit.metadata,
        ),
      );

    return RetrievalResult.create(query.text, items, rankedHits.length);
  }
}
