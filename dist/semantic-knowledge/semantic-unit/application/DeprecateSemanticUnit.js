import { SemanticUnitId } from "../domain/SemanticUnitId.js";
export class DeprecateSemanticUnit {
    repository;
    eventPublisher;
    constructor(repository, eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }
    async execute(command) {
        const unitId = SemanticUnitId.create(command.unitId);
        const unit = await this.repository.findById(unitId);
        if (!unit) {
            throw new Error(`SemanticUnit ${command.unitId} not found`);
        }
        unit.deprecate(command.reason);
        await this.repository.save(unit);
        await this.eventPublisher.publishAll(unit.clearEvents());
    }
}
//# sourceMappingURL=DeprecateSemanticUnit.js.map