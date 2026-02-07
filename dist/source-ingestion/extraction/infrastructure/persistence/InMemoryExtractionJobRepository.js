export class InMemoryExtractionJobRepository {
    store = new Map();
    async save(entity) {
        this.store.set(entity.id.value, entity);
    }
    async findById(id) {
        return this.store.get(id.value) ?? null;
    }
    async delete(id) {
        this.store.delete(id.value);
    }
    async findBySourceId(sourceId) {
        return [...this.store.values()].filter((j) => j.sourceId === sourceId);
    }
    async findByStatus(status) {
        return [...this.store.values()].filter((j) => j.status === status);
    }
}
//# sourceMappingURL=InMemoryExtractionJobRepository.js.map