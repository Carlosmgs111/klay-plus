import type { NetworkConnection } from "./ConnectionConfig";

export type DocumentStorageConfig =
  | { type: "in-memory" }
  | { type: "local"; basePath: string }
  | { type: "browser" }
  | { type: "s3"; authRef: string; bucket: string; region: string; prefix?: string; endpoint?: string }
  | { type: "gcs"; authRef: string; bucket: string; prefix?: string }
  | { type: "azure-blob"; authRef: string; container: string; prefix?: string }
  | { type: "minio"; connection: NetworkConnection; authRef: string; bucket: string; prefix?: string };
