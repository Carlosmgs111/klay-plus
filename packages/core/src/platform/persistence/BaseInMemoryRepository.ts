/**
 * Generic in-memory repository using a Map.
 * Entities must have `.id.value: string`.
 * Subclass and add domain-specific query methods.
 */
export abstract class BaseInMemoryRepository<
  TEntity extends { id: { value: string } },
> {
  protected store = new Map<string, TEntity>();

  async save(entity: TEntity): Promise<void> {
    this.store.set(entity.id.value, entity);
  }

  async findById(id: { value: string }): Promise<TEntity | null> {
    return this.store.get(id.value) ?? null;
  }

  async delete(id: { value: string }): Promise<void> {
    this.store.delete(id.value);
  }

  async exists(id: { value: string }): Promise<boolean> {
    return this.store.has(id.value);
  }

  protected findWhere(predicate: (e: TEntity) => boolean): TEntity[] {
    return [...this.store.values()].filter(predicate);
  }

  protected findOneWhere(
    predicate: (e: TEntity) => boolean,
  ): TEntity | null {
    for (const e of this.store.values()) {
      if (predicate(e)) return e;
    }
    return null;
  }

  protected deleteWhere(predicate: (e: TEntity) => boolean): void {
    for (const [key, e] of this.store) {
      if (predicate(e)) this.store.delete(key);
    }
  }
}
