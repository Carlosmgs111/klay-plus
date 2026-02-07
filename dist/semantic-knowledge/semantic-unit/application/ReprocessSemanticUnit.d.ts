import type { EventPublisher } from "../../../shared/domain/index.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
export interface ReprocessSemanticUnitCommand {
    unitId: string;
    reason: string;
}
export declare class ReprocessSemanticUnit {
    private readonly repository;
    private readonly eventPublisher;
    constructor(repository: SemanticUnitRepository, eventPublisher: EventPublisher);
    execute(command: ReprocessSemanticUnitCommand): Promise<void>;
}
//# sourceMappingURL=ReprocessSemanticUnit.d.ts.map