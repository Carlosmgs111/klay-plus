export type SecretCategory =
  | "api-key"
  | "credential"
  | "connection-string"
  | "certificate"
  | "token";

export interface SecretMetadata {
  name?: string;
  category?: SecretCategory;
  scope?: "global" | "profile";
  provider?: string;
  description?: string;
  expiresAt?: Date;
}

export interface ManagedSecretSummary {
  key: string;
  name?: string;
  category?: SecretCategory;
  scope: "global" | "profile";
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
}
