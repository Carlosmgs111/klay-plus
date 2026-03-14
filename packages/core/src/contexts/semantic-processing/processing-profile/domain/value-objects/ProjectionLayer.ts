import { ProcessingLayer, type LayerDTO } from "./ProcessingLayer";

export interface ProjectionConfig {
  dimensions: number;
  batchSize: number;
}

const PROJECTION_DEFAULTS: ProjectionConfig = {
  dimensions: 128,
  batchSize: 100,
};

export class ProjectionLayer extends ProcessingLayer<string, ProjectionConfig> {
  private constructor(strategyId: string, config: Readonly<ProjectionConfig>) {
    super(strategyId, config);
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

  static fromDTO(dto: LayerDTO): ProjectionLayer {
    return ProjectionLayer.create(dto.strategyId, dto.config);
  }
}
