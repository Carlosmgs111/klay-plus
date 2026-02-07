import type { ProcessingStrategyRepository } from "../domain/ProcessingStrategyRepository.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";
export { RegisterStrategy } from "./RegisterStrategy.js";
export type { RegisterStrategyCommand } from "./RegisterStrategy.js";
import { RegisterStrategy } from "./RegisterStrategy.js";
export declare class StrategyRegistryUseCases {
    readonly registerStrategy: RegisterStrategy;
    constructor(repository: ProcessingStrategyRepository, eventPublisher: EventPublisher);
}
//# sourceMappingURL=index.d.ts.map