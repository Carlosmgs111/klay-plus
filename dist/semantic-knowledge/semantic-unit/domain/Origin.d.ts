import { ValueObject } from "../../../shared/domain/index.js";
interface OriginProps {
    sourceId: string;
    extractedAt: Date;
    sourceType: string;
}
export declare class Origin extends ValueObject<OriginProps> {
    get sourceId(): string;
    get extractedAt(): Date;
    get sourceType(): string;
    static create(sourceId: string, extractedAt: Date, sourceType: string): Origin;
}
export {};
//# sourceMappingURL=Origin.d.ts.map