import type { ProcessingStrategyRepository } from "../../../domain/ProcessingStrategyRepository.js";
import type { ProcessingStrategy } from "../../../domain/ProcessingStrategy.js";
import type { StrategyId } from "../../../domain/StrategyId.js";
import type { StrategyType } from "../../../domain/StrategyType.js";
import { NeDBStore } from "../../../../../shared/infrastructure/nedb/NeDBStore.js";
import { toDTO, fromDTO, type StrategyDTO } from "../indexeddb/StrategyDTO.js";

export class NeDBProcessingStrategyRepository implements ProcessingStrategyRepository {
  private store: NeDBStore<StrategyDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<StrategyDTO>(filename);
  }

  async save(entity: ProcessingStrategy): Promise<void> {
    await this.store.put(entity.id.value, toDTO(entity));
  }

  async findById(id: StrategyId): Promise<ProcessingStrategy | null> {
    const dto = await this.store.get(id.value);
    return dto ? fromDTO(dto) : null;
  }

  async delete(id: StrategyId): Promise<void> {
    await this.store.remove(id.value);
  }

  async findByType(type: StrategyType): Promise<ProcessingStrategy[]> {
    const results = await this.store.find((d) => d.type === type);
    return results.map(fromDTO);
  }

  async findActiveByType(type: StrategyType): Promise<ProcessingStrategy | null> {
    const found = await this.store.findOne((d) => d.type === type && d.isActive);
    return found ? fromDTO(found) : null;
  }
}
