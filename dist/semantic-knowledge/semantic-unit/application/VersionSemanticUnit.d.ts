import type { EventPublisher } from "../../../shared/domain/index.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
export interface VersionSemanticUnitCommand {
    unitId: string;
    content: string;
    language: string;
    topics?: string[];
    summary?: string;
    reason: string;
}
export declare class VersionSemanticUnit {
    private readonly repository;
    private readonly eventPublisher;
    constructor(repository: SemanticUnitRepository, eventPublisher: EventPublisher);
    execute(command: VersionSemanticUnitCommand): Promise<void>;
}
//# sourceMappingURL=VersionSemanticUnit.d.ts.map