import { KnowledgeLineage } from "../../../domain/KnowledgeLineage.js";
import { LineageId } from "../../../domain/LineageId.js";
import { Transformation, type TransformationType } from "../../../domain/Transformation.js";
import { Trace } from "../../../domain/Trace.js";

export interface LineageDTO {
  id: string;
  semanticUnitId: string;
  transformations: Array<{
    type: string;
    appliedAt: string;
    strategyUsed: string;
    inputVersion: number;
    outputVersion: number;
    parameters: Record<string, unknown>;
  }>;
  traces: Array<{
    fromUnitId: string;
    toUnitId: string;
    relationship: string;
    createdAt: string;
  }>;
}

export function toDTO(lineage: KnowledgeLineage): LineageDTO {
  return {
    id: lineage.id.value,
    semanticUnitId: lineage.semanticUnitId,
    transformations: [...lineage.transformations].map((t) => ({
      type: t.type,
      appliedAt: t.appliedAt.toISOString(),
      strategyUsed: t.strategyUsed,
      inputVersion: t.inputVersion,
      outputVersion: t.outputVersion,
      parameters: { ...t.parameters },
    })),
    traces: [...lineage.traces].map((t) => ({
      fromUnitId: t.fromUnitId,
      toUnitId: t.toUnitId,
      relationship: t.relationship,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

export function fromDTO(dto: LineageDTO): KnowledgeLineage {
  const transformations = dto.transformations.map((t) =>
    Transformation.create(
      t.type as TransformationType,
      t.strategyUsed,
      t.inputVersion,
      t.outputVersion,
      t.parameters,
    ),
  );

  const traces = dto.traces.map((t) =>
    Trace.reconstitute(t.fromUnitId, t.toUnitId, t.relationship, new Date(t.createdAt)),
  );

  return KnowledgeLineage.reconstitute(
    LineageId.create(dto.id),
    dto.semanticUnitId,
    transformations,
    traces,
  );
}
