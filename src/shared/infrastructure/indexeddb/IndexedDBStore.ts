/**
 * Generic IndexedDB key-value store wrapper.
 * Provides a simplified async Map-like interface over IndexedDB.
 * Browser-only — will throw at runtime if indexedDB is not available.
 */
export class IndexedDBStore<T> {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly dbName: string,
    private readonly storeName: string,
    private readonly version: number = 1,
  ) {}

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
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

  private async tx(
    mode: IDBTransactionMode,
  ): Promise<IDBObjectStore> {
    const db = await this.open();
    const tx = db.transaction(this.storeName, mode);
    return tx.objectStore(this.storeName);
  }

  async put(key: string, value: T): Promise<void> {
    const store = await this.tx("readwrite");
    return new Promise<void>((resolve, reject) => {
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async get(key: string): Promise<T | undefined> {
    const store = await this.tx("readonly");
    return new Promise<T | undefined>((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async remove(key: string): Promise<void> {
    const store = await this.tx("readwrite");
    return new Promise<void>((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  async getAll(): Promise<T[]> {
    const store = await this.tx("readonly");
    return new Promise<T[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(): Promise<void> {
    const store = await this.tx("readwrite");
    return new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
