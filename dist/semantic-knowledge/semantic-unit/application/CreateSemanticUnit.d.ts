import type { EventPublisher } from "../../../shared/domain/index.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
export interface CreateSemanticUnitCommand {
    id: string;
    sourceId: string;
    sourceType: string;
    extractedAt: Date;
    content: string;
    language: string;
    topics?: string[];
    summary?: string;
    createdBy: string;
    tags?: string[];
    attributes?: Record<string, string>;
}
export declare class CreateSemanticUnit {
    private readonly repository;
    private readonly eventPublisher;
    constructor(repository: SemanticUnitRepository, eventPublisher: EventPublisher);
    execute(command: CreateSemanticUnitCommand): Promise<void>;
}
//# sourceMappingURL=CreateSemanticUnit.d.ts.map