/**
 * Generic IndexedDB key-value store wrapper.
 * Provides a simplified async Map-like interface over IndexedDB.
 * Browser-only — will throw at runtime if indexedDB is not available.
 */
export class IndexedDBStore {
    dbName;
    storeName;
    version;
    dbPromise = null;
    constructor(dbName, storeName, version = 1) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.version = version;
    }
    open() {
        if (this.dbPromise)
            return this.dbPromise;
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        return this.dbPromise;
    }
    async tx(mode) {
        const db = await this.open();
        const tx = db.transaction(this.storeName, mode);
        return tx.objectStore(this.storeName);
    }
    async put(key, value) {
        const store = await this.tx("readwrite");
        return new Promise((resolve, reject) => {
            const req = store.put(value, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
    async get(key) {
        const store = await this.tx("readonly");
        return new Promise((resolve, reject) => {
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    async remove(key) {
        const store = await this.tx("readwrite");
        return new Promise((resolve, reject) => {
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
    async has(key) {
        const value = await this.get(key);
        return value !== undefined;
    }
    async getAll() {
        const store = await this.tx("readonly");
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    async clear() {
        const store = await this.tx("readwrite");
        return new Promise((resolve, reject) => {
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
}
//# sourceMappingURL=IndexedDBStore.js.map