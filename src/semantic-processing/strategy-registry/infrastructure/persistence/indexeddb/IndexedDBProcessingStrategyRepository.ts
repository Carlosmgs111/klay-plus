import type { ProcessingStrategyRepository } from "../../../domain/ProcessingStrategyRepository.js";
import type { ProcessingStrategy } from "../../../domain/ProcessingStrategy.js";
import type { StrategyId } from "../../../domain/StrategyId.js";
import type { StrategyType } from "../../../domain/StrategyType.js";
import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO, type StrategyDTO } from "./StrategyDTO.js";

export class IndexedDBProcessingStrategyRepository implements ProcessingStrategyRepository {
  private store: IndexedDBStore<StrategyDTO>;

  constructor(dbName: string = "knowledge-platform") {
    this.store = new IndexedDBStore<StrategyDTO>(dbName, "processing-strategies");
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
    const all = await this.store.getAll();
    return all.filter((d) => d.type === type).map(fromDTO);
  }

  async findActiveByType(type: StrategyType): Promise<ProcessingStrategy | null> {
    const all = await this.store.getAll();
    const found = all.find((d) => d.type === type && d.isActive);
    return found ? fromDTO(found) : null;
  }
}
