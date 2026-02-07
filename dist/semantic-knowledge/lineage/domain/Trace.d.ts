import { ValueObject } from "../../../shared/domain/index.js";
interface TraceProps {
    fromUnitId: string;
    toUnitId: string;
    relationship: string;
    createdAt: Date;
}
export declare class Trace extends ValueObject<TraceProps> {
    get fromUnitId(): string;
    get toUnitId(): string;
    get relationship(): string;
    get createdAt(): Date;
    static create(fromUnitId: string, toUnitId: string, relationship: string): Trace;
}
export {};
//# sourceMappingURL=Trace.d.ts.map