import type { DomainError } from "../../../../../shared/domain/errors";
import type { ProjectionType } from "../../domain/ProjectionType";
import { Result } from "../../../../../shared/domain/Result";
import type { GenerateProjection } from "./GenerateProjection";

export interface ProcessContentInput {
  projectionId: string;
  sourceId: string;
  content: string;
  type: ProjectionType;
  processingProfileId: string;
}

export interface ProcessContentSuccess {
  projectionId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
  processingProfileVersion: number;
}

export class ProcessContent {
  constructor(
    private readonly _generateProjection: GenerateProjection,
  ) {}

  async execute(
    params: ProcessContentInput,
  ): Promise<Result<DomainError, ProcessContentSuccess>> {
    const result = await this._generateProjection.execute({
      projectionId: params.projectionId,
      sourceId: params.sourceId,
      content: params.content,
      type: params.type,
      processingProfileId: params.processingProfileId,
    });

    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok({
      projectionId: result.value.projectionId,
      chunksCount: result.value.chunksCount,
      dimensions: result.value.dimensions,
      model: result.value.model,
      processingProfileVersion: result.value.processingProfileVersion,
    });
  }
}
