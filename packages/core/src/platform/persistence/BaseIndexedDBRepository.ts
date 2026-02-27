/**
 * Generic IndexedDB repository with DTO serialization.
 * Subclass, provide toDTO/fromDTO, and add domain-specific queries.
 */
import { IndexedDBStore } from "./indexeddb/IndexedDBStore.js";

export abstract class BaseIndexedDBRepository<
  TEntity extends { id: { value: string } },
  TDTO,
> {
  protected store: IndexedDBStore<TDTO>;

  constructor(dbName: string = "knowledge-platform", storeName: string) {
    this.store = new IndexedDBStore<TDTO>(dbName, storeName);
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
    const all = await this.store.getAll();
    return all.filter(predicate).map((dto) => this.fromDTO(dto));
  }

  protected async findOneWhere(
    predicate: (dto: TDTO) => boolean,
  ): Promise<TEntity | null> {
    const all = await this.store.getAll();
    const dto = all.find(predicate);
    return dto ? this.fromDTO(dto) : null;
  }

  protected async deleteWhere(
    predicate: (dto: TDTO) => boolean,
    keyExtractor: (dto: TDTO) => string,
  ): Promise<void> {
    const all = await this.store.getAll();
    for (const dto of all) {
      if (predicate(dto)) {
        await this.store.remove(keyExtractor(dto));
      }
    }
  }
}
