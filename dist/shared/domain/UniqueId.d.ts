import { ValueObject } from "./ValueObject.js";
interface UniqueIdProps {
    value: string;
}
export declare class UniqueId extends ValueObject<UniqueIdProps> {
    get value(): string;
    static create(value: string): UniqueId;
    toString(): string;
}
export {};
//# sourceMappingURL=UniqueId.d.ts.map