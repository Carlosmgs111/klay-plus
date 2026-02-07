/**
 * Generic IndexedDB key-value store wrapper.
 * Provides a simplified async Map-like interface over IndexedDB.
 * Browser-only — will throw at runtime if indexedDB is not available.
 */
export declare class IndexedDBStore<T> {
    private readonly dbName;
    private readonly storeName;
    private readonly version;
    private dbPromise;
    constructor(dbName: string, storeName: string, version?: number);
    private open;
    private tx;
    put(key: string, value: T): Promise<void>;
    get(key: string): Promise<T | undefined>;
    remove(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
    getAll(): Promise<T[]>;
    clear(): Promise<void>;
}
//# sourceMappingURL=IndexedDBStore.d.ts.map