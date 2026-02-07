import type { EventPublisher } from "../../../shared/domain/index.js";
import type { SourceType } from "../domain/SourceType.js";
import type { SourceRepository } from "../domain/SourceRepository.js";
export interface RegisterSourceCommand {
    id: string;
    name: string;
    type: SourceType;
    uri: string;
}
/**
 * Registers a new source reference.
 * Does NOT extract content - that's done by the extraction module.
 */
export declare class RegisterSource {
    private readonly repository;
    private readonly eventPublisher;
    constructor(repository: SourceRepository, eventPublisher: EventPublisher);
    execute(command: RegisterSourceCommand): Promise<void>;
}
//# sourceMappingURL=RegisterSource.d.ts.map