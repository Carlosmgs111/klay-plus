export const StrategyType = {
  Embedding: "EMBEDDING",
  Chunking: "CHUNKING",
  Ranking: "RANKING",
} as const;

export type StrategyType = (typeof StrategyType)[keyof typeof StrategyType];
