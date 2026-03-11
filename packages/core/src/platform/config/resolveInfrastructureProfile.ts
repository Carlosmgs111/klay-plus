import type { InfrastructureProfile } from "./InfrastructureProfile";
import type { PersistenceConfig } from "./PersistenceConfig";
import type { VectorStoreConfig } from "./VectorStoreConfig";
import type { EmbeddingConfig } from "./EmbeddingConfig";
import type { DocumentStorageConfig } from "./DocumentStorageConfig";
import type { ConfigStore } from "./ConfigStore";
import { PRESET_PROFILES } from "./presets";

export const INFRA_PROFILE_KEY = "__INFRA_PROFILE__";

/**
 * Policy shape accepted by resolveInfrastructureProfile.
 * Matches the common fields across pipeline / lifecycle / management policies.
 */
interface ProfileResolutionPolicy {
  provider: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  embeddingDimensions?: number;
  infrastructure?: Partial<InfrastructureProfile>;
  configStore?: ConfigStore;
}

/**
 * Deep-merge helper that handles typed config objects.
 * Only overwrites defined fields from the source.
 */
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
    ...(partial.llm || base.llm ? { llm: partial.llm ?? base.llm } : {}),
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
