import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder.js";

/**
 * Browser-side query embedder using @mlc-ai/web-llm.
 * Must use the same model as WebLLMEmbeddingStrategy for vector compatibility.
 */
export class WebLLMQueryEmbedder implements QueryEmbedder {
  private engine: any = null;

  constructor(
    private readonly modelId: string = "Phi-3-mini-4k-instruct-q4f16_1-MLC",
  ) {}

  async initialize(): Promise<void> {
    const webllm = await import("@mlc-ai/web-llm");
    this.engine = await webllm.CreateMLCEngine(this.modelId);
  }

  async embed(text: string): Promise<number[]> {
    if (!this.engine) {
      throw new Error(
        "WebLLMQueryEmbedder not initialized. Call initialize() first.",
      );
    }

    const response = await this.engine.embeddings.create({
      input: text,
      model: this.modelId,
    });

    return response.data[0].embedding as number[];
  }
}
