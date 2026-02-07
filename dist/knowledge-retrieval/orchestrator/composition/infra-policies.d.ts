import type { SemanticQueryInfrastructurePolicy } from "../../semantic-query/composition/infra-policies.js";
import type { SemanticQueryUseCases } from "../../semantic-query/application/index.js";
import type { VectorStoreAdapter } from "../../../semantic-processing/projection/domain/ports/VectorStoreAdapter.js";
export type KnowledgeRetrievalInfraPolicy = "in-memory" | "browser" | "server";
export interface KnowledgeRetrievalOrchestratorPolicy {
    type: KnowledgeRetrievalInfraPolicy;
    /**
     * Reference to the vector store from the semantic-processing context.
     * Required for cross-context wiring - retrieval reads from processing's vectors.
     */
    vectorStoreRef: VectorStoreAdapter;
    /**
     * Embedding dimensions - must match the embedding strategy used in processing.
     * @default 128
     */
    embeddingDimensions?: number;
    /**
     * AI SDK model ID for server-side embeddings.
     * @example "openai:text-embedding-3-small"
     */
    aiSdkModelId?: string;
    /**
     * Override policies for individual modules.
     * If not provided, modules inherit from the orchestrator's type.
     */
    overrides?: {
        semanticQuery?: Partial<Omit<SemanticQueryInfrastructurePolicy, "vectorStoreRef">>;
    };
}
export interface ResolvedKnowledgeRetrievalModules {
    semanticQuery: SemanticQueryUseCases;
}
//# sourceMappingURL=infra-policies.d.ts.map