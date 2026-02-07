import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO } from "./StrategyDTO.js";
export class IndexedDBProcessingStrategyRepository {
    store;
    constructor(dbName = "knowledge-platform") {
        this.store = new IndexedDBStore(dbName, "processing-strategies");
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
    async findByType(type) {
        const all = await this.store.getAll();
        return all.filter((d) => d.type === type).map(fromDTO);
    }
    async findActiveByType(type) {
        const all = await this.store.getAll();
        const found = all.find((d) => d.type === type && d.isActive);
        return found ? fromDTO(found) : null;
    }
}
//# sourceMappingURL=IndexedDBProcessingStrategyRepository.js.map