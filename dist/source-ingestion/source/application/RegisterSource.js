import { Source } from "../domain/Source.js";
import { SourceId } from "../domain/SourceId.js";
/**
 * Registers a new source reference.
 * Does NOT extract content - that's done by the extraction module.
 */
export class RegisterSource {
    repository;
    eventPublisher;
    constructor(repository, eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }
    async execute(command) {
        const sourceId = SourceId.create(command.id);
        const exists = await this.repository.exists(sourceId);
        if (exists) {
            throw new Error(`Source ${command.id} already exists`);
        }
        const source = Source.register(sourceId, command.name, command.type, command.uri);
        await this.repository.save(source);
        await this.eventPublisher.publishAll(source.clearEvents());
    }
}
//# sourceMappingURL=RegisterSource.js.map