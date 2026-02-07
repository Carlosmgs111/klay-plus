import type { EventPublisher } from "../../../shared/domain/index.js";
import type { SourceRepository } from "../domain/SourceRepository.js";
export interface UpdateSourceCommand {
    sourceId: string;
    contentHash: string;
}
/**
 * Records that content was extracted for a source.
 * Called by the orchestrator after extraction completes.
 */
export declare class UpdateSource {
    private readonly repository;
    private readonly eventPublisher;
    constructor(repository: SourceRepository, eventPublisher: EventPublisher);
    execute(command: UpdateSourceCommand): Promise<boolean>;
}
//# sourceMappingURL=UpdateSource.d.ts.map