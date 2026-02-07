import type { SemanticQueryUseCases } from "../semantic-query/application/index.js";
import type { RetrievalResult } from "../semantic-query/domain/RetrievalResult.js";
export { KnowledgeRetrievalOrchestratorComposer } from "./composition/KnowledgeRetrievalOrchestratorComposer.js";
export type { KnowledgeRetrievalOrchestratorPolicy, KnowledgeRetrievalInfraPolicy, ResolvedKnowledgeRetrievalModules, } from "./composition/infra-policies.js";
import type { ResolvedKnowledgeRetrievalModules } from "./composition/infra-policies.js";
/**
 * Orchestrator for the Knowledge Retrieval bounded context.
 *
 * Provides a unified facade for semantic search operations,
 * enabling coordinated retrieval of knowledge from the vector store.
 */
export declare class KnowledgeRetrievalOrchestrator {
    private readonly _semanticQuery;
    constructor(modules: ResolvedKnowledgeRetrievalModules);
    get semanticQuery(): SemanticQueryUseCases;
    /**
     * Performs a semantic search query.
     */
    query(params: {
        text: string;
        topK?: number;
        minScore?: number;
        filters?: Record<string, unknown>;
    }): Promise<RetrievalResult>;
    /**
     * Performs a similarity search and returns simplified results.
     */
    search(queryText: string, options?: {
        limit?: number;
        threshold?: number;
        domain?: string;
    }): Promise<Array<{
        id: string;
        content: string;
        score: number;
        metadata: Record<string, unknown>;
    }>>;
    /**
     * Finds the most similar semantic unit for a given query.
     */
    findMostSimilar(queryText: string, minScore?: number): Promise<{
        id: string;
        content: string;
        score: number;
        metadata: Record<string, unknown>;
    } | null>;
    /**
     * Checks if similar content already exists in the knowledge base.
     */
    hasSimilarContent(content: string, similarityThreshold?: number): Promise<{
        exists: boolean;
        matchId?: string;
        score?: number;
    }>;
    /**
     * Retrieves related content for a given semantic unit.
     */
    findRelated(semanticUnitId: string, content: string, options?: {
        limit?: number;
        excludeSelf?: boolean;
    }): Promise<Array<{
        id: string;
        content: string;
        score: number;
        metadata: Record<string, unknown>;
    }>>;
    /**
     * Batch search for multiple queries.
     */
    batchSearch(queries: string[], options?: {
        limit?: number;
        threshold?: number;
    }): Promise<Array<{
        query: string;
        results: Array<{
            id: string;
            content: string;
            score: number;
            metadata: Record<string, unknown>;
        }>;
    }>>;
}
import type { KnowledgeRetrievalOrchestratorPolicy } from "./composition/infra-policies.js";
export declare function knowledgeRetrievalOrchestratorFactory(policy: KnowledgeRetrievalOrchestratorPolicy): Promise<KnowledgeRetrievalOrchestrator>;
//# sourceMappingURL=index.d.ts.map