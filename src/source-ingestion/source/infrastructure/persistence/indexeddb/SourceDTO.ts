import { Source } from "../../../domain/Source.js";
import { SourceId } from "../../../domain/SourceId.js";
import { SourceVersion } from "../../../domain/SourceVersion.js";
import type { SourceType } from "../../../domain/SourceType.js";

export interface SourceDTO {
  id: string;
  name: string;
  type: string;
  uri: string;
  currentVersionIndex: number;
  versions: Array<{
    version: number;
    rawContent: string;
    contentHash: string;
    extractedAt: string;
    sizeBytes: number;
  }>;
  registeredAt: string;
}

export function toDTO(source: Source): SourceDTO {
  return {
    id: source.id.value,
    name: source.name,
    type: source.type,
    uri: source.uri,
    currentVersionIndex: source.currentVersion.version,
    versions: [...source.versions].map((v) => ({
      version: v.version,
      rawContent: v.rawContent,
      contentHash: v.contentHash,
      extractedAt: v.extractedAt.toISOString(),
      sizeBytes: v.sizeBytes,
    })),
    registeredAt: source.registeredAt.toISOString(),
  };
}

export function fromDTO(dto: SourceDTO): Source {
  let currentSV = SourceVersion.initial(dto.versions[0].rawContent, dto.versions[0].contentHash);
  const svList: SourceVersion[] = [currentSV];

  for (let i = 1; i < dto.versions.length; i++) {
    currentSV = currentSV.next(dto.versions[i].rawContent, dto.versions[i].contentHash);
    svList.push(currentSV);
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
