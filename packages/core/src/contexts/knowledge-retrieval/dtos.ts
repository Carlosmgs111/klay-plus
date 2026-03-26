export interface SearchKnowledgeInput {
  queryText: string;
  topK?: number;
  minScore?: number;
  filters?: Record<string, unknown>;
  retrievalOverride?: {
    ranking?: "passthrough" | "mmr" | "cross-encoder";
    mmrLambda?: number;
    crossEncoderModel?: string;
  };
}

export interface SearchKnowledgeSuccess {
  queryText: string;
  items: Array<{
    sourceId: string;
    content: string;
    score: number;
    metadata: Record<string, unknown>;
  }>;
  totalFound: number;
}
