export class InMemorySourceRepository {
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
    async findByType(type) {
        return [...this.store.values()].filter((s) => s.type === type);
    }
    async findByUri(uri) {
        for (const source of this.store.values()) {
            if (source.uri === uri)
                return source;
        }
        return null;
    }
    async exists(id) {
        return this.store.has(id.value);
    }
}
//# sourceMappingURL=InMemorySourceRepository.js.map