import { KnowledgeLineage } from "../../../domain/KnowledgeLineage";
import { LineageId } from "../../../domain/LineageId";
import { Trace } from "../../../domain/Trace";

export interface LineageDTO {
  id: string;
  contextId: string;
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
    traces: [...lineage.traces].map((t) => ({
      fromContextId: t.fromContextId,
      toContextId: t.toContextId,
      relationship: t.relationship,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

export function fromDTO(dto: LineageDTO): KnowledgeLineage {
  const traces = dto.traces.map((t) =>
    Trace.reconstitute(t.fromContextId, t.toContextId, t.relationship, new Date(t.createdAt)),
  );

  return KnowledgeLineage.reconstitute(
    LineageId.create(dto.id),
    dto.contextId,
    traces,
  );
}
