import { NeDBStore } from "../../../../../shared/infrastructure/nedb/NeDBStore.js";
import { toDTO, fromDTO } from "../indexeddb/SourceDTO.js";
export class NeDBSourceRepository {
    store;
    constructor(filename) {
        this.store = new NeDBStore(filename);
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
        const results = await this.store.find((d) => d.type === type);
        return results.map(fromDTO);
    }
    async findByUri(uri) {
        const found = await this.store.findOne((d) => d.uri === uri);
        return found ? fromDTO(found) : null;
    }
    async exists(id) {
        return this.store.has(id.value);
    }
}
//# sourceMappingURL=NeDBSourceRepository.js.map