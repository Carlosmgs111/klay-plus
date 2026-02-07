export class InMemorySemanticUnitRepository {
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
    async findByOriginSourceId(sourceId) {
        return [...this.store.values()].filter((u) => u.origin.sourceId === sourceId);
    }
    async findByState(state) {
        return [...this.store.values()].filter((u) => u.state === state);
    }
    async findByTags(tags) {
        const tagSet = new Set(tags);
        return [...this.store.values()].filter((u) => u.metadata.tags.some((t) => tagSet.has(t)));
    }
    async exists(id) {
        return this.store.has(id.value);
    }
}
//# sourceMappingURL=InMemorySemanticUnitRepository.js.map