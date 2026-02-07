import type { SemanticQueryUseCases } from "../semantic-query/application/index.js";
import type { RetrievalResult } from "../semantic-query/domain/RetrievalResult.js";

// ─── Composition ───────────────────────────────────────────────────
export { KnowledgeRetrievalOrchestratorComposer } from "./composition/KnowledgeRetrievalOrchestratorComposer.js";
export type {
  KnowledgeRetrievalOrchestratorPolicy,
  KnowledgeRetrievalInfraPolicy,
  ResolvedKnowledgeRetrievalModules,
} from "./composition/infra-policies.js";

import type { ResolvedKnowledgeRetrievalModules } from "./composition/infra-policies.js";

// ─── Orchestrator ──────────────────────────────────────────────────

/**
 * Orchestrator for the Knowledge Retrieval bounded context.
 *
 * Provides a unified facade for semantic search operations,
 * enabling coordinated retrieval of knowledge from the vector store.
 */
export class KnowledgeRetrievalOrchestrator {
  private readonly _semanticQuery: SemanticQueryUseCases;

  constructor(modules: ResolvedKnowledgeRetrievalModules) {
    this._semanticQuery = modules.semanticQuery;
  }

  // ─── Module Accessors ─────────────────────────────────────────────────────

  get semanticQuery(): SemanticQueryUseCases {
    return this._semanticQuery;
  }

  // ─── Orchestrated Operations ──────────────────────────────────────────────

  /**
   * Performs a semantic search query.
   */
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

  /**
   * Performs a similarity search and returns simplified results.
   */
  async search(
    queryText: string,
    options?: {
      limit?: number;
      threshold?: number;
      domain?: string;
    },
  ): Promise<
    Array<{
      id: string;
      content: string;
      score: number;
      metadata: Record<string, unknown>;
    }>
  > {
    const result = await this.query({
      text: queryText,
      topK: options?.limit ?? 10,
      minScore: options?.threshold ?? 0.5,
      filters: options?.domain ? { domain: options.domain } : undefined,
    });

    return result.items.map((item) => ({
      id: item.semanticUnitId,
      content: item.content,
      score: item.score,
      metadata: item.metadata,
    }));
  }

  /**
   * Finds the most similar semantic unit for a given query.
   */
  async findMostSimilar(
    queryText: string,
    minScore = 0.7,
  ): Promise<{
    id: string;
    content: string;
    score: number;
    metadata: Record<string, unknown>;
  } | null> {
    const results = await this.search(queryText, { limit: 1, threshold: minScore });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Checks if similar content already exists in the knowledge base.
   */
  async hasSimilarContent(
    content: string,
    similarityThreshold = 0.9,
  ): Promise<{ exists: boolean; matchId?: string; score?: number }> {
    const match = await this.findMostSimilar(content, similarityThreshold);

    if (match) {
      return {
        exists: true,
        matchId: match.id,
        score: match.score,
      };
    }

    return { exists: false };
  }

  /**
   * Retrieves related content for a given semantic unit.
   */
  async findRelated(
    semanticUnitId: string,
    content: string,
    options?: {
      limit?: number;
      excludeSelf?: boolean;
    },
  ): Promise<
    Array<{
      id: string;
      content: string;
      score: number;
      metadata: Record<string, unknown>;
    }>
  > {
    const results = await this.search(content, {
      limit: (options?.limit ?? 5) + 1,
      threshold: 0.5,
    });

    if (options?.excludeSelf !== false) {
      return results
        .filter((r) => r.id !== semanticUnitId)
        .slice(0, options?.limit ?? 5);
    }

    return results.slice(0, options?.limit ?? 5);
  }

  /**
   * Batch search for multiple queries.
   */
  async batchSearch(
    queries: string[],
    options?: {
      limit?: number;
      threshold?: number;
    },
  ): Promise<
    Array<{
      query: string;
      results: Array<{
        id: string;
        content: string;
        score: number;
        metadata: Record<string, unknown>;
      }>;
    }>
  > {
    const searchResults = await Promise.all(
      queries.map((query) =>
        this.search(query, {
          limit: options?.limit,
          threshold: options?.threshold,
        }),
      ),
    );

    return queries.map((query, index) => ({
      query,
      results: searchResults[index],
    }));
  }
}

// ─── Orchestrator Factory ──────────────────────────────────────────
import type { KnowledgeRetrievalOrchestratorPolicy } from "./composition/infra-policies.js";

export async function knowledgeRetrievalOrchestratorFactory(
  policy: KnowledgeRetrievalOrchestratorPolicy,
): Promise<KnowledgeRetrievalOrchestrator> {
  const { KnowledgeRetrievalOrchestratorComposer } = await import(
    "./composition/KnowledgeRetrievalOrchestratorComposer.js"
  );
  const modules = await KnowledgeRetrievalOrchestratorComposer.resolve(policy);
  return new KnowledgeRetrievalOrchestrator(modules);
}
