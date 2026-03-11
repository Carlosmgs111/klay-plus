import type { InfrastructureProfile } from "./InfrastructureProfile";

export interface ValidationError {
  code: "DIMENSION_MISMATCH" | "MISSING_AUTH_REF" | "RUNTIME_MISMATCH" | "MISSING_REQUIRED_FIELD";
  message: string;
  axis?: string;
}

/** Extract dimensions from embedding config */
function getEmbeddingDimensions(embedding: InfrastructureProfile["embedding"]): number | undefined {
  if ("dimensions" in embedding) return embedding.dimensions;
  return undefined;
}

/** Check if a config requires authRef and whether it's present */
function hasValidAuthRef(config: Record<string, unknown>): boolean {
  if (!("authRef" in config)) return true; // no authRef field = no auth needed
  const ref = config.authRef;
  return typeof ref === "string" && ref.length > 0;
}

const BROWSER_ONLY_TYPES = new Set(["indexeddb", "browser"]);
const SERVER_ONLY_TYPES = new Set(["nedb", "sqlite", "postgresql", "mongodb"]);

export function validateProfile(profile: InfrastructureProfile): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Dimension consistency
  const embDim = getEmbeddingDimensions(profile.embedding);
  const vecDim = profile.vectorStore.dimensions;
  if (embDim !== undefined && vecDim !== undefined && embDim !== vecDim) {
    errors.push({
      code: "DIMENSION_MISMATCH",
      message: `Embedding dimensions (${embDim}) do not match vector store dimensions (${vecDim})`,
    });
  }

  // 2. Auth ref validation for all axes
  const axes = [
    { name: "embedding", config: profile.embedding },
    { name: "vectorStore", config: profile.vectorStore },
    { name: "persistence", config: profile.persistence },
    { name: "documentStorage", config: profile.documentStorage },
    ...(profile.llm ? [{ name: "llm", config: profile.llm }] : []),
  ];

  for (const { name, config } of axes) {
    if (!hasValidAuthRef(config as Record<string, unknown>)) {
      errors.push({
        code: "MISSING_AUTH_REF",
        message: `${name} provider "${config.type}" requires an authRef but none was provided`,
        axis: name,
      });
    }
  }

  // 3. Runtime compatibility (browser-only types shouldn't mix with server-only types)
  const allTypes = [
    profile.persistence.type,
    profile.vectorStore.type,
    profile.documentStorage.type,
  ];
  const hasBrowserOnly = allTypes.some((t) => BROWSER_ONLY_TYPES.has(t));
  const hasServerOnly = allTypes.some((t) => SERVER_ONLY_TYPES.has(t));
  if (hasBrowserOnly && hasServerOnly) {
    errors.push({
      code: "RUNTIME_MISMATCH",
      message: "Profile mixes browser-only and server-only providers",
    });
  }

  return errors;
}
