import { IndexedDBStore } from "../../../../../shared/infrastructure/indexeddb/IndexedDBStore.js";
import { toDTO, fromDTO } from "./SourceDTO.js";
export class IndexedDBSourceRepository {
    store;
    constructor(dbName = "knowledge-platform") {
        this.store = new IndexedDBStore(dbName, "sources");
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
    async findByUri(uri) {
        const all = await this.store.getAll();
        const found = all.find((d) => d.uri === uri);
        return found ? fromDTO(found) : null;
    }
    async exists(id) {
        return this.store.has(id.value);
    }
}
//# sourceMappingURL=IndexedDBSourceRepository.js.map