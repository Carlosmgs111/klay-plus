import type { ProcessingStrategyRepository } from "../../domain/ProcessingStrategyRepository.js";
import type { ProcessingStrategy } from "../../domain/ProcessingStrategy.js";
import type { StrategyId } from "../../domain/StrategyId.js";
import type { StrategyType } from "../../domain/StrategyType.js";

export class InMemoryProcessingStrategyRepository implements ProcessingStrategyRepository {
  private store = new Map<string, ProcessingStrategy>();

  async save(entity: ProcessingStrategy): Promise<void> {
    this.store.set(entity.id.value, entity);
  }

  async findById(id: StrategyId): Promise<ProcessingStrategy | null> {
    return this.store.get(id.value) ?? null;
  }

  async delete(id: StrategyId): Promise<void> {
    this.store.delete(id.value);
  }

  async findByType(type: StrategyType): Promise<ProcessingStrategy[]> {
    return [...this.store.values()].filter((s) => s.type === type);
  }

  async findActiveByType(type: StrategyType): Promise<ProcessingStrategy | null> {
    for (const strategy of this.store.values()) {
      if (strategy.type === type && strategy.isActive) {
        return strategy;
      }
    }
    return null;
  }
}
