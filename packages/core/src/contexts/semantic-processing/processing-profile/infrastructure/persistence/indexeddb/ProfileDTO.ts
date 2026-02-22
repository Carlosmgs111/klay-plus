import { ProcessingProfile } from "../../../domain/ProcessingProfile.js";
import { ProcessingProfileId } from "../../../domain/ProcessingProfileId.js";
import type { ProfileStatus } from "../../../domain/ProfileStatus.js";

export interface ProfileDTO {
  id: string;
  name: string;
  version: number;
  chunkingStrategyId: string;
  embeddingStrategyId: string;
  configuration: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export function toDTO(profile: ProcessingProfile): ProfileDTO {
  return {
    id: profile.id.value,
    name: profile.name,
    version: profile.version,
    chunkingStrategyId: profile.chunkingStrategyId,
    embeddingStrategyId: profile.embeddingStrategyId,
    configuration: { ...profile.configuration },
    status: profile.status,
    createdAt: profile.createdAt.toISOString(),
  };
}

export function fromDTO(dto: ProfileDTO): ProcessingProfile {
  return ProcessingProfile.reconstitute(
    ProcessingProfileId.create(dto.id),
    dto.name,
    dto.version,
    dto.chunkingStrategyId,
    dto.embeddingStrategyId,
    dto.configuration,
    dto.status as ProfileStatus,
    new Date(dto.createdAt),
  );
}
