import { ProcessingLayer, type LayerDTO } from "./ProcessingLayer";

const VALID_STRATEGY_IDS = ["none", "basic"] as const;
type PreparationStrategyId = (typeof VALID_STRATEGY_IDS)[number];

interface BasicPreparationConfig {
  normalizeWhitespace: boolean;
  normalizeEncoding: boolean;
  trimContent: boolean;
}

type PreparationConfig = BasicPreparationConfig | Record<string, never>;

const BASIC_DEFAULTS: BasicPreparationConfig = {
  normalizeWhitespace: true,
  normalizeEncoding: true,
  trimContent: true,
};

export class PreparationLayer extends ProcessingLayer<PreparationStrategyId, PreparationConfig> {
  private constructor(strategyId: PreparationStrategyId, config: Readonly<PreparationConfig>) {
    super(strategyId, config);
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

  static fromDTO(dto: LayerDTO): PreparationLayer {
    return PreparationLayer.create(dto.strategyId, dto.config);
  }
}
