import type { NetworkConnection } from "./ConnectionConfig";

export interface PoolConfig {
  min?: number;
  max?: number;
  idleTimeoutMs?: number;
}

export type PersistenceConfig =
  | { type: "in-memory" }
  | { type: "indexeddb"; databaseName?: string }
  | { type: "nedb"; path?: string }
  | { type: "sqlite"; path: string; readonly?: boolean }
  | {
      type: "postgresql";
      connection: NetworkConnection;
      authRef?: string;
      database: string;
      schema?: string;
      pool?: PoolConfig;
    }
  | {
      type: "mongodb";
      connection: NetworkConnection;
      authRef?: string;
      database: string;
      authSource?: string;
      replicaSet?: string;
    };
