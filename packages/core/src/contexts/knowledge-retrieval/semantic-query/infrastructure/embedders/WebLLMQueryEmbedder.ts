import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder";

/**
 * Browser-side query embedder using @mlc-ai/web-llm.
 * Must use the same model as WebLLMEmbeddingStrategy for vector compatibility.
 */
export class WebLLMQueryEmbedder implements QueryEmbedder {
  private engine: any = null;
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly modelId: string = "Phi-3-mini-4k-instruct-q4f16_1-MLC",
  ) {}

  async initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const webllm = await import("@mlc-ai/web-llm");
        this.engine = await webllm.CreateMLCEngine(this.modelId);
      })();
    }
    await this.initPromise;
  }

  async embed(text: string): Promise<number[]> {
    await this.initialize();

    const response = await this.engine.embeddings.create({
      input: text,
      model: this.modelId,
    });

    return response.data[0].embedding as number[];
  }
}
