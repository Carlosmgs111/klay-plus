/**
 * ProcessingLayer<TStrategy, TConfig>
 *
 * Generic base for the three processing profile layers (Preparation,
 * Fragmentation, Projection). Encapsulates the common structure:
 *   strategyId + config + toDTO()
 *
 * Subclasses own `create()` / `fromDTO()` because each layer has
 * different validation, defaults, and config resolution logic.
 */

export interface LayerDTO {
  strategyId: string;
  config: Record<string, unknown>;
}

export abstract class ProcessingLayer<
  TStrategy extends string,
  TConfig extends Record<string, unknown>,
> {
  protected constructor(
    private readonly _strategyId: TStrategy,
    private readonly _config: Readonly<TConfig>,
  ) {}

  get strategyId(): TStrategy {
    return this._strategyId;
  }

  get config(): Readonly<TConfig> {
    return this._config;
  }

  toDTO(): LayerDTO {
    return {
      strategyId: this._strategyId,
      config: { ...this._config },
    };
  }
}
