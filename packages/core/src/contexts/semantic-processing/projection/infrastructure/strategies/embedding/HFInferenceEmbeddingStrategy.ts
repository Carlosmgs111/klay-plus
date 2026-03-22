import type {
  EmbeddingStrategy,
  EmbeddingResult,
} from "../../../domain/ports/EmbeddingStrategy";

/**
 * Remote embedding strategy using HuggingFace Inference API.
 * Stateless HTTP calls — no lazy init needed.
 *
 * Uses @huggingface/inference `featureExtraction` endpoint.
 *
 * @example
 * const strategy = new HFInferenceEmbeddingStrategy(apiKey, "sentence-transformers/all-MiniLM-L6-v2");
 */
export class HFInferenceEmbeddingStrategy implements EmbeddingStrategy {
  readonly strategyId: string;
  readonly version = 1;

  constructor(
    private readonly apiKey: string,
    private readonly modelId: string = "sentence-transformers/all-MiniLM-L6-v2",
  ) {
    this.strategyId = `hf-inference-${modelId}`;
  }

  async embed(content: string): Promise<EmbeddingResult> {
    const { HfInference } = await import("@huggingface/inference");
    const hf = new HfInference(this.apiKey);

    const output = await hf.featureExtraction({
      model: this.modelId,
      inputs: content,
    });

    const vector = output as unknown as number[];

    return {
      vector,
      model: this.modelId,
      dimensions: vector.length,
    };
  }

  async embedBatch(contents: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    for (const content of contents) {
      results.push(await this.embed(content));
    }
    return results;
  }
}
