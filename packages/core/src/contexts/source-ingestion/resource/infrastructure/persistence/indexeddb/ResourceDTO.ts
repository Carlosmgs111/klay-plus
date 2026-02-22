import { Resource } from "../../../domain/Resource.js";
import { ResourceId } from "../../../domain/ResourceId.js";
import { StorageLocation } from "../../../domain/StorageLocation.js";
import type { ResourceStatus } from "../../../domain/ResourceStatus.js";

export interface ResourceDTO {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  provider: string | null;
  storageUri: string | null;
  createdAt: string;
}

export function toDTO(resource: Resource): ResourceDTO {
  return {
    id: resource.id.value,
    originalName: resource.originalName,
    mimeType: resource.mimeType,
    size: resource.size,
    status: resource.status,
    provider: resource.provider,
    storageUri: resource.storageUri,
    createdAt: resource.createdAt.toISOString(),
  };
}

export function fromDTO(dto: ResourceDTO): Resource {
  const storageLocation = dto.provider && dto.storageUri
    ? StorageLocation.create(dto.provider, dto.storageUri)
    : null;

  return Resource.reconstitute(
    ResourceId.create(dto.id),
    dto.originalName,
    dto.mimeType,
    dto.size,
    dto.status as ResourceStatus,
    storageLocation,
    new Date(dto.createdAt),
  );
}
