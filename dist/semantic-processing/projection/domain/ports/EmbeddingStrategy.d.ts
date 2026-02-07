export interface EmbeddingResult {
    vector: number[];
    model: string;
    dimensions: number;
}
export interface EmbeddingStrategy {
    readonly strategyId: string;
    readonly version: number;
    embed(content: string): Promise<EmbeddingResult>;
    embedBatch(contents: string[]): Promise<EmbeddingResult[]>;
}
//# sourceMappingURL=EmbeddingStrategy.d.ts.map