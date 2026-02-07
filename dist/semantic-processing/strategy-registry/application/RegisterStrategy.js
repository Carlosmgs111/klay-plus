import { ProcessingStrategy } from "../domain/ProcessingStrategy.js";
import { StrategyId } from "../domain/StrategyId.js";
export class RegisterStrategy {
    repository;
    eventPublisher;
    constructor(repository, eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }
    async execute(command) {
        const strategyId = StrategyId.create(command.id);
        const existing = await this.repository.findById(strategyId);
        if (existing) {
            throw new Error(`Strategy ${command.id} already exists`);
        }
        const strategy = ProcessingStrategy.register(strategyId, command.name, command.type, command.configuration ?? {});
        await this.repository.save(strategy);
        await this.eventPublisher.publishAll(strategy.clearEvents());
    }
}
//# sourceMappingURL=RegisterStrategy.js.map