/**
 * Generic NeDB key-value store wrapper.
 * Provides a simplified async Map-like interface over nedb-promises.
 * Server-only — requires Node.js.
 */
export declare class NeDBStore<T> {
    private readonly filename?;
    private db;
    private initPromise;
    constructor(filename?: string | undefined);
    private ensureDB;
    put(key: string, value: T): Promise<void>;
    get(key: string): Promise<T | undefined>;
    remove(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
    getAll(): Promise<T[]>;
    find(predicate: (value: T) => boolean): Promise<T[]>;
    findOne(predicate: (value: T) => boolean): Promise<T | undefined>;
    clear(): Promise<void>;
}
//# sourceMappingURL=NeDBStore.d.ts.map