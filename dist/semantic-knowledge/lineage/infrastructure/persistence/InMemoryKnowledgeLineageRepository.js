export class InMemoryKnowledgeLineageRepository {
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
        for (const lineage of this.store.values()) {
            if (lineage.semanticUnitId === semanticUnitId) {
                return lineage;
            }
        }
        return null;
    }
}
//# sourceMappingURL=InMemoryKnowledgeLineageRepository.js.map