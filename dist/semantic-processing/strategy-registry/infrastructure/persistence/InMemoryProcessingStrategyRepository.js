export class InMemoryProcessingStrategyRepository {
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
    async findActiveByType(type) {
        for (const strategy of this.store.values()) {
            if (strategy.type === type && strategy.isActive) {
                return strategy;
            }
        }
        return null;
    }
}
//# sourceMappingURL=InMemoryProcessingStrategyRepository.js.map