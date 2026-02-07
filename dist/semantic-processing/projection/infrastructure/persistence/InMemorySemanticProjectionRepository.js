export class InMemorySemanticProjectionRepository {
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
    async findBySemanticUnitId(semanticUnitId) {
        return [...this.store.values()].filter((p) => p.semanticUnitId === semanticUnitId);
    }
    async findBySemanticUnitIdAndType(semanticUnitId, type) {
        for (const projection of this.store.values()) {
            if (projection.semanticUnitId === semanticUnitId &&
                projection.type === type) {
                return projection;
            }
        }
        return null;
    }
    async findByStatus(status) {
        return [...this.store.values()].filter((p) => p.status === status);
    }
}
//# sourceMappingURL=InMemorySemanticProjectionRepository.js.map