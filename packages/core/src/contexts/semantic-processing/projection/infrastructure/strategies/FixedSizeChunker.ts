import { BaseChunker } from "./BaseChunker";

export class FixedSizeChunker extends BaseChunker {
  readonly strategyId = "fixed-size-chunker";
  readonly version = 1;

  constructor(
    private readonly chunkSize: number = 500,
    private readonly overlap: number = 50,
  ) {
    super();
    if (chunkSize <= 0) throw new Error("chunkSize must be positive");
    if (overlap < 0) throw new Error("overlap must be non-negative");
    if (overlap >= chunkSize) throw new Error("overlap must be less than chunkSize");
  }

  protected splitContent(content: string): string[] {
    const chunks: string[] = [];
    let start = 0;
    const step = this.chunkSize - this.overlap;

    while (start < content.length) {
      const end = Math.min(start + this.chunkSize, content.length);
      chunks.push(content.slice(start, end));
      if (end >= content.length) break;
      start += step;
    }

    return chunks;
  }
}
