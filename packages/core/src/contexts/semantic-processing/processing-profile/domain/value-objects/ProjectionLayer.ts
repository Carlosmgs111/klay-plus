export interface ProjectionConfig {
  dimensions: number;
  batchSize: number;
}

interface ProjectionLayerDTO {
  strategyId: string;
  config: Record<string, unknown>;
}

const PROJECTION_DEFAULTS: ProjectionConfig = {
  dimensions: 128,
  batchSize: 100,
};

export class ProjectionLayer {
  private constructor(
    private readonly _strategyId: string,
    private readonly _config: Readonly<ProjectionConfig>,
  ) {}

  get strategyId(): string {
    return this._strategyId;
  }

  get config(): Readonly<ProjectionConfig> {
    return this._config;
  }

  static create(strategyId: string, input: Record<string, unknown>): ProjectionLayer {
    if (!strategyId || strategyId.trim().length === 0) {
      throw new Error("strategyId must be a non-empty string");
    }

    const resolvedConfig: ProjectionConfig = Object.freeze({
      dimensions: (input.dimensions as number) ?? PROJECTION_DEFAULTS.dimensions,
      batchSize: (input.batchSize as number) ?? PROJECTION_DEFAULTS.batchSize,
    });

    if (resolvedConfig.dimensions <= 0) {
      throw new Error(`dimensions must be > 0, got: ${resolvedConfig.dimensions}`);
    }
    if (resolvedConfig.batchSize <= 0) {
      throw new Error(`batchSize must be > 0, got: ${resolvedConfig.batchSize}`);
    }

    return new ProjectionLayer(strategyId, resolvedConfig);
  }

  static fromDTO(dto: ProjectionLayerDTO): ProjectionLayer {
    return ProjectionLayer.create(dto.strategyId, dto.config);
  }

  toDTO(): ProjectionLayerDTO {
    return {
      strategyId: this._strategyId,
      config: { ...this._config },
    };
  }
}
