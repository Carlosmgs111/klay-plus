import { BaseChunker } from "./BaseChunker";

export class RecursiveChunker extends BaseChunker {
  readonly strategyId = "recursive";
  readonly version = 1;

  private readonly separators = ["\n\n", "\n", ". ", " "];

  constructor(
    private readonly chunkSize: number = 1000,
    private readonly overlap: number = 100,
  ) {
    super();
    if (chunkSize <= 0) throw new Error("chunkSize must be positive");
    if (overlap < 0) throw new Error("overlap must be non-negative");
  }

  protected splitContent(content: string): string[] {
    return this.recursiveSplit(content, 0);
  }

  private recursiveSplit(text: string, separatorIndex: number): string[] {
    if (text.length <= this.chunkSize) return [text];

    if (separatorIndex >= this.separators.length) {
      const chunks: string[] = [];
      const step = this.chunkSize - this.overlap;
      for (let i = 0; i < text.length; i += step) {
        chunks.push(text.slice(i, i + this.chunkSize));
        if (i + this.chunkSize >= text.length) break;
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
      if (candidate.length > this.chunkSize && current.length > 0) {
        chunks.push(current);
        current = part;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);

    return chunks.flatMap((chunk) =>
      chunk.length > this.chunkSize
        ? this.recursiveSplit(chunk, separatorIndex + 1)
        : [chunk],
    );
  }
}
