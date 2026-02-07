import { Meaning } from "../domain/Meaning.js";
import { SemanticUnitId } from "../domain/SemanticUnitId.js";
export class VersionSemanticUnit {
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
        const meaning = Meaning.create(command.content, command.language, command.topics ?? [], command.summary ?? null);
        unit.addVersion(meaning, command.reason);
        await this.repository.save(unit);
        await this.eventPublisher.publishAll(unit.clearEvents());
    }
}
//# sourceMappingURL=VersionSemanticUnit.js.map