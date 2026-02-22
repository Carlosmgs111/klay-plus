import Datastore from "nedb-promises";
import path from "path";
import fs from "fs";

class NeDBManager {
  private static instance: NeDBManager;
  private dbs: Map<string, Datastore<any>>;
  private baseDir: string;

  private constructor() {
    this.dbs = new Map();
    this.baseDir = path.join(process.cwd(), "database", "nedb");
    this.ensureBaseDir();
  }

  static getInstance(): NeDBManager {
    if (!NeDBManager.instance) {
      NeDBManager.instance = new NeDBManager();
    }
    return NeDBManager.instance;
  }

  private ensureBaseDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getDB(dbName: string, options?: { autoload?: boolean; inMemoryOnly?: boolean }): Datastore<any> {
    if (!this.dbs.has(dbName)) {
      const db = Datastore.create({
        filename: options?.inMemoryOnly ? undefined : path.join(this.baseDir, `${dbName}.db`),
        autoload: options?.autoload !== false,
      });
      this.dbs.set(dbName, db);
    }
    return this.dbs.get(dbName)!;
  }

  async closeAll(): Promise<void> {
    this.dbs.clear();
  }

  getBaseDir(): string {
    return this.baseDir;
  }
}

export function getNeDB(dbName: string, options?: { autoload?: boolean; inMemoryOnly?: boolean }): Datastore<any> {
  return NeDBManager.getInstance().getDB(dbName, options);
}

export async function closeAllNeDB(): Promise<void> {
  await NeDBManager.getInstance().closeAll();
}

export function getNeDBBaseDir(): string {
  return NeDBManager.getInstance().getBaseDir();
}
