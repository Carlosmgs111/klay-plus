import { Context } from "../../../domain/Context";
import { ContextId } from "../../../domain/ContextId";
import { ContextSource } from "../../../domain/ContextSource";
import { ContextVersion } from "../../../domain/ContextVersion";
import { ContextMetadata } from "../../../domain/ContextMetadata";
import type { ContextState } from "../../../domain/ContextState";

export interface ContextDTO {
  id: string;
  name: string;
  description: string;
  language: string;
  requiredProfileId: string;
  state: string;
  sources: Array<{
    sourceId: string;
    sourceKnowledgeId?: string;
    projectionId?: string;
    addedAt: string;
  }>;
  versions: Array<{
    version: number;
    sourceIds: string[];
    reason: string;
    createdAt: string;
  }>;
  currentVersionNumber: number | null;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    tags: string[];
    attributes: Record<string, string>;
  };
}

export function toDTO(context: Context): ContextDTO {
  return {
    id: context.id.value,
    name: context.name,
    description: context.description,
    language: context.language,
    requiredProfileId: context.requiredProfileId,
    state: context.state,
    sources: [...context.allSources].map((s) => ({
      sourceId: s.sourceId,
      sourceKnowledgeId: s.sourceKnowledgeId,
      projectionId: s.projectionId,
      addedAt: s.addedAt.toISOString(),
    })),
    versions: [...context.versions].map((v) => ({
      version: v.version,
      sourceIds: [...v.sourceIds],
      reason: v.reason,
      createdAt: v.createdAt.toISOString(),
    })),
    currentVersionNumber: context.currentVersion?.version ?? null,
    metadata: {
      createdAt: context.metadata.createdAt.toISOString(),
      updatedAt: context.metadata.updatedAt.toISOString(),
      createdBy: context.metadata.createdBy,
      tags: [...context.metadata.tags],
      attributes: { ...context.metadata.attributes },
    },
  };
}

export function fromDTO(dto: ContextDTO): Context {
  const sources = dto.sources.map((s) =>
    ContextSource.reconstitute(s.sourceId, s.sourceKnowledgeId ?? `sk-${s.sourceId}`, new Date(s.addedAt), s.projectionId),
  );

  const versions = dto.versions.map((v) =>
    ContextVersion.reconstitute(v.version, [...v.sourceIds], v.reason, new Date(v.createdAt)),
  );

  const metadata = new ContextMetadata({
    createdAt: new Date(dto.metadata.createdAt),
    updatedAt: new Date(dto.metadata.updatedAt),
    createdBy: dto.metadata.createdBy,
    tags: [...dto.metadata.tags],
    attributes: { ...dto.metadata.attributes },
  });

  return Context.reconstitute(
    ContextId.create(dto.id),
    dto.name,
    dto.description,
    dto.language,
    dto.requiredProfileId,
    dto.state as ContextState,
    sources,
    versions,
    dto.currentVersionNumber,
    metadata,
  );
}
