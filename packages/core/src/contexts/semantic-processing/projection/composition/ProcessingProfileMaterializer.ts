import type { ProcessingProfile } from "../../processing-profile/domain/ProcessingProfile";
import type { PreparationLayer } from "../../processing-profile/domain/value-objects/PreparationLayer";
import type { FragmentationLayer, FragmentationConfig } from "../../processing-profile/domain/value-objects/FragmentationLayer";
import type { ProjectionLayer } from "../../processing-profile/domain/value-objects/ProjectionLayer";
import type { PreparationStrategy } from "../domain/ports/PreparationStrategy";
import type { EmbeddingStrategy } from "../domain/ports/EmbeddingStrategy";
import type { ChunkingStrategy } from "../domain/ports/ChunkingStrategy";
import type { ProjectionInfrastructurePolicy } from "./factory";

import { NoOpPreparationStrategy } from "../infrastructure/strategies/NoOpPreparationStrategy";
import { BasicPreparationStrategy } from "../infrastructure/strategies/BasicPreparationStrategy";
import { RecursiveChunker } from "../infrastructure/strategies/RecursiveChunker";
import { SentenceChunker } from "../infrastructure/strategies/SentenceChunker";
import { FixedSizeChunker } from "../infrastructure/strategies/FixedSizeChunker";

/**
 * Materialized strategies resolved from a ProcessingProfile.
 */
export interface MaterializedStrategies {
  preparationStrategy: PreparationStrategy;
  embeddingStrategy: EmbeddingStrategy;
  chunkingStrategy: ChunkingStrategy;
}

/**
 * ProcessingProfileMaterializer
 *
 * Translates a declarative ProcessingProfile (domain) into concrete
 * strategy implementations (infrastructure).
 *
 * This lives in composition/ because:
 * - It instantiates concrete infrastructure classes
 * - It knows about specific embedding providers and chunker implementations
 * - The domain only declares intent (strategyId strings)
 * - This component resolves that intent into runnable code
 *
 * The policy is needed for infrastructure-specific configuration
 * (API keys, dimensions, etc.) that cannot live in the domain profile.
 */
export class ProcessingProfileMaterializer {
  constructor(
    private readonly policy: ProjectionInfrastructurePolicy,
  ) {}

  /**
   * Materializes a ProcessingProfile into concrete strategies for all 3 layers:
   * Preparation, Fragmentation (chunking), and Projection (embedding).
   */
  async materialize(profile: ProcessingProfile): Promise<MaterializedStrategies> {
    const preparationStrategy = this.resolvePreparationStrategy(profile.preparation);
    const embeddingStrategy = await this.resolveEmbeddingStrategy(profile.projection);
    const chunkingStrategy = this.resolveChunkingStrategy(profile.fragmentation);
    return { preparationStrategy, embeddingStrategy, chunkingStrategy };
  }

  private resolvePreparationStrategy(layer: PreparationLayer): PreparationStrategy {
    if (layer.strategyId === "none") {
      return new NoOpPreparationStrategy();
    }
    return new BasicPreparationStrategy(
      layer.config as { normalizeWhitespace: boolean; normalizeEncoding: boolean; trimContent: boolean },
    );
  }

  private async resolveEmbeddingStrategy(
    layer: ProjectionLayer,
  ): Promise<EmbeddingStrategy> {
    const embeddingId = layer.strategyId;

    // Check if it's an AI SDK provider
    if (this.isAIProvider(embeddingId)) {
      return this.resolveAIEmbeddingStrategy(embeddingId);
    }

    // WebLLM
    if (embeddingId === "web-llm-embedding") {
      const { WebLLMEmbeddingStrategy } = await import(
        "../infrastructure/strategies/WebLLMEmbeddingStrategy"
      );
      const modelId = this.policy.webLLMModelId;
      const strategy = new WebLLMEmbeddingStrategy(modelId);
      await strategy.initialize();
      return strategy;
    }

    // Default: hash embedding
    const { HashEmbeddingStrategy } = await import(
      "../infrastructure/strategies/HashEmbeddingStrategy"
    );
    const dimensions = layer.config.dimensions
      ?? this.policy.embeddingDimensions
      ?? 128;
    return new HashEmbeddingStrategy(dimensions);
  }

  private isAIProvider(id: string): boolean {
    return id.startsWith("openai-") || id.startsWith("cohere-") || id.startsWith("huggingface-");
  }

  private async resolveAIEmbeddingStrategy(
    embeddingId: string,
  ): Promise<EmbeddingStrategy> {
    const { AISdkEmbeddingStrategy } = await import(
      "../infrastructure/strategies/AISdkEmbeddingStrategy"
    );

    const { resolveConfigProvider } = await import(
      "../../../../platform/config/resolveConfigProvider"
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

  private resolveChunkingStrategy(layer: FragmentationLayer): ChunkingStrategy {
    const config: FragmentationConfig = layer.config;
    switch (config.strategy) {
      case "recursive":
        return new RecursiveChunker(config.chunkSize, config.overlap);
      case "sentence":
        return new SentenceChunker(config.maxChunkSize, config.minChunkSize);
      case "fixed-size":
        return new FixedSizeChunker(config.chunkSize, config.overlap);
      default:
        throw new Error(`Unknown fragmentation strategy: ${(config as any).strategy}`);
    }
  }
}
