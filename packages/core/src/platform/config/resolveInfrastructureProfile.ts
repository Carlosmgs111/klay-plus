import type { InfrastructureProfile } from "./InfrastructureProfile";
import { DEFAULT_PROFILES } from "./InfrastructureProfile";
import type { ConfigStore } from "./ConfigStore";

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
 * Resolve a full InfrastructureProfile from a policy.
 *
 * Priority (broadest → most specific):
 * 1. Expand legacy `provider` string via DEFAULT_PROFILES
 * 2. Layer persisted profile from ConfigStore (`__INFRA_PROFILE__` key)
 * 3. Layer legacy `embeddingProvider` / `embeddingModel` / `embeddingDimensions`
 * 4. Layer explicit `infrastructure` overrides (highest priority)
 */
export async function resolveInfrastructureProfile(
  policy: ProfileResolutionPolicy,
): Promise<InfrastructureProfile> {
  // 1. Base from provider
  const base: InfrastructureProfile = DEFAULT_PROFILES[policy.provider]
    ? { ...DEFAULT_PROFILES[policy.provider] }
    : { ...DEFAULT_PROFILES["in-memory"] };

  // 2. Layer persisted profile from ConfigStore
  if (policy.configStore) {
    const persisted = await loadProfileFromStore(policy.configStore);
    if (persisted) {
      Object.assign(base, persisted);
    }
  }

  // 3. Layer legacy embedding fields
  if (policy.embeddingProvider) {
    base.embedding = policy.embeddingProvider;
  }
  if (policy.embeddingModel) {
    base.embeddingModel = policy.embeddingModel;
  }
  if (policy.embeddingDimensions !== undefined) {
    base.embeddingDimensions = policy.embeddingDimensions;
  }

  // 4. Layer explicit infrastructure overrides (highest priority)
  if (policy.infrastructure) {
    const infra = policy.infrastructure;
    if (infra.persistence) base.persistence = infra.persistence;
    if (infra.vectorStore) base.vectorStore = infra.vectorStore;
    if (infra.documentStorage) base.documentStorage = infra.documentStorage;
    if (infra.embedding) base.embedding = infra.embedding;
    if (infra.embeddingModel) base.embeddingModel = infra.embeddingModel;
    if (infra.embeddingDimensions !== undefined)
      base.embeddingDimensions = infra.embeddingDimensions;
  }

  return base;
}

async function loadProfileFromStore(
  store: ConfigStore,
): Promise<Partial<InfrastructureProfile> | null> {
  try {
    const has = await store.has(INFRA_PROFILE_KEY);
    if (!has) return null;
    const all = await store.loadAll();
    const raw = all[INFRA_PROFILE_KEY];
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
