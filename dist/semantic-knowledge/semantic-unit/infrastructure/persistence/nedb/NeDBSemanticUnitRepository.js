import { NeDBStore } from "../../../../../shared/infrastructure/nedb/NeDBStore.js";
import { toDTO, fromDTO } from "../indexeddb/SemanticUnitDTO.js";
export class NeDBSemanticUnitRepository {
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
    async findByOriginSourceId(sourceId) {
        const results = await this.store.find((d) => d.origin.sourceId === sourceId);
        return results.map(fromDTO);
    }
    async findByState(state) {
        const results = await this.store.find((d) => d.state === state);
        return results.map(fromDTO);
    }
    async findByTags(tags) {
        const tagSet = new Set(tags);
        const results = await this.store.find((d) => d.metadata.tags.some((t) => tagSet.has(t)));
        return results.map(fromDTO);
    }
    async exists(id) {
        return this.store.has(id.value);
    }
}
//# sourceMappingURL=NeDBSemanticUnitRepository.js.map