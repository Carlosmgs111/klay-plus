import type {
  EmbeddingStrategy,
  EmbeddingResult,
} from "../../../domain/ports/EmbeddingStrategy";

/**
 * Embedding strategy using @huggingface/transformers (ONNX runtime).
 * Runs locally in both browser and server — no API key needed.
 *
 * Usage:
 *   const strategy = new TransformersJSEmbeddingStrategy("Xenova/all-MiniLM-L6-v2");
 *   await strategy.initialize();
 */
export class TransformersJSEmbeddingStrategy implements EmbeddingStrategy {
  readonly strategyId: string;
  readonly version = 1;

  private extractor: any = null;

  constructor(
    private readonly modelId: string = "Xenova/all-MiniLM-L6-v2",
  ) {
    this.strategyId = `huggingface-${modelId}`;
  }

  async initialize(): Promise<void> {
    const { retryWithBackoff } = await import("../../../../../../platform/retry");
    this.extractor = await retryWithBackoff(
      async () => {
        const { pipeline } = await import("@huggingface/transformers");
        return pipeline("feature-extraction", this.modelId);
      },
      { label: `TransformersJS model load (${this.modelId})` },
    );
  }

  async embed(content: string): Promise<EmbeddingResult> {
    this.ensureInitialized();

    const output = await this.extractor(content, {
      pooling: "mean",
      normalize: true,
    });

    const vector: number[] = Array.from(output.data as Float32Array);

    return {
      vector,
      model: this.modelId,
      dimensions: vector.length,
    };
  }

  async embedBatch(contents: string[]): Promise<EmbeddingResult[]> {
    this.ensureInitialized();

    const results: EmbeddingResult[] = [];
    for (const content of contents) {
      results.push(await this.embed(content));
    }
    return results;
  }

  private ensureInitialized(): void {
    if (!this.extractor) {
      throw new Error(
        "TransformersJSEmbeddingStrategy not initialized. Call initialize() first.",
      );
    }
  }
}
