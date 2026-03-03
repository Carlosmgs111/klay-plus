import { KnowledgeLineage } from "../../../domain/KnowledgeLineage";
import { LineageId } from "../../../domain/LineageId";
import { Transformation, type TransformationType } from "../../../domain/Transformation";
import { Trace } from "../../../domain/Trace";

export interface LineageDTO {
  id: string;
  contextId: string;
  transformations: Array<{
    type: string;
    appliedAt: string;
    strategyUsed: string;
    inputVersion: number;
    outputVersion: number;
    parameters: Record<string, unknown>;
  }>;
  traces: Array<{
    fromContextId: string;
    toContextId: string;
    relationship: string;
    createdAt: string;
  }>;
}

export function toDTO(lineage: KnowledgeLineage): LineageDTO {
  return {
    id: lineage.id.value,
    contextId: lineage.contextId,
    transformations: [...lineage.transformations].map((t) => ({
      type: t.type,
      appliedAt: t.appliedAt.toISOString(),
      strategyUsed: t.strategyUsed,
      inputVersion: t.inputVersion,
      outputVersion: t.outputVersion,
      parameters: { ...t.parameters },
    })),
    traces: [...lineage.traces].map((t) => ({
      fromContextId: t.fromContextId,
      toContextId: t.toContextId,
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
    Trace.reconstitute(t.fromContextId, t.toContextId, t.relationship, new Date(t.createdAt)),
  );

  return KnowledgeLineage.reconstitute(
    LineageId.create(dto.id),
    dto.contextId,
    transformations,
    traces,
  );
}
