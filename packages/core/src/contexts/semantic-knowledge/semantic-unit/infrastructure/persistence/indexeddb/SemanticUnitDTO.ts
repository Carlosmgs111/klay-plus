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
  origin: { sourceId: string; extractedAt: string; sourceType: string };
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
    origin: {
      sourceId: unit.origin.sourceId,
      extractedAt: unit.origin.extractedAt.toISOString(),
      sourceType: unit.origin.sourceType,
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
  const versions = dto.versions.map((v) => {
    const meaning = Meaning.create(v.meaning.content, v.meaning.language, v.meaning.topics, v.meaning.summary);
    // Use reconstitute-style: build SemanticVersion via initial + next chain
    return { version: v.version, meaning, createdAt: new Date(v.createdAt), reason: v.reason };
  });

  const origin = Origin.create(dto.origin.sourceId, new Date(dto.origin.extractedAt), dto.origin.sourceType);

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
    origin,
    currentVersion,
    svList,
    metadata,
  );
}
