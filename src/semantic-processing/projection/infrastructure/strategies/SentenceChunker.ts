import { BaseChunker } from "./BaseChunker.js";

export class SentenceChunker extends BaseChunker {
  readonly strategyId = "sentence-chunker";
  readonly version = 1;

  constructor(
    private readonly maxChunkSize: number = 1000,
    private readonly minChunkSize: number = 100,
  ) {
    super();
    if (maxChunkSize <= 0) throw new Error("maxChunkSize must be positive");
    if (minChunkSize < 0) throw new Error("minChunkSize must be non-negative");
  }

  protected splitContent(content: string): string[] {
    const sentences = content.match(/[^.!?]*[.!?]+[\s]*/g) || [content];
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
      if (
        current.length + sentence.length > this.maxChunkSize &&
        current.length >= this.minChunkSize
      ) {
        chunks.push(current.trim());
        current = "";
      }
      current += sentence;
    }

    if (current.trim().length > 0) {
      chunks.push(current.trim());
    }

    return chunks;
  }
}
