import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO } from "./ProjectionDTO.js";
export class IndexedDBSemanticProjectionRepository {
    store;
    constructor(dbName = "knowledge-platform") {
        this.store = new IndexedDBStore(dbName, "semantic-projections");
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
        return all.filter((d) => d.semanticUnitId === semanticUnitId).map(fromDTO);
    }
    async findBySemanticUnitIdAndType(semanticUnitId, type) {
        const all = await this.store.getAll();
        const found = all.find((d) => d.semanticUnitId === semanticUnitId && d.type === type);
        return found ? fromDTO(found) : null;
    }
    async findByStatus(status) {
        const all = await this.store.getAll();
        return all.filter((d) => d.status === status).map(fromDTO);
    }
}
//# sourceMappingURL=IndexedDBSemanticProjectionRepository.js.map