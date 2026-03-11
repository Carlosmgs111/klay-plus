/** Local file-based resource (NeDB, SQLite) */
export interface LocalConnection {
  kind: "local";
  path: string;
}

/** Network resource (PostgreSQL, MongoDB, Pinecone, etc.) */
export interface NetworkConnection {
  kind: "network";
  /** Full URI — overrides host+port if provided */
  url?: string;
  host?: string;
  port?: number;
  ssl?: boolean;
}

/** In-process / browser-native resource (IndexedDB, in-memory) */
export interface EmbeddedConnection {
  kind: "embedded";
  databaseName?: string;
}

export type ConnectionConfig = LocalConnection | NetworkConnection | EmbeddedConnection;
