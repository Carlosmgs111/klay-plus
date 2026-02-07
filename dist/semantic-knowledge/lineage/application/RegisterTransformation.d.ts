import type { EventPublisher } from "../../../shared/domain/index.js";
import { type TransformationType } from "../domain/Transformation.js";
import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";
export interface RegisterTransformationCommand {
    semanticUnitId: string;
    transformationType: TransformationType;
    strategyUsed: string;
    inputVersion: number;
    outputVersion: number;
    parameters?: Record<string, unknown>;
}
export declare class RegisterTransformation {
    private readonly repository;
    private readonly eventPublisher;
    constructor(repository: KnowledgeLineageRepository, eventPublisher: EventPublisher);
    execute(command: RegisterTransformationCommand): Promise<void>;
}
//# sourceMappingURL=RegisterTransformation.d.ts.map