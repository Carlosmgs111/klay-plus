import type { SecretMetadata, ManagedSecretSummary } from "./ManagedSecret";

export interface SecretStore {
  /** Store or update a secret (encrypted at rest) */
  set(key: string, value: string, metadata?: SecretMetadata): Promise<void>;

  /** Retrieve and decrypt a secret */
  get(key: string): Promise<string | undefined>;

  /** Check existence without decrypting */
  exists(key: string): Promise<boolean>;

  /** Remove a secret */
  remove(key: string): Promise<void>;

  /** List all secrets (metadata only, NO values) */
  list(): Promise<ManagedSecretSummary[]>;

  /** Get metadata for a specific secret */
  getMetadata(key: string): Promise<SecretMetadata | undefined>;

  /** Retrieve multiple secrets at once */
  getMultiple(keys: string[]): Promise<Record<string, string>>;
}
