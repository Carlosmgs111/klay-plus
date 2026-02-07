import { ValueObject } from "../../../shared/domain/index.js";
interface UnitMetadataProps {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: ReadonlyArray<string>;
    attributes: Readonly<Record<string, string>>;
}
export declare class UnitMetadata extends ValueObject<UnitMetadataProps> {
    get createdAt(): Date;
    get updatedAt(): Date;
    get createdBy(): string;
    get tags(): ReadonlyArray<string>;
    get attributes(): Readonly<Record<string, string>>;
    static create(createdBy: string, tags?: string[], attributes?: Record<string, string>): UnitMetadata;
    withUpdatedTimestamp(): UnitMetadata;
}
export {};
//# sourceMappingURL=UnitMetadata.d.ts.map