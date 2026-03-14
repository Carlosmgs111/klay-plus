import type { InfrastructureProfile } from "@klay/core/config";

/** Normalize legacy profiles where axis values may be plain strings */
export function normalizeProfile(profile: InfrastructureProfile): InfrastructureProfile {
  const norm = (val: unknown) =>
    typeof val === "object" && val !== null ? val : { type: String(val) };
  return {
    ...profile,
    persistence: norm(profile.persistence) as InfrastructureProfile["persistence"],
    vectorStore: norm(profile.vectorStore) as InfrastructureProfile["vectorStore"],
    embedding: norm(profile.embedding) as InfrastructureProfile["embedding"],
    documentStorage: norm(profile.documentStorage) as InfrastructureProfile["documentStorage"],
  };
}

/** Read a possibly nested value: "connection.host" → config.connection.host */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Set a possibly nested value, returning a new object */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split(".");
  if (parts.length === 1) {
    const result = { ...obj };
    if (value === undefined || value === "") {
      delete result[path];
    } else {
      result[path] = value;
    }
    return result;
  }

  const [head, ...rest] = parts;
  const child = (typeof obj[head] === "object" && obj[head] !== null)
    ? { ...(obj[head] as Record<string, unknown>) }
    : {};
  const updated = setNestedValue(child, rest.join("."), value);

  const hasValues = Object.values(updated).some((v) => v !== undefined);
  const result = { ...obj };
  if (hasValues) {
    result[head] = updated;
  } else {
    delete result[head];
  }
  return result;
}
