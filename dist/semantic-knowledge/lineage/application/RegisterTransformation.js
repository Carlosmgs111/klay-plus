import { LineageId } from "../domain/LineageId.js";
import { KnowledgeLineage } from "../domain/KnowledgeLineage.js";
import { Transformation } from "../domain/Transformation.js";
export class RegisterTransformation {
    repository;
    eventPublisher;
    constructor(repository, eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }
    async execute(command) {
        let lineage = await this.repository.findBySemanticUnitId(command.semanticUnitId);
        if (!lineage) {
            const lineageId = LineageId.create(crypto.randomUUID());
            lineage = KnowledgeLineage.create(lineageId, command.semanticUnitId);
        }
        const transformation = Transformation.create(command.transformationType, command.strategyUsed, command.inputVersion, command.outputVersion, command.parameters ?? {});
        lineage.registerTransformation(transformation);
        await this.repository.save(lineage);
        await this.eventPublisher.publishAll(lineage.clearEvents());
    }
}
//# sourceMappingURL=RegisterTransformation.js.map