export interface CreateProcessingProfileInput {
  id: string;
  name: string;
  preparation: { strategyId: string; config: Record<string, unknown> };
  fragmentation: { strategyId: string; config: Record<string, unknown> };
  projection: { strategyId: string; config: Record<string, unknown> };
}

export interface CreateProcessingProfileSuccess {
  profileId: string;
  version: number;
}

export interface ListProfilesResult {
  profiles: Array<{
    id: string;
    name: string;
    version: number;
    preparation: { strategyId: string; config: Record<string, unknown> };
    fragmentation: { strategyId: string; config: Record<string, unknown> };
    projection: { strategyId: string; config: Record<string, unknown> };
    status: string;
    createdAt: string;
  }>;
}

export interface UpdateProfileInput {
  id: string;
  name?: string;
  preparation?: { strategyId: string; config: Record<string, unknown> };
  fragmentation?: { strategyId: string; config: Record<string, unknown> };
  projection?: { strategyId: string; config: Record<string, unknown> };
}

export interface UpdateProfileResult {
  profileId: string;
  version: number;
}

export interface DeprecateProfileInput {
  id: string;
  reason: string;
}

export interface DeprecateProfileResult {
  profileId: string;
}

export interface ProcessSourceAllProfilesInput {
  sourceId: string;
}

export interface ProcessSourceAllProfilesResult {
  sourceId: string;
  profileResults: Array<{
    profileId: string;
    processedCount: number;
    failedCount: number;
  }>;
  totalProcessed: number;
  totalFailed: number;
}
