import { ValueObject } from "../../../shared/domain/index.js";
import type { ProjectionType } from "./ProjectionType.js";
interface ProjectionResultProps {
    type: ProjectionType;
    data: unknown;
    strategyId: string;
    strategyVersion: number;
    generatedAt: Date;
}
export declare class ProjectionResult extends ValueObject<ProjectionResultProps> {
    get type(): ProjectionType;
    get data(): unknown;
    get strategyId(): string;
    get strategyVersion(): number;
    get generatedAt(): Date;
    static create(type: ProjectionType, data: unknown, strategyId: string, strategyVersion: number): ProjectionResult;
}
export {};
//# sourceMappingURL=ProjectionResult.d.ts.map