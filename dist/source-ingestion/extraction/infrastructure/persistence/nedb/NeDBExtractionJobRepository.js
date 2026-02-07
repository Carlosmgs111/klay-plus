import { NeDBStore } from "../../../../../shared/infrastructure/nedb/NeDBStore.js";
import { toDTO, fromDTO } from "../indexeddb/ExtractionJobDTO.js";
export class NeDBExtractionJobRepository {
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
    async findBySourceId(sourceId) {
        const results = await this.store.find((d) => d.sourceId === sourceId);
        return results.map(fromDTO);
    }
    async findByStatus(status) {
        const results = await this.store.find((d) => d.status === status);
        return results.map(fromDTO);
    }
}
//# sourceMappingURL=NeDBExtractionJobRepository.js.map