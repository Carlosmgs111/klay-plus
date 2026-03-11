import { ProcessingProfile } from "../../../domain/ProcessingProfile";
import { ProcessingProfileId } from "../../../domain/ProcessingProfileId";
import { ProfileStatus } from "../../../domain/ProfileStatus";
import { PreparationLayer } from "../../../domain/value-objects/PreparationLayer";
import { FragmentationLayer } from "../../../domain/value-objects/FragmentationLayer";
import { ProjectionLayer } from "../../../domain/value-objects/ProjectionLayer";

export interface ProfileDTO {
  id: string;
  name: string;
  version: number;
  status: string;
  preparation: { strategyId: string; config: Record<string, unknown> };
  fragmentation: { strategyId: string; config: Record<string, unknown> };
  projection: { strategyId: string; config: Record<string, unknown> };
  createdAt: string;
  // Legacy fields (for migration detection):
  chunkingStrategyId?: string;
  embeddingStrategyId?: string;
  configuration?: Record<string, unknown>;
}

export function toDTO(profile: ProcessingProfile): ProfileDTO {
  return {
    id: profile.id.value,
    name: profile.name,
    version: profile.version,
    status: profile.status,
    preparation: profile.preparation.toDTO(),
    fragmentation: profile.fragmentation.toDTO(),
    projection: profile.projection.toDTO(),
    createdAt: profile.createdAt.toISOString(),
  };
}

export function fromDTO(dto: ProfileDTO): ProcessingProfile {
  // Legacy format detection
  if ("chunkingStrategyId" in dto && dto.chunkingStrategyId) {
    const strategyId = dto.chunkingStrategyId;
    const fragmentationConfig =
      strategyId === "sentence"
        ? { strategy: "sentence", maxChunkSize: 1000, minChunkSize: 100 }
        : strategyId === "fixed-size"
          ? { strategy: "fixed-size", chunkSize: 500, overlap: 50 }
          : { strategy: "recursive", chunkSize: 1000, overlap: 100 };

    return ProcessingProfile.reconstitute({
      id: ProcessingProfileId.create(dto.id),
      name: dto.name,
      version: dto.version,
      preparation: PreparationLayer.create("basic", {
        normalizeWhitespace: true,
        normalizeEncoding: true,
        trimContent: true,
      }),
      fragmentation: FragmentationLayer.create(strategyId, fragmentationConfig),
      projection: ProjectionLayer.create(dto.embeddingStrategyId!, {
        dimensions: 128,
        batchSize: 100,
      }),
      status: dto.status as ProfileStatus,
      createdAt: new Date(dto.createdAt),
    });
  }

  // New format
  return ProcessingProfile.reconstitute({
    id: ProcessingProfileId.create(dto.id),
    name: dto.name,
    version: dto.version,
    preparation: PreparationLayer.fromDTO(dto.preparation),
    fragmentation: FragmentationLayer.fromDTO(dto.fragmentation),
    projection: ProjectionLayer.fromDTO(dto.projection),
    status: dto.status as ProfileStatus,
    createdAt: new Date(dto.createdAt),
  });
}
