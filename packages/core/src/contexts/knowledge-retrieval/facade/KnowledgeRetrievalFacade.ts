import type { SemanticQueryUseCases } from "../semantic-query/application";
import type { RetrievalResult } from "../semantic-query/domain/RetrievalResult";
import type { ResolvedKnowledgeRetrievalModules } from "./composition/factory";

export class KnowledgeRetrievalFacade {
  private readonly _semanticQuery: SemanticQueryUseCases;

  constructor(modules: ResolvedKnowledgeRetrievalModules) {
    this._semanticQuery = modules.semanticQuery;
  }

  get semanticQuery(): SemanticQueryUseCases {
    return this._semanticQuery;
  }

  async query(params: {
    text: string;
    topK?: number;
    minScore?: number;
    filters?: Record<string, unknown>;
  }): Promise<RetrievalResult> {
    return this._semanticQuery.executeSemanticQuery.execute({
      text: params.text,
      topK: params.topK,
      minScore: params.minScore,
      filters: params.filters,
    });
  }

  async batchQuery(
    queries: Array<{
      text: string;
      topK?: number;
      minScore?: number;
      filters?: Record<string, unknown>;
    }>,
  ): Promise<RetrievalResult[]> {
    return Promise.all(queries.map((q) => this.query(q)));
  }
}
