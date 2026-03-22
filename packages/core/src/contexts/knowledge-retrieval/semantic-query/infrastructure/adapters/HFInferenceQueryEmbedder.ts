import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder";

/**
 * Query embedder using HuggingFace Inference API.
 * Stateless HTTP calls — no init needed.
 * Must use the same model as HFInferenceEmbeddingStrategy for vector compatibility.
 *
 * @example
 * const embedder = new HFInferenceQueryEmbedder(apiKey, "sentence-transformers/all-MiniLM-L6-v2");
 */
export class HFInferenceQueryEmbedder implements QueryEmbedder {
  constructor(
    private readonly apiKey: string,
    private readonly modelId: string = "sentence-transformers/all-MiniLM-L6-v2",
  ) {}

  async embed(text: string): Promise<number[]> {
    const { HfInference } = await import("@huggingface/inference");
    const hf = new HfInference(this.apiKey);

    const output = await hf.featureExtraction({
      model: this.modelId,
      inputs: text,
    });

    return output as unknown as number[];
  }
}
