import { SourceId } from "../domain/SourceId.js";
/**
 * Records that content was extracted for a source.
 * Called by the orchestrator after extraction completes.
 */
export class UpdateSource {
    repository;
    eventPublisher;
    constructor(repository, eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }
    async execute(command) {
        const sourceId = SourceId.create(command.sourceId);
        const source = await this.repository.findById(sourceId);
        if (!source) {
            throw new Error(`Source ${command.sourceId} not found`);
        }
        const changed = source.recordExtraction(command.contentHash);
        if (changed) {
            await this.repository.save(source);
            await this.eventPublisher.publishAll(source.clearEvents());
        }
        return changed;
    }
}
//# sourceMappingURL=UpdateSource.js.map