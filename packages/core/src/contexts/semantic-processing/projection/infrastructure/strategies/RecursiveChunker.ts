import { BaseChunker } from "./BaseChunker";

export class RecursiveChunker extends BaseChunker {
  readonly strategyId = "recursive-chunker";
  readonly version = 1;

  private readonly separators = ["\n\n", "\n", ". ", " "];

  constructor(
    private readonly maxChunkSize: number = 1000,
    private readonly overlap: number = 100,
  ) {
    super();
    if (maxChunkSize <= 0) throw new Error("maxChunkSize must be positive");
    if (overlap < 0) throw new Error("overlap must be non-negative");
  }

  protected splitContent(content: string): string[] {
    return this.recursiveSplit(content, 0);
  }

  private recursiveSplit(text: string, separatorIndex: number): string[] {
    if (text.length <= this.maxChunkSize) return [text];

    if (separatorIndex >= this.separators.length) {
      const chunks: string[] = [];
      const step = this.maxChunkSize - this.overlap;
      for (let i = 0; i < text.length; i += step) {
        chunks.push(text.slice(i, i + this.maxChunkSize));
        if (i + this.maxChunkSize >= text.length) break;
      }
      return chunks;
    }

    const separator = this.separators[separatorIndex];
    const parts = text.split(separator);

    if (parts.length <= 1) {
      return this.recursiveSplit(text, separatorIndex + 1);
    }

    const chunks: string[] = [];
    let current = "";

    for (const part of parts) {
      const candidate = current ? current + separator + part : part;
      if (candidate.length > this.maxChunkSize && current.length > 0) {
        chunks.push(current);
        current = part;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);

    return chunks.flatMap((chunk) =>
      chunk.length > this.maxChunkSize
        ? this.recursiveSplit(chunk, separatorIndex + 1)
        : [chunk],
    );
  }
}
