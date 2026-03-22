import type {
  RankingStrategy,
  RankedHit,
} from "../../domain/ports/RankingStrategy";
import type { SearchHit } from "../../domain/ports/VectorReadStore";

/**
 * Cross-encoder reranking strategy using @huggingface/transformers.
 * Scores query-document pairs directly (more accurate than bi-encoder cosine similarity).
 * Works in both browser (WASM) and server (Node).
 *
 * Default model: cross-encoder/ms-marco-MiniLM-L-6-v2
 */
export class CrossEncoderRankingStrategy implements RankingStrategy {
  private pipeline: any = null;
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly modelId: string = "cross-encoder/ms-marco-MiniLM-L-6-v2",
  ) {}

  async initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const { pipeline } = await import("@huggingface/transformers");
        this.pipeline = await pipeline("text-classification", this.modelId);
      })();
    }
    await this.initPromise;
  }

  async rerank(
    query: string,
    _queryVector: number[],
    hits: SearchHit[],
  ): Promise<RankedHit[]> {
    await this.initialize();

    const pairs = hits.map((h) => ({ text: query, text_pair: h.content }));
    const scores: Array<{ score: number }> = await this.pipeline(pairs, {
      function_to_apply: "sigmoid",
    });

    return hits
      .map((h, i) => ({ ...h, rerankedScore: scores[i].score }))
      .sort((a, b) => b.rerankedScore - a.rerankedScore);
  }
}
