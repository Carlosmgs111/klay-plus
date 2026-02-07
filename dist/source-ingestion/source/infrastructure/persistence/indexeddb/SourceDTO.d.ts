import { Source } from "../../../domain/Source.js";
export interface SourceVersionDTO {
    version: number;
    contentHash: string;
    extractedAt: string;
}
export interface SourceDTO {
    id: string;
    name: string;
    type: string;
    uri: string;
    currentVersionIndex: number | null;
    versions: SourceVersionDTO[];
    registeredAt: string;
}
export declare function toDTO(source: Source): SourceDTO;
export declare function fromDTO(dto: SourceDTO): Source;
//# sourceMappingURL=SourceDTO.d.ts.map