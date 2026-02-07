import type { EventPublisher } from "../../../shared/domain/index.js";
import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
export interface DeprecateSemanticUnitCommand {
    unitId: string;
    reason: string;
}
export declare class DeprecateSemanticUnit {
    private readonly repository;
    private readonly eventPublisher;
    constructor(repository: SemanticUnitRepository, eventPublisher: EventPublisher);
    execute(command: DeprecateSemanticUnitCommand): Promise<void>;
}
//# sourceMappingURL=DeprecateSemanticUnit.d.ts.map