import type { SparseReadStore } from "../../domain/ports/SparseReadStore";
import type { SearchHit } from "../../domain/ports/VectorReadStore";
import type { VectorEntry } from "../../../../../platform/vector/VectorEntry";

interface ScoredEntry {
  entry: VectorEntry;
  score: number;
}

/**
 * Base class for BM25 sparse read store implementations.
 * Subclasses only implement `loadEntries()` — same template-method pattern as BaseVectorReadStore.
 *
 * BM25 parameters:
 * - k1 = 1.5 (term frequency saturation)
 * - b  = 0.75 (length normalization)
 */
export abstract class BaseSparseReadStore implements SparseReadStore {
  private readonly k1 = 1.5;
  private readonly b = 0.75;

  protected abstract loadEntries(): Promise<VectorEntry[]>;

  async search(
    queryText: string,
    topK: number,
    filter?: Record<string, unknown>,
  ): Promise<SearchHit[]> {
    let entries = await this.loadEntries();

    if (filter) {
      entries = entries.filter((entry) =>
        Object.entries(filter).every(([key, value]) => entry.metadata[key] === value),
      );
    }

    const scored = this.bm25Score(queryText, entries);

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ entry, score }) => ({
        id: entry.id,
        sourceId: entry.sourceId,
        content: entry.content,
        score,
        vector: entry.vector ?? [],
        metadata: entry.metadata,
      }));
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase().split(/\W+/).filter(Boolean);
  }

  private bm25Score(query: string, docs: VectorEntry[]): ScoredEntry[] {
    const queryTerms = this.tokenize(query);
    if (queryTerms.length === 0 || docs.length === 0) {
      return docs.map((entry) => ({ entry, score: 0 }));
    }

    // Build inverted index + term frequencies per document
    const docTerms: string[][] = docs.map((d) => this.tokenize(d.content));
    const avgdl = docTerms.reduce((sum, t) => sum + t.length, 0) / docs.length;

    // Document frequency per term
    const df = new Map<string, number>();
    for (const terms of docTerms) {
      const unique = new Set(terms);
      for (const t of unique) {
        df.set(t, (df.get(t) ?? 0) + 1);
      }
    }

    const N = docs.length;

    return docs.map((entry, i) => {
      const terms = docTerms[i];
      const dl = terms.length;

      // Term frequency map for this document
      const tf = new Map<string, number>();
      for (const t of terms) {
        tf.set(t, (tf.get(t) ?? 0) + 1);
      }

      let score = 0;
      for (const term of queryTerms) {
        const termTf = tf.get(term) ?? 0;
        const termDf = df.get(term) ?? 0;
        if (termDf === 0) continue;

        const idf = Math.log((N - termDf + 0.5) / (termDf + 0.5) + 1);
        const tfNorm =
          (termTf * (this.k1 + 1)) /
          (termTf + this.k1 * (1 - this.b + this.b * (dl / avgdl)));

        score += idf * tfNorm;
      }

      return { entry, score };
    });
  }
}
