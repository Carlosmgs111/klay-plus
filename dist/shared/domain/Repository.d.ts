export interface Repository<T, Id> {
    save(entity: T): Promise<void>;
    findById(id: Id): Promise<T | null>;
    delete(id: Id): Promise<void>;
}
//# sourceMappingURL=Repository.d.ts.map