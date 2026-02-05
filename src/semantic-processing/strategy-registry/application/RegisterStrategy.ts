import type { EventPublisher } from "../../../shared/domain/index.js";
import { ProcessingStrategy } from "../domain/ProcessingStrategy.js";
import { StrategyId } from "../domain/StrategyId.js";
import type { StrategyType } from "../domain/StrategyType.js";
import type { ProcessingStrategyRepository } from "../domain/ProcessingStrategyRepository.js";

export interface RegisterStrategyCommand {
  id: string;
  name: string;
  type: StrategyType;
  configuration?: Record<string, unknown>;
}

export class RegisterStrategy {
  constructor(
    private readonly repository: ProcessingStrategyRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: RegisterStrategyCommand): Promise<void> {
    const strategyId = StrategyId.create(command.id);

    const existing = await this.repository.findById(strategyId);
    if (existing) {
      throw new Error(`Strategy ${command.id} already exists`);
    }

    const strategy = ProcessingStrategy.register(
      strategyId,
      command.name,
      command.type,
      command.configuration ?? {},
    );

    await this.repository.save(strategy);
    await this.eventPublisher.publishAll(strategy.clearEvents());
  }
}
