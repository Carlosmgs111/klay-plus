import { ValueObject } from "../../../shared/domain/index.js";
export declare const TransformationType: {
    readonly Extraction: "EXTRACTION";
    readonly Chunking: "CHUNKING";
    readonly Enrichment: "ENRICHMENT";
    readonly Embedding: "EMBEDDING";
    readonly Merge: "MERGE";
    readonly Split: "SPLIT";
};
export type TransformationType = (typeof TransformationType)[keyof typeof TransformationType];
interface TransformationProps {
    type: TransformationType;
    appliedAt: Date;
    strategyUsed: string;
    inputVersion: number;
    outputVersion: number;
    parameters: Readonly<Record<string, unknown>>;
}
export declare class Transformation extends ValueObject<TransformationProps> {
    get type(): TransformationType;
    get appliedAt(): Date;
    get strategyUsed(): string;
    get inputVersion(): number;
    get outputVersion(): number;
    get parameters(): Readonly<Record<string, unknown>>;
    static create(type: TransformationType, strategyUsed: string, inputVersion: number, outputVersion: number, parameters?: Record<string, unknown>): Transformation;
}
export {};
//# sourceMappingURL=Transformation.d.ts.map