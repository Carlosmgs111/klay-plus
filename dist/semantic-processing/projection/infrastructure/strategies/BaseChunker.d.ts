import type { Chunk, ChunkingStrategy } from "../../domain/ports/ChunkingStrategy.js";
/**
 * Template Method base for all chunking strategies.
 * Subclasses only need to implement splitContent().
 */
export declare abstract class BaseChunker implements ChunkingStrategy {
    abstract readonly strategyId: string;
    abstract readonly version: number;
    chunk(content: string): Chunk[];
    protected validate(content: string): string;
    protected abstract splitContent(content: string): string[];
    protected buildChunks(rawChunks: string[], originalContent: string): Chunk[];
    protected buildChunkMetadata(content: string, index: number): Record<string, string>;
    protected estimateTokens(text: string): number;
}
//# sourceMappingURL=BaseChunker.d.ts.map