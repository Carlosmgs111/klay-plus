/**
 * Module-level cache of NeDB Datastore instances keyed by filename.
 * Ensures that multiple NeDBStore instances pointing at the same file
 * share a single Datastore — critical for read/write store pairs
 * (e.g. VectorWriteStore and VectorReadStore) that must share in-memory state.
 */
const _datastoreCache = new Map<string, any>();

/**
 * Generic NeDB key-value store wrapper.
 * Provides a simplified async Map-like interface over nedb-promises.
 * Server-only — requires Node.js.
 */
export class NeDBStore<T> {
  private db: any = null;
  private initPromise: Promise<void> | null = null;

  constructor(private readonly filename?: string) {}

  private async ensureDB(): Promise<any> {
    if (this.db) return this.db;

    // File-backed stores share a Datastore per filename
    if (this.filename && _datastoreCache.has(this.filename)) {
      this.db = _datastoreCache.get(this.filename);
      return this.db;
    }

    if (!this.initPromise) {
      this.initPromise = (async () => {
        const Datastore = (await import("nedb-promises")).default;
        this.db = Datastore.create(
          this.filename ? { filename: this.filename, autoload: true } : {},
        );
        if (this.filename) {
          _datastoreCache.set(this.filename, this.db);
        }
      })();
    }

    await this.initPromise;
    return this.db;
  }

  async put(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    const existing = await db.findOne({ _key: key });
    if (existing) {
      await db.update({ _key: key }, { _key: key, _value: value });
    } else {
      await db.insert({ _key: key, _value: value });
    }
  }

  async get(key: string): Promise<T | undefined> {
    const db = await this.ensureDB();
    const doc = await db.findOne({ _key: key });
    return doc ? (doc._value as T) : undefined;
  }

  async remove(key: string): Promise<void> {
    const db = await this.ensureDB();
    await db.remove({ _key: key }, {});
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  async getAll(): Promise<T[]> {
    const db = await this.ensureDB();
    const docs = await db.find({});
    return docs.map((doc: any) => doc._value as T);
  }

  async entries(): Promise<[string, T][]> {
    const db = await this.ensureDB();
    const docs = await db.find({});
    return docs.map((doc: any) => [doc._key as string, doc._value as T]);
  }

  async find(predicate: (value: T) => boolean): Promise<T[]> {
    const all = await this.getAll();
    return all.filter(predicate);
  }

  async findOne(predicate: (value: T) => boolean): Promise<T | undefined> {
    const all = await this.getAll();
    return all.find(predicate);
  }

  async clear(): Promise<void> {
    const db = await this.ensureDB();
    await db.remove({}, { multi: true });
  }
}
