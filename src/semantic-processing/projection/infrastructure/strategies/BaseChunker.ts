import type { Chunk, ChunkingStrategy } from "../../domain/ports/ChunkingStrategy.js";

/**
 * Template Method base for all chunking strategies.
 * Subclasses only need to implement splitContent().
 */
export abstract class BaseChunker implements ChunkingStrategy {
  abstract readonly strategyId: string;
  abstract readonly version: number;

  chunk(content: string): Chunk[] {
    const validated = this.validate(content);
    if (validated.length === 0) return [];

    const rawChunks = this.splitContent(validated);
    return this.buildChunks(rawChunks, validated);
  }

  protected validate(content: string): string {
    if (!content || content.trim().length === 0) return "";
    return content;
  }

  protected abstract splitContent(content: string): string[];

  protected buildChunks(rawChunks: string[], originalContent: string): Chunk[] {
    const chunks: Chunk[] = [];
    let searchFrom = 0;

    for (let i = 0; i < rawChunks.length; i++) {
      const chunkContent = rawChunks[i];
      if (chunkContent.length === 0) continue;

      const startOffset = originalContent.indexOf(chunkContent, searchFrom);
      const actualStart = startOffset >= 0 ? startOffset : searchFrom;

      chunks.push({
        content: chunkContent,
        index: chunks.length,
        startOffset: actualStart,
        endOffset: actualStart + chunkContent.length,
        metadata: this.buildChunkMetadata(chunkContent, chunks.length),
      });

      searchFrom = actualStart + chunkContent.length;
    }

    return chunks;
  }

  protected buildChunkMetadata(
    content: string,
    index: number,
  ): Record<string, string> {
    return {
      strategy: this.strategyId,
      chunkIndex: String(index),
      charCount: String(content.length),
      wordCount: String(content.split(/\s+/).filter(Boolean).length),
    };
  }

  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
