/**
 * Generic NeDB repository with DTO serialization.
 * Subclass, provide toDTO/fromDTO, and add domain-specific queries.
 */
import { NeDBStore } from "./nedb/NeDBStore.js";

export abstract class BaseNeDBRepository<
  TEntity extends { id: { value: string } },
  TDTO,
> {
  protected store: NeDBStore<TDTO>;

  constructor(filename?: string) {
    this.store = new NeDBStore<TDTO>(filename);
  }

  protected abstract toDTO(entity: TEntity): TDTO;
  protected abstract fromDTO(dto: TDTO): TEntity;

  async save(entity: TEntity): Promise<void> {
    await this.store.put(entity.id.value, this.toDTO(entity));
  }

  async findById(id: { value: string }): Promise<TEntity | null> {
    const dto = await this.store.get(id.value);
    return dto ? this.fromDTO(dto) : null;
  }

  async delete(id: { value: string }): Promise<void> {
    await this.store.remove(id.value);
  }

  async exists(id: { value: string }): Promise<boolean> {
    return this.store.has(id.value);
  }

  protected async findWhere(
    predicate: (dto: TDTO) => boolean,
  ): Promise<TEntity[]> {
    const results = await this.store.find(predicate);
    return results.map((dto) => this.fromDTO(dto));
  }

  protected async findOneWhere(
    predicate: (dto: TDTO) => boolean,
  ): Promise<TEntity | null> {
    const dto = await this.store.findOne(predicate);
    return dto ? this.fromDTO(dto) : null;
  }
}
