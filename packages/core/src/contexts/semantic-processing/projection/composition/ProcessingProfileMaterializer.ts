import type { ProcessingProfile } from "../../processing-profile/domain/ProcessingProfile";
import type { EmbeddingStrategy } from "../domain/ports/EmbeddingStrategy";
import type { ChunkingStrategy } from "../domain/ports/ChunkingStrategy";
import type { ProjectionInfrastructurePolicy } from "./factory";

/**
 * Materialized strategies resolved from a ProcessingProfile.
 */
export interface MaterializedStrategies {
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
   * Materializes a ProcessingProfile into concrete EmbeddingStrategy + ChunkingStrategy.
   */
  async materialize(profile: ProcessingProfile): Promise<MaterializedStrategies> {
    const [embeddingStrategy, chunkingStrategy] = await Promise.all([
      this.resolveEmbeddingStrategy(profile),
      this.resolveChunkingStrategy(profile),
    ]);

    return { embeddingStrategy, chunkingStrategy };
  }

  private async resolveEmbeddingStrategy(
    profile: ProcessingProfile,
  ): Promise<EmbeddingStrategy> {
    const embeddingId = profile.embeddingStrategyId;
    const config = profile.configuration;

    // Check if it's an AI SDK provider
    if (this.isAIProvider(embeddingId)) {
      return this.resolveAIEmbeddingStrategy(embeddingId, config);
    }

    // WebLLM
    if (embeddingId === "web-llm-embedding") {
      const { WebLLMEmbeddingStrategy } = await import(
        "../infrastructure/strategies/WebLLMEmbeddingStrategy"
      );
      const modelId = (config.webLLMModelId as string) ?? this.policy.webLLMModelId;
      const strategy = new WebLLMEmbeddingStrategy(modelId);
      await strategy.initialize();
      return strategy;
    }

    // Default: hash embedding
    const { HashEmbeddingStrategy } = await import(
      "../infrastructure/strategies/HashEmbeddingStrategy"
    );
    const dimensions = (config.embeddingDimensions as number)
      ?? this.policy.embeddingDimensions
      ?? 128;
    return new HashEmbeddingStrategy(dimensions);
  }

  private isAIProvider(id: string): boolean {
    return id.startsWith("openai-") || id.startsWith("cohere-") || id.startsWith("huggingface-");
  }

  private async resolveAIEmbeddingStrategy(
    embeddingId: string,
    config: Readonly<Record<string, unknown>>,
  ): Promise<EmbeddingStrategy> {
    const { AISdkEmbeddingStrategy } = await import(
      "../infrastructure/strategies/AISdkEmbeddingStrategy"
    );

    // Resolve config provider for API keys
    let configProvider;
    if (this.policy.configOverrides) {
      const { InMemoryConfigProvider } = await import(
        "../../../../platform/config/InMemoryConfigProvider"
      );
      configProvider = new InMemoryConfigProvider(this.policy.configOverrides);
    } else {
      const { NodeConfigProvider } = await import(
        "../../../../platform/config/NodeConfigProvider"
      );
      configProvider = new NodeConfigProvider();
    }

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
      const { createCohere } = await import("@ai-sdk/cohere");
      const cohere = createCohere({ apiKey });
      return new AISdkEmbeddingStrategy(cohere.textEmbeddingModel(modelId), `cohere-${modelId}`);
    }

    if (embeddingId.startsWith("huggingface-")) {
      const modelId = embeddingId.replace("huggingface-", "") || "sentence-transformers/all-MiniLM-L6-v2";
      const apiKey = configProvider.require("HUGGINGFACE_API_KEY");
      const { createHuggingFace } = await import("@ai-sdk/huggingface");
      const hf = createHuggingFace({ apiKey });
      return new AISdkEmbeddingStrategy(hf.textEmbeddingModel(modelId), `huggingface-${modelId}`);
    }

    throw new Error(`Unknown AI embedding provider in strategyId: ${embeddingId}`);
  }

  private async resolveChunkingStrategy(
    profile: ProcessingProfile,
  ): Promise<ChunkingStrategy> {
    // Register default chunking strategies (side-effect import)
    await import("../infrastructure/strategies");
    const { ChunkerFactory } = await import(
      "../infrastructure/strategies/ChunkerFactory"
    );
    return ChunkerFactory.create(profile.chunkingStrategyId);
  }
}
