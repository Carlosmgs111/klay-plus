const VALID_STRATEGY_IDS = ["recursive", "sentence", "fixed-size"] as const;
export type FragmentationStrategyId = (typeof VALID_STRATEGY_IDS)[number];

export interface RecursiveConfig {
  strategy: "recursive";
  chunkSize: number;
  overlap: number;
}

export interface SentenceConfig {
  strategy: "sentence";
  maxChunkSize: number;
  minChunkSize: number;
}

export interface FixedSizeConfig {
  strategy: "fixed-size";
  chunkSize: number;
  overlap: number;
}

export type FragmentationConfig = RecursiveConfig | SentenceConfig | FixedSizeConfig;

interface FragmentationLayerDTO {
  strategyId: string;
  config: Record<string, unknown>;
}

const RECURSIVE_DEFAULTS: Omit<RecursiveConfig, "strategy"> = {
  chunkSize: 1000,
  overlap: 100,
};

const SENTENCE_DEFAULTS: Omit<SentenceConfig, "strategy"> = {
  maxChunkSize: 1000,
  minChunkSize: 100,
};

const FIXED_SIZE_DEFAULTS: Omit<FixedSizeConfig, "strategy"> = {
  chunkSize: 500,
  overlap: 50,
};

export class FragmentationLayer {
  private constructor(
    private readonly _strategyId: FragmentationStrategyId,
    private readonly _config: Readonly<FragmentationConfig>,
  ) {}

  get strategyId(): FragmentationStrategyId {
    return this._strategyId;
  }

  get config(): Readonly<FragmentationConfig> {
    return this._config;
  }

  static create(strategyId: string, input: Record<string, unknown>): FragmentationLayer {
    if (!VALID_STRATEGY_IDS.includes(strategyId as FragmentationStrategyId)) {
      throw new Error(`Unknown fragmentation strategy: ${strategyId}`);
    }

    const sid = strategyId as FragmentationStrategyId;
    const resolvedConfig = FragmentationLayer._resolveConfig(sid, input);
    FragmentationLayer._validate(resolvedConfig);

    return new FragmentationLayer(sid, Object.freeze(resolvedConfig));
  }

  static fromDTO(dto: FragmentationLayerDTO): FragmentationLayer {
    return FragmentationLayer.create(dto.strategyId, dto.config);
  }

  toDTO(): FragmentationLayerDTO {
    return {
      strategyId: this._strategyId,
      config: { ...this._config },
    };
  }

  private static _resolveConfig(
    strategyId: FragmentationStrategyId,
    input: Record<string, unknown>,
  ): FragmentationConfig {
    switch (strategyId) {
      case "recursive":
        return {
          strategy: "recursive",
          chunkSize: (input.chunkSize as number) ?? RECURSIVE_DEFAULTS.chunkSize,
          overlap: (input.overlap as number) ?? RECURSIVE_DEFAULTS.overlap,
        };
      case "sentence":
        return {
          strategy: "sentence",
          maxChunkSize: (input.maxChunkSize as number) ?? SENTENCE_DEFAULTS.maxChunkSize,
          minChunkSize: (input.minChunkSize as number) ?? SENTENCE_DEFAULTS.minChunkSize,
        };
      case "fixed-size":
        return {
          strategy: "fixed-size",
          chunkSize: (input.chunkSize as number) ?? FIXED_SIZE_DEFAULTS.chunkSize,
          overlap: (input.overlap as number) ?? FIXED_SIZE_DEFAULTS.overlap,
        };
    }
  }

  private static _validate(config: FragmentationConfig): void {
    switch (config.strategy) {
      case "recursive":
      case "fixed-size":
        if (config.chunkSize <= 0) {
          throw new Error(`chunkSize must be > 0, got: ${config.chunkSize}`);
        }
        if (config.overlap < 0 || config.overlap >= config.chunkSize) {
          throw new Error(
            `overlap must be >= 0 and < chunkSize (${config.chunkSize}), got: ${config.overlap}`,
          );
        }
        break;
      case "sentence":
        if (config.minChunkSize <= 0) {
          throw new Error(`minChunkSize must be > 0, got: ${config.minChunkSize}`);
        }
        if (config.minChunkSize >= config.maxChunkSize) {
          throw new Error(
            `minChunkSize (${config.minChunkSize}) must be < maxChunkSize (${config.maxChunkSize})`,
          );
        }
        break;
    }
  }
}
