/**
 * Generic NeDB key-value store wrapper.
 * Provides a simplified async Map-like interface over nedb-promises.
 * Server-only — requires Node.js.
 */
export class NeDBStore {
    filename;
    db = null;
    initPromise = null;
    constructor(filename) {
        this.filename = filename;
    }
    async ensureDB() {
        if (this.db)
            return this.db;
        if (!this.initPromise) {
            this.initPromise = (async () => {
                const Datastore = (await import("nedb-promises")).default;
                this.db = Datastore.create(this.filename ? { filename: this.filename, autoload: true } : {});
            })();
        }
        await this.initPromise;
        return this.db;
    }
    async put(key, value) {
        const db = await this.ensureDB();
        const existing = await db.findOne({ _key: key });
        if (existing) {
            await db.update({ _key: key }, { _key: key, _value: value });
        }
        else {
            await db.insert({ _key: key, _value: value });
        }
    }
    async get(key) {
        const db = await this.ensureDB();
        const doc = await db.findOne({ _key: key });
        return doc ? doc._value : undefined;
    }
    async remove(key) {
        const db = await this.ensureDB();
        await db.remove({ _key: key }, {});
    }
    async has(key) {
        const value = await this.get(key);
        return value !== undefined;
    }
    async getAll() {
        const db = await this.ensureDB();
        const docs = await db.find({});
        return docs.map((doc) => doc._value);
    }
    async find(predicate) {
        const all = await this.getAll();
        return all.filter(predicate);
    }
    async findOne(predicate) {
        const all = await this.getAll();
        return all.find(predicate);
    }
    async clear() {
        const db = await this.ensureDB();
        await db.remove({}, { multi: true });
    }
}
//# sourceMappingURL=NeDBStore.js.map