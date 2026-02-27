import { Source } from "../../../domain/Source";
import { SourceId } from "../../../domain/SourceId";
import { SourceVersion } from "../../../domain/SourceVersion";
import type { SourceType } from "../../../domain/SourceType";

export interface SourceVersionDTO {
  version: number;
  contentHash: string;
  extractedAt: string;
}

export interface SourceDTO {
  id: string;
  name: string;
  type: string;
  uri: string;
  currentVersionIndex: number | null;
  versions: SourceVersionDTO[];
  registeredAt: string;
}

export function toDTO(source: Source): SourceDTO {
  return {
    id: source.id.value,
    name: source.name,
    type: source.type,
    uri: source.uri,
    currentVersionIndex: source.currentVersion?.version ?? null,
    versions: [...source.versions].map((v) => ({
      version: v.version,
      contentHash: v.contentHash,
      extractedAt: v.extractedAt.toISOString(),
    })),
    registeredAt: source.registeredAt.toISOString(),
  };
}

export function fromDTO(dto: SourceDTO): Source {
  if (dto.versions.length === 0) {
    return Source.reconstitute(
      SourceId.create(dto.id),
      dto.name,
      dto.type as SourceType,
      dto.uri,
      null,
      [],
      new Date(dto.registeredAt),
    );
  }

  const svList: SourceVersion[] = [];

  // Reconstitute version chain
  for (let i = 0; i < dto.versions.length; i++) {
    const vDto = dto.versions[i];
    if (i === 0) {
      svList.push(SourceVersion.initial(vDto.contentHash));
    } else {
      svList.push(svList[i - 1].next(vDto.contentHash));
    }
  }

  return Source.reconstitute(
    SourceId.create(dto.id),
    dto.name,
    dto.type as SourceType,
    dto.uri,
    svList[svList.length - 1],
    svList,
    new Date(dto.registeredAt),
  );
}
