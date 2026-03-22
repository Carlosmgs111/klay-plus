import type { ProjectionLayer } from "../../processing-profile/domain/value-objects/ProjectionLayer";
import type { EmbeddingStrategy } from "../domain/ports/EmbeddingStrategy";

/**
 * Policy subset needed by EmbeddingStrategyResolver.
 * Kept narrow so the resolver only sees what it needs.
 */
export interface EmbeddingResolutionPolicy {
  provider: string;
  embeddingDimensions?: number;
  webLLMModelId?: string;
  configOverrides?: Record<string, string>;
  configStore?: import("../../../../platform/config/ConfigStore").ConfigStore;
}

/**
 * EmbeddingStrategyResolver
 *
 * Resolves a ProjectionLayer's declarative strategyId into a concrete
 * EmbeddingStrategy instance. Encapsulates:
 * - Provider detection (prefix matching on strategyId)
 * - Dynamic SDK imports (@ai-sdk/openai, @ai-sdk/cohere, @huggingface/transformers, @huggingface/inference, web-llm)
 * - API key resolution via ConfigProvider
 * - Model instantiation for each vendor
 *
 * Extracted from ProcessingProfileMaterializer to give it a single
 * responsibility: embedding strategy resolution.
 */
export class EmbeddingStrategyResolver {
  constructor(
    private readonly policy: EmbeddingResolutionPolicy,
  ) {}

  /**
   * Resolves a ProjectionLayer into a concrete EmbeddingStrategy.
   */
  async resolve(layer: ProjectionLayer): Promise<EmbeddingStrategy> {
    const embeddingId = layer.strategyId;

    // AI SDK providers (OpenAI, Cohere)
    if (this.isAIProvider(embeddingId)) {
      return this.resolveAIEmbeddingStrategy(embeddingId);
    }

    // HuggingFace Inference API (remote — browser + server)
    if (embeddingId.startsWith("hf-inference-")) {
      const { HFInferenceEmbeddingStrategy } = await import(
        "../infrastructure/strategies/embedding/HFInferenceEmbeddingStrategy"
      );
      const { resolveConfigProvider } = await import(
        "../../../../platform/config/ConfigProvider"
      );
      const configProvider = await resolveConfigProvider(this.policy);
      const apiKey = configProvider.require("HUGGINGFACE_API_KEY");
      const modelId = embeddingId.replace("hf-inference-", "") || "sentence-transformers/all-MiniLM-L6-v2";
      return new HFInferenceEmbeddingStrategy(apiKey, modelId);
    }

    // HuggingFace Transformers (local ONNX — browser + server)
    if (embeddingId.startsWith("huggingface-")) {
      const { TransformersJSEmbeddingStrategy } = await import(
        "../infrastructure/strategies/embedding/TransformersJSEmbeddingStrategy"
      );
      const modelId = embeddingId.replace("huggingface-", "") || "Xenova/all-MiniLM-L6-v2";
      const strategy = new TransformersJSEmbeddingStrategy(modelId);
      try {
        await strategy.initialize();
      } catch (err) {
        throw new Error(
          `Failed to initialize local embedding model '${modelId}': ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return strategy;
    }

    // WebLLM (browser-side)
    if (embeddingId === "webllm") {
      const { WebLLMEmbeddingStrategy } = await import(
        "../infrastructure/strategies/embedding/WebLLMEmbeddingStrategy"
      );
      const modelId = this.policy.webLLMModelId;
      const strategy = new WebLLMEmbeddingStrategy(modelId);
      await strategy.initialize();
      return strategy;
    }

    // Default: hash embedding (testing / offline)
    const { HashEmbeddingStrategy } = await import(
      "../infrastructure/strategies/embedding/HashEmbeddingStrategy"
    );
    const dimensions = layer.config.dimensions
      ?? this.policy.embeddingDimensions
      ?? 128;
    return new HashEmbeddingStrategy(dimensions);
  }

  // ── Private ───────────────────────────────────────────────────────

  private isAIProvider(id: string): boolean {
    return id.startsWith("openai-") || id.startsWith("cohere-");
  }

  private async resolveAIEmbeddingStrategy(
    embeddingId: string,
  ): Promise<EmbeddingStrategy> {
    const { AISdkEmbeddingStrategy } = await import(
      "../infrastructure/strategies/embedding/AISdkEmbeddingStrategy"
    );

    const { resolveConfigProvider } = await import(
      "../../../../platform/config/ConfigProvider"
    );
    const configProvider = await resolveConfigProvider(this.policy);

    if (embeddingId.startsWith("openai-")) {
      const modelId = embeddingId.replace("openai-", "") || "text-embedding-3-small";
      const apiKey = configProvider.require("OPENAI_API_KEY");
      const { createOpenAI } = await import("@ai-sdk/openai");
      const openai = createOpenAI({ apiKey });
      return new AISdkEmbeddingStrategy(openai.embedding(modelId), `openai-${modelId}`);
    }

    if (embeddingId.startsWith("cohere-")) {
      const modelId = embeddingId.replace("cohere-", "") || "embed-multilingual-v3.0";
      const apiKey = configProvider.require("COHERE_API_KEY");
      const { createCohere } = await import(/* @vite-ignore */ "@ai-sdk/cohere");
      const cohere = createCohere({ apiKey });
      return new AISdkEmbeddingStrategy(cohere.textEmbeddingModel(modelId), `cohere-${modelId}`);
    }

    throw new Error(`Unknown AI embedding provider in strategyId: ${embeddingId}`);
  }
}
