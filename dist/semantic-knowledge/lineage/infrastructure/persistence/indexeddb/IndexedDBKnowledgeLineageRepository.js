import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO } from "./LineageDTO.js";
export class IndexedDBKnowledgeLineageRepository {
    store;
    constructor(dbName = "knowledge-platform") {
        this.store = new IndexedDBStore(dbName, "knowledge-lineage");
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
    async findBySemanticUnitId(semanticUnitId) {
        const all = await this.store.getAll();
        const found = all.find((d) => d.semanticUnitId === semanticUnitId);
        return found ? fromDTO(found) : null;
    }
}
//# sourceMappingURL=IndexedDBKnowledgeLineageRepository.js.map