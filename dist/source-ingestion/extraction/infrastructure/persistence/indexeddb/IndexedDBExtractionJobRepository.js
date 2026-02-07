import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO } from "./ExtractionJobDTO.js";
export class IndexedDBExtractionJobRepository {
    store;
    constructor(dbName = "knowledge-platform") {
        this.store = new IndexedDBStore(dbName, "extraction-jobs");
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
    async findBySourceId(sourceId) {
        const all = await this.store.getAll();
        return all.filter((d) => d.sourceId === sourceId).map(fromDTO);
    }
    async findByStatus(status) {
        const all = await this.store.getAll();
        return all.filter((d) => d.status === status).map(fromDTO);
    }
}
//# sourceMappingURL=IndexedDBExtractionJobRepository.js.map