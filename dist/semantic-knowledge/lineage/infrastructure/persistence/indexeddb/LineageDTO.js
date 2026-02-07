import { KnowledgeLineage } from "../../../domain/KnowledgeLineage.js";
import { LineageId } from "../../../domain/LineageId.js";
import { Transformation } from "../../../domain/Transformation.js";
import { Trace } from "../../../domain/Trace.js";
export function toDTO(lineage) {
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
export function fromDTO(dto) {
    const transformations = dto.transformations.map((t) => Transformation.create(t.type, t.strategyUsed, t.inputVersion, t.outputVersion, t.parameters));
    const traces = dto.traces.map((t) => Trace.create(t.fromUnitId, t.toUnitId, t.relationship));
    return KnowledgeLineage.reconstitute(LineageId.create(dto.id), dto.semanticUnitId, transformations, traces);
}
//# sourceMappingURL=LineageDTO.js.map