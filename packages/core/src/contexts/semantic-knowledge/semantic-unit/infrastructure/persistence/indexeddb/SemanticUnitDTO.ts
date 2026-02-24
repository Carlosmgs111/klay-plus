import { SemanticUnit } from "../../../domain/SemanticUnit.js";
import { SemanticUnitId } from "../../../domain/SemanticUnitId.js";
import { Origin } from "../../../domain/Origin.js";
import { Meaning } from "../../../domain/Meaning.js";
import { SemanticVersion } from "../../../domain/SemanticVersion.js";
import { UnitMetadata } from "../../../domain/UnitMetadata.js";
import type { SemanticState } from "../../../domain/SemanticState.js";

export interface SemanticUnitDTO {
  id: string;
  state: string;
  /** @deprecated Kept for backward-compat reading of old data. Use `origins`. */
  origin?: { sourceId: string; extractedAt: string; sourceType: string };
  origins: Array<{
    sourceId: string;
    extractedAt: string;
    sourceType: string;
    resourceId?: string;
  }>;
  currentVersionIndex: number;
  versions: Array<{
    version: number;
    meaning: { content: string; summary: string | null; language: string; topics: string[] };
    createdAt: string;
    reason: string;
  }>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    tags: string[];
    attributes: Record<string, string>;
  };
}

export function toDTO(unit: SemanticUnit): SemanticUnitDTO {
  return {
    id: unit.id.value,
    state: unit.state,
    origins: [...unit.origins].map((o) => ({
      sourceId: o.sourceId,
      extractedAt: o.extractedAt.toISOString(),
      sourceType: o.sourceType,
      resourceId: o.resourceId,
    })),
    origin: {
      sourceId: unit.primaryOrigin.sourceId,
      extractedAt: unit.primaryOrigin.extractedAt.toISOString(),
      sourceType: unit.primaryOrigin.sourceType,
    },
    currentVersionIndex: unit.currentVersion.version,
    versions: [...unit.versions].map((v) => ({
      version: v.version,
      meaning: {
        content: v.meaning.content,
        summary: v.meaning.summary,
        language: v.meaning.language,
        topics: [...v.meaning.topics],
      },
      createdAt: v.createdAt.toISOString(),
      reason: v.reason,
    })),
    metadata: {
      createdAt: unit.metadata.createdAt.toISOString(),
      updatedAt: unit.metadata.updatedAt.toISOString(),
      createdBy: unit.metadata.createdBy,
      tags: [...unit.metadata.tags],
      attributes: { ...unit.metadata.attributes },
    },
  };
}

export function fromDTO(dto: SemanticUnitDTO): SemanticUnit {
  // Backward compat: prefer `origins` array, fall back to single `origin`
  const originsData =
    dto.origins?.length > 0
      ? dto.origins
      : dto.origin
        ? [dto.origin]
        : [];

  const origins = originsData.map((o) =>
    Origin.create(o.sourceId, new Date(o.extractedAt), o.sourceType, o.resourceId),
  );

  const versions = dto.versions.map((v) => {
    const meaning = Meaning.create(v.meaning.content, v.meaning.language, v.meaning.topics, v.meaning.summary);
    return { version: v.version, meaning, createdAt: new Date(v.createdAt), reason: v.reason };
  });

  // Build SemanticVersion chain
  const firstMeaning = versions[0].meaning;
  let currentSV = SemanticVersion.initial(firstMeaning);
  const svList: SemanticVersion[] = [currentSV];

  for (let i = 1; i < versions.length; i++) {
    currentSV = currentSV.next(versions[i].meaning, versions[i].reason);
    svList.push(currentSV);
  }

  const currentVersion = svList[svList.length - 1];

  const metadata = UnitMetadata.create(dto.metadata.createdBy, dto.metadata.tags, dto.metadata.attributes);

  return SemanticUnit.reconstitute(
    SemanticUnitId.create(dto.id),
    dto.state as SemanticState,
    origins,
    currentVersion,
    svList,
    metadata,
  );
}
