import { SemanticUnit } from "../../../domain/SemanticUnit.js";
export interface SemanticUnitDTO {
    id: string;
    state: string;
    origin: {
        sourceId: string;
        extractedAt: string;
        sourceType: string;
    };
    currentVersionIndex: number;
    versions: Array<{
        version: number;
        meaning: {
            content: string;
            summary: string | null;
            language: string;
            topics: string[];
        };
        createdAt: string;
        reason: string;
    }>;
    metadata: {
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        tags: string[];
        attributes: Record<string, string>;
    };
}
export declare function toDTO(unit: SemanticUnit): SemanticUnitDTO;
export declare function fromDTO(dto: SemanticUnitDTO): SemanticUnit;
//# sourceMappingURL=SemanticUnitDTO.d.ts.map