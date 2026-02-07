import { AggregateRoot } from "../../../shared/domain/index.js";
import { ProjectionId } from "./ProjectionId.js";
import { ProjectionStatus } from "./ProjectionStatus.js";
import type { ProjectionType } from "./ProjectionType.js";
import { ProjectionResult } from "./ProjectionResult.js";
export declare class SemanticProjection extends AggregateRoot<ProjectionId> {
    private _semanticUnitId;
    private _semanticUnitVersion;
    private _type;
    private _status;
    private _result;
    private _error;
    private _createdAt;
    private constructor();
    get semanticUnitId(): string;
    get semanticUnitVersion(): number;
    get type(): ProjectionType;
    get status(): ProjectionStatus;
    get result(): ProjectionResult | null;
    get error(): string | null;
    get createdAt(): Date;
    static create(id: ProjectionId, semanticUnitId: string, semanticUnitVersion: number, type: ProjectionType): SemanticProjection;
    static reconstitute(id: ProjectionId, semanticUnitId: string, semanticUnitVersion: number, type: ProjectionType, status: ProjectionStatus, result: ProjectionResult | null, error: string | null, createdAt: Date): SemanticProjection;
    markProcessing(): void;
    complete(result: ProjectionResult): void;
    fail(error: string): void;
}
//# sourceMappingURL=SemanticProjection.d.ts.map