import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder";

/**
 * Query embedder using @huggingface/transformers (ONNX runtime).
 * Runs locally in both browser and server — no API key needed.
 * Must use the same model as TransformersJSEmbeddingStrategy for vector compatibility.
 */
export class TransformersJSQueryEmbedder implements QueryEmbedder {
  private extractor: any = null;

  constructor(
    private readonly modelId: string = "Xenova/all-MiniLM-L6-v2",
  ) {}

  async initialize(): Promise<void> {
    const { retryWithBackoff } = await import("../../../../../shared/retry");
    this.extractor = await retryWithBackoff(
      async () => {
        const mod = typeof window !== "undefined"
          ? await import(/* @vite-ignore */ "https://esm.sh/@huggingface/transformers")
          : await import("@huggingface/transformers");
        return mod.pipeline("feature-extraction", this.modelId);
      },
      { label: `TransformersJS query embedder load (${this.modelId})` },
    );
  }

  async embed(text: string): Promise<number[]> {
    if (!this.extractor) {
      throw new Error(
        "TransformersJSQueryEmbedder not initialized. Call initialize() first.",
      );
    }

    const output = await this.extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data as Float32Array);
  }
}
