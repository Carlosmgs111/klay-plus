import type {
  EmbeddingStrategy,
  EmbeddingResult,
} from "../../domain/ports/EmbeddingStrategy.js";

/**
 * Browser-side embedding strategy using @mlc-ai/web-llm.
 * Runs a model locally in the browser via WebGPU / WASM.
 *
 * Usage:
 *   const strategy = new WebLLMEmbeddingStrategy("Phi-3-mini-4k-instruct-q4f16_1-MLC");
 *   await strategy.initialize();
 */
export class WebLLMEmbeddingStrategy implements EmbeddingStrategy {
  readonly strategyId = "web-llm-embedding";
  readonly version = 1;

  private engine: any = null;

  constructor(
    private readonly modelId: string = "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    private readonly embeddingDimensions: number = 768,
  ) {}

  async initialize(): Promise<void> {
    const webllm = await import("@mlc-ai/web-llm");
    this.engine = await webllm.CreateMLCEngine(this.modelId);
  }

  async embed(content: string): Promise<EmbeddingResult> {
    this.ensureInitialized();

    const response = await this.engine.embeddings.create({
      input: content,
      model: this.modelId,
    });

    const vector: number[] = response.data[0].embedding;

    return {
      vector,
      model: this.modelId,
      dimensions: vector.length,
    };
  }

  async embedBatch(contents: string[]): Promise<EmbeddingResult[]> {
    this.ensureInitialized();

    const response = await this.engine.embeddings.create({
      input: contents,
      model: this.modelId,
    });

    return response.data.map((item: any) => ({
      vector: item.embedding as number[],
      model: this.modelId,
      dimensions: (item.embedding as number[]).length,
    }));
  }

  private ensureInitialized(): void {
    if (!this.engine) {
      throw new Error(
        "WebLLMEmbeddingStrategy not initialized. Call initialize() first.",
      );
    }
  }
}
