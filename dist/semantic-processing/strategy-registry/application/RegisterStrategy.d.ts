import type { EventPublisher } from "../../../shared/domain/index.js";
import type { StrategyType } from "../domain/StrategyType.js";
import type { ProcessingStrategyRepository } from "../domain/ProcessingStrategyRepository.js";
export interface RegisterStrategyCommand {
    id: string;
    name: string;
    type: StrategyType;
    configuration?: Record<string, unknown>;
}
export declare class RegisterStrategy {
    private readonly repository;
    private readonly eventPublisher;
    constructor(repository: ProcessingStrategyRepository, eventPublisher: EventPublisher);
    execute(command: RegisterStrategyCommand): Promise<void>;
}
//# sourceMappingURL=RegisterStrategy.d.ts.map