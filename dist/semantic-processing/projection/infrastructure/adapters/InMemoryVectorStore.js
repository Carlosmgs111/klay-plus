import { cosineSimilarity } from "../../../../shared/infrastructure/hashVector.js";
export class InMemoryVectorStore {
    entries = new Map();
    async upsert(entries) {
        for (const entry of entries) {
            this.entries.set(entry.id, entry);
        }
    }
    async delete(ids) {
        for (const id of ids) {
            this.entries.delete(id);
        }
    }
    async deleteBySemanticUnitId(semanticUnitId) {
        for (const [id, entry] of this.entries) {
            if (entry.semanticUnitId === semanticUnitId) {
                this.entries.delete(id);
            }
        }
    }
    async search(vector, topK, filter) {
        let candidates = [...this.entries.values()];
        if (filter) {
            candidates = candidates.filter((entry) => Object.entries(filter).every(([key, value]) => entry.metadata[key] === value));
        }
        const scored = candidates.map((entry) => ({
            entry,
            score: cosineSimilarity(vector, entry.vector),
        }));
        return scored.sort((a, b) => b.score - a.score).slice(0, topK);
    }
    getEntryCount() {
        return this.entries.size;
    }
}
//# sourceMappingURL=InMemoryVectorStore.js.map