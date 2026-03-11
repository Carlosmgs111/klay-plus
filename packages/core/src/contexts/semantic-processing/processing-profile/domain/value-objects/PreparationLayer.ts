const VALID_STRATEGY_IDS = ["none", "basic"] as const;
type PreparationStrategyId = (typeof VALID_STRATEGY_IDS)[number];

interface BasicPreparationConfig {
  normalizeWhitespace: boolean;
  normalizeEncoding: boolean;
  trimContent: boolean;
}

type PreparationConfig = BasicPreparationConfig | Record<string, never>;

interface PreparationLayerDTO {
  strategyId: string;
  config: Record<string, unknown>;
}

const BASIC_DEFAULTS: BasicPreparationConfig = {
  normalizeWhitespace: true,
  normalizeEncoding: true,
  trimContent: true,
};

export class PreparationLayer {
  private constructor(
    private readonly _strategyId: PreparationStrategyId,
    private readonly _config: Readonly<PreparationConfig>,
  ) {}

  get strategyId(): PreparationStrategyId {
    return this._strategyId;
  }

  get config(): Readonly<PreparationConfig> {
    return this._config;
  }

  static create(strategyId: string, config: Record<string, unknown>): PreparationLayer {
    if (!VALID_STRATEGY_IDS.includes(strategyId as PreparationStrategyId)) {
      throw new Error(`Unknown preparation strategy: ${strategyId}`);
    }

    const resolvedConfig =
      strategyId === "none"
        ? Object.freeze({} as Record<string, never>)
        : Object.freeze({
            normalizeWhitespace: (config.normalizeWhitespace as boolean) ?? BASIC_DEFAULTS.normalizeWhitespace,
            normalizeEncoding: (config.normalizeEncoding as boolean) ?? BASIC_DEFAULTS.normalizeEncoding,
            trimContent: (config.trimContent as boolean) ?? BASIC_DEFAULTS.trimContent,
          });

    return new PreparationLayer(strategyId as PreparationStrategyId, resolvedConfig);
  }

  static fromDTO(dto: PreparationLayerDTO): PreparationLayer {
    return PreparationLayer.create(dto.strategyId, dto.config);
  }

  toDTO(): PreparationLayerDTO {
    return {
      strategyId: this._strategyId,
      config: { ...this._config },
    };
  }
}
