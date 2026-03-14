import type { ProcessingProfile } from "../../processing-profile/domain/ProcessingProfile";
import type { PreparationLayer } from "../../processing-profile/domain/value-objects/PreparationLayer";
import type { FragmentationLayer, FragmentationConfig } from "../../processing-profile/domain/value-objects/FragmentationLayer";
import type { PreparationStrategy } from "../domain/ports/PreparationStrategy";
import type { EmbeddingStrategy } from "../domain/ports/EmbeddingStrategy";
import type { ChunkingStrategy } from "../domain/ports/ChunkingStrategy";
import type { EmbeddingStrategyResolver } from "./EmbeddingStrategyResolver";

import { NoOpPreparationStrategy } from "../infrastructure/strategies/preparation/NoOpPreparationStrategy";
import { BasicPreparationStrategy } from "../infrastructure/strategies/preparation/BasicPreparationStrategy";
import { RecursiveChunker } from "../infrastructure/strategies/chunking/RecursiveChunker";
import { SentenceChunker } from "../infrastructure/strategies/chunking/SentenceChunker";
import { FixedSizeChunker } from "../infrastructure/strategies/chunking/FixedSizeChunker";

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
 * Coordinates the 3 layers:
 * - Preparation: resolved inline (simple mapping)
 * - Fragmentation (chunking): resolved inline (simple mapping)
 * - Projection (embedding): delegated to EmbeddingStrategyResolver
 */
export class ProcessingProfileMaterializer {
  constructor(
    private readonly embeddingResolver: EmbeddingStrategyResolver,
  ) {}

  /**
   * Materializes a ProcessingProfile into concrete strategies for all 3 layers:
   * Preparation, Fragmentation (chunking), and Projection (embedding).
   */
  async materialize(profile: ProcessingProfile): Promise<MaterializedStrategies> {
    const preparationStrategy = this.resolvePreparationStrategy(profile.preparation);
    const embeddingStrategy = await this.embeddingResolver.resolve(profile.projection);
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
