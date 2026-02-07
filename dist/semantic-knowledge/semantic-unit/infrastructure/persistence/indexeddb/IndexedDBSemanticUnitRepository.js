import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO } from "./SemanticUnitDTO.js";
export class IndexedDBSemanticUnitRepository {
    store;
    constructor(dbName = "knowledge-platform") {
        this.store = new IndexedDBStore(dbName, "semantic-units");
    }
    async save(entity) {
        await this.store.put(entity.id.value, toDTO(entity));
    }
    async findById(id) {
        const dto = await this.store.get(id.value);
        return dto ? fromDTO(dto) : null;
    }
    async delete(id) {
        await this.store.remove(id.value);
    }
    async findByOriginSourceId(sourceId) {
        const all = await this.store.getAll();
        return all.filter((d) => d.origin.sourceId === sourceId).map(fromDTO);
    }
    async findByState(state) {
        const all = await this.store.getAll();
        return all.filter((d) => d.state === state).map(fromDTO);
    }
    async findByTags(tags) {
        const tagSet = new Set(tags);
        const all = await this.store.getAll();
        return all
            .filter((d) => d.metadata.tags.some((t) => tagSet.has(t)))
            .map(fromDTO);
    }
    async exists(id) {
        return this.store.has(id.value);
    }
}
//# sourceMappingURL=IndexedDBSemanticUnitRepository.js.map