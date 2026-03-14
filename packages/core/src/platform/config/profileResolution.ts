import type {
  InfrastructureProfile,
  PersistenceConfig,
  VectorStoreConfig,
  EmbeddingConfig,
  DocumentStorageConfig,
} from "./InfrastructureProfile";
import { PRESET_PROFILES } from "./InfrastructureProfile";
import type { ConfigStore } from "./ConfigStore";

// ── Profile Resolution ───────────────────────────────────────────────

export const INFRA_PROFILE_KEY = "__INFRA_PROFILE__";

interface ProfileResolutionPolicy {
  provider: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  embeddingDimensions?: number;
  infrastructure?: Partial<InfrastructureProfile>;
  configStore?: ConfigStore;
}

function mergeProfile(
  base: InfrastructureProfile,
  partial: Partial<InfrastructureProfile>,
): InfrastructureProfile {
  return {
    id: partial.id ?? base.id,
    name: partial.name ?? base.name,
    persistence: partial.persistence ?? base.persistence,
    vectorStore: partial.vectorStore ?? base.vectorStore,
    embedding: partial.embedding ?? base.embedding,
    documentStorage: partial.documentStorage ?? base.documentStorage,
  };
}

/**
 * Resolve a full InfrastructureProfile from a policy.
 *
 * Priority (broadest -> most specific):
 * 1. Expand legacy `provider` string via PRESET_PROFILES
 * 2. Layer persisted profile from ConfigStore (`__INFRA_PROFILE__` key)
 * 3. Layer legacy `embeddingProvider` / `embeddingModel` / `embeddingDimensions`
 * 4. Layer explicit `infrastructure` overrides (highest priority)
 */
export async function resolveInfrastructureProfile(
  policy: ProfileResolutionPolicy,
): Promise<InfrastructureProfile> {
  // 1. Base from provider preset
  const preset = PRESET_PROFILES[policy.provider] ?? PRESET_PROFILES["in-memory"];
  let result: InfrastructureProfile = { ...preset };

  // 2. Layer persisted profile from ConfigStore
  if (policy.configStore) {
    const persisted = await loadProfileFromStore(policy.configStore);
    if (persisted) {
      result = mergeProfile(result, persisted);
    }
  }

  // 3. Layer legacy embedding fields
  if (policy.embeddingProvider || policy.embeddingModel || policy.embeddingDimensions !== undefined) {
    const currentEmbed = { ...result.embedding } as Record<string, unknown>;
    if (policy.embeddingProvider) {
      currentEmbed.type = policy.embeddingProvider;
    }
    if (policy.embeddingModel) {
      currentEmbed.model = policy.embeddingModel;
    }
    if (policy.embeddingDimensions !== undefined) {
      currentEmbed.dimensions = policy.embeddingDimensions;
    }
    result.embedding = currentEmbed as EmbeddingConfig;
  }

  // 4. Layer explicit infrastructure overrides (highest priority)
  if (policy.infrastructure) {
    result = mergeProfile(result, policy.infrastructure);
  }

  return result;
}

async function loadProfileFromStore(
  store: ConfigStore,
): Promise<Partial<InfrastructureProfile> | null> {
  try {
    const raw = await store.get(INFRA_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<InfrastructureProfile>;
  } catch {
    return null;
  }
}

export async function saveProfileToStore(
  store: ConfigStore,
  profile: InfrastructureProfile,
): Promise<void> {
  await store.set(INFRA_PROFILE_KEY, JSON.stringify(profile));
}

// ── Profile Helpers (typed config → legacy provider string) ──────────

const RUNTIME_MAP: Record<string, "in-memory" | "browser" | "server"> = {
  "in-memory": "in-memory",
  indexeddb: "browser",
  browser: "browser",
  nedb: "server",
  local: "server",
};

function toRuntimeProvider(config: { type: string }): string {
  return RUNTIME_MAP[config.type] ?? "in-memory";
}

export const persistenceToProvider = toRuntimeProvider as (config: PersistenceConfig) => string;
export const vectorStoreToProvider = toRuntimeProvider as (config: VectorStoreConfig) => string;
export const documentStorageToProvider = toRuntimeProvider as (config: DocumentStorageConfig) => string;

/**
 * Extract embedding dimensions from the profile.
 * Checks EmbeddingConfig first, falls back to VectorStoreConfig dimensions.
 */
export function getEmbeddingDimensions(profile: InfrastructureProfile): number | undefined {
  const embed = profile.embedding as Record<string, unknown>;
  if (typeof embed.dimensions === "number") return embed.dimensions;
  return profile.vectorStore.dimensions;
}

/** Extract the embedding model from the profile's EmbeddingConfig, if present. */
export function getEmbeddingModel(profile: InfrastructureProfile): string | undefined {
  const embed = profile.embedding as Record<string, unknown>;
  return typeof embed.model === "string" ? embed.model : undefined;
}

// ── Validation ───────────────────────────────────────────────────────

export interface ValidationError {
  code: "DIMENSION_MISMATCH" | "MISSING_AUTH_REF" | "RUNTIME_MISMATCH" | "MISSING_REQUIRED_FIELD";
  message: string;
  axis?: string;
}

function getEmbeddingDimensionsFromConfig(embedding: InfrastructureProfile["embedding"]): number | undefined {
  if (typeof embedding !== "object" || embedding === null) return undefined;
  if ("dimensions" in embedding) return embedding.dimensions;
  return undefined;
}

function hasValidAuthRef(config: Record<string, unknown>): boolean {
  if (!("authRef" in config)) return true;
  const ref = config.authRef;
  return typeof ref === "string" && ref.length > 0;
}

const BROWSER_ONLY_TYPES = new Set(["indexeddb", "browser"]);
const SERVER_ONLY_TYPES = new Set(["nedb", "local"]);

export function validateProfile(profile: InfrastructureProfile): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Dimension consistency
  const embDim = getEmbeddingDimensionsFromConfig(profile.embedding);
  const vecDim = typeof profile.vectorStore === "object" && "dimensions" in profile.vectorStore
    ? profile.vectorStore.dimensions
    : undefined;
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
  ];

  for (const { name, config } of axes) {
    if (typeof config !== "object" || config === null) continue;
    if (!hasValidAuthRef(config as Record<string, unknown>)) {
      errors.push({
        code: "MISSING_AUTH_REF",
        message: `${name} provider "${config.type}" requires an authRef but none was provided`,
        axis: name,
      });
    }
  }

  // 3. Runtime compatibility
  const extractType = (cfg: unknown): string =>
    typeof cfg === "object" && cfg !== null && "type" in cfg
      ? (cfg as { type: string }).type
      : typeof cfg === "string" ? cfg : "";
  const allTypes = [
    extractType(profile.persistence),
    extractType(profile.vectorStore),
    extractType(profile.documentStorage),
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
