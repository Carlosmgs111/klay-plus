export interface Chunk {
    content: string;
    index: number;
    startOffset: number;
    endOffset: number;
    metadata: Record<string, string>;
}
export interface ChunkingStrategy {
    readonly strategyId: string;
    readonly version: number;
    chunk(content: string): Chunk[];
}
//# sourceMappingURL=ChunkingStrategy.d.ts.map