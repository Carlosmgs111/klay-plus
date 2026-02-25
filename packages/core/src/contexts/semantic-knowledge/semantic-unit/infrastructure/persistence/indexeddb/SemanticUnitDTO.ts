import { SemanticUnit } from "../../../domain/SemanticUnit.js";
import { SemanticUnitId } from "../../../domain/SemanticUnitId.js";
import { UnitSource } from "../../../domain/UnitSource.js";
import { UnitVersion } from "../../../domain/UnitVersion.js";
import { VersionSourceSnapshot } from "../../../domain/VersionSourceSnapshot.js";
import { UnitMetadata } from "../../../domain/UnitMetadata.js";
import type { SemanticState } from "../../../domain/SemanticState.js";

export interface SemanticUnitDTO {
  id: string;
  name: string;
  description: string;
  language: string;
  state: string;
  sources: Array<{
    sourceId: string;
    sourceType: string;
    resourceId?: string;
    extractedContent: string;
    contentHash: string;
    addedAt: string;
  }>;
  versions: Array<{
    version: number;
    processingProfileId: string;
    processingProfileVersion: number;
    sourceSnapshots: Array<{
      sourceId: string;
      contentHash: string;
      projectionIds: string[];
    }>;
    createdAt: string;
    reason: string;
  }>;
  currentVersionNumber: number | null;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    tags: string[];
    attributes: Record<string, string>;
  };
  // Legacy fields for backward compat
  origin?: unknown;
  origins?: unknown;
  currentVersionIndex?: number;
}

export function toDTO(unit: SemanticUnit): SemanticUnitDTO {
  return {
    id: unit.id.value,
    name: unit.name,
    description: unit.description,
    language: unit.language,
    state: unit.state,
    sources: [...unit.allSources].map((s) => ({
      sourceId: s.sourceId,
      sourceType: s.sourceType,
      resourceId: s.resourceId,
      extractedContent: s.extractedContent,
      contentHash: s.contentHash,
      addedAt: s.addedAt.toISOString(),
    })),
    versions: [...unit.versions].map((v) => ({
      version: v.version,
      processingProfileId: v.processingProfileId,
      processingProfileVersion: v.processingProfileVersion,
      sourceSnapshots: [...v.sourceSnapshots].map((ss) => ({
        sourceId: ss.sourceId,
        contentHash: ss.contentHash,
        projectionIds: [...ss.projectionIds],
      })),
      createdAt: v.createdAt.toISOString(),
      reason: v.reason,
    })),
    currentVersionNumber: unit.currentVersion?.version ?? null,
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
  // Detect legacy format: has `origins` array and old `versions` format with `meaning` objects
  const isLegacy = !dto.sources && ((dto as any).origins?.length > 0 || (dto as any).origin);

  if (isLegacy) {
    return fromLegacyDTO(dto);
  }

  return fromNewDTO(dto);
}

function fromNewDTO(dto: SemanticUnitDTO): SemanticUnit {
  const sources = dto.sources.map((s) =>
    UnitSource.reconstitute(
      s.sourceId,
      s.sourceType,
      s.extractedContent,
      s.contentHash,
      new Date(s.addedAt),
      s.resourceId,
    ),
  );

  const versions = dto.versions.map((v) => {
    const snapshots = v.sourceSnapshots.map((ss) =>
      VersionSourceSnapshot.create(ss.sourceId, ss.contentHash, ss.projectionIds),
    );
    return UnitVersion.reconstitute(
      v.version,
      v.processingProfileId,
      v.processingProfileVersion,
      snapshots,
      new Date(v.createdAt),
      v.reason,
    );
  });

  const metadata = UnitMetadata.create(
    dto.metadata.createdBy,
    dto.metadata.tags,
    dto.metadata.attributes,
  );

  return SemanticUnit.reconstitute(
    SemanticUnitId.create(dto.id),
    dto.name,
    dto.description,
    dto.language,
    dto.state as SemanticState,
    sources,
    versions,
    dto.currentVersionNumber,
    metadata,
  );
}

function fromLegacyDTO(dto: SemanticUnitDTO): SemanticUnit {
  // Extract origins from legacy format
  const legacyOrigins: Array<{
    sourceId: string;
    extractedAt: string;
    sourceType: string;
    resourceId?: string;
  }> =
    (dto as any).origins?.length > 0
      ? (dto as any).origins
      : (dto as any).origin
        ? [(dto as any).origin]
        : [];

  // Extract legacy versions (with meaning objects)
  const legacyVersions: Array<{
    version: number;
    meaning: { content: string; summary: string | null; language: string; topics: string[] };
    createdAt: string;
    reason: string;
  }> = (dto as any).versions ?? [];

  // Extract name, description, language from first version's meaning
  const firstMeaning = legacyVersions.length > 0 ? legacyVersions[0].meaning : null;
  const name = firstMeaning
    ? firstMeaning.content.substring(0, 50).trim() || "Migrated Unit"
    : "Migrated Unit";
  const description = firstMeaning?.summary ?? "";
  const language = firstMeaning?.language ?? "en";

  // Convert each legacy origin to a UnitSource
  const sources = legacyOrigins.map((o) =>
    UnitSource.reconstitute(
      o.sourceId,
      o.sourceType,
      firstMeaning?.content ?? "",
      "legacy-hash",
      new Date(o.extractedAt),
      o.resourceId,
    ),
  );

  // Create UnitVersion objects from old versions (with empty sourceSnapshots since legacy data has no snapshot info)
  const versions = legacyVersions.map((v) =>
    UnitVersion.reconstitute(
      v.version,
      "legacy-profile",
      1,
      [],
      new Date(v.createdAt),
      v.reason,
    ),
  );

  const currentVersionNumber =
    dto.currentVersionIndex !== undefined && dto.currentVersionIndex !== null
      ? dto.currentVersionIndex
      : versions.length > 0
        ? versions[versions.length - 1].version
        : null;

  const metadata = UnitMetadata.create(
    dto.metadata.createdBy,
    dto.metadata.tags,
    dto.metadata.attributes,
  );

  return SemanticUnit.reconstitute(
    SemanticUnitId.create(dto.id),
    name,
    description,
    language,
    dto.state as SemanticState,
    sources,
    versions,
    currentVersionNumber,
    metadata,
  );
}
