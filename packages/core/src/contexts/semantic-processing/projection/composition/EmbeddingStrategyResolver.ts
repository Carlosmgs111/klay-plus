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
 * - Dynamic SDK imports (@ai-sdk/openai, @ai-sdk/cohere, @ai-sdk/huggingface, web-llm)
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

    // AI SDK providers (OpenAI, Cohere, HuggingFace)
    if (this.isAIProvider(embeddingId)) {
      return this.resolveAIEmbeddingStrategy(embeddingId);
    }

    // WebLLM (browser-side)
    if (embeddingId === "web-llm-embedding") {
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
    return id.startsWith("openai-") || id.startsWith("cohere-") || id.startsWith("huggingface-");
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

    if (embeddingId.startsWith("huggingface-")) {
      const modelId = embeddingId.replace("huggingface-", "") || "sentence-transformers/all-MiniLM-L6-v2";
      const apiKey = configProvider.require("HUGGINGFACE_API_KEY");
      const { createHuggingFace } = await import(/* @vite-ignore */ "@ai-sdk/huggingface");
      const hf = createHuggingFace({ apiKey });
      return new AISdkEmbeddingStrategy(hf.textEmbeddingModel(modelId), `huggingface-${modelId}`);
    }

    throw new Error(`Unknown AI embedding provider in strategyId: ${embeddingId}`);
  }
}
