import { KnowledgeLineage } from "../../../domain/KnowledgeLineage.js";
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
export declare function toDTO(lineage: KnowledgeLineage): LineageDTO;
export declare function fromDTO(dto: LineageDTO): KnowledgeLineage;
//# sourceMappingURL=LineageDTO.d.ts.map