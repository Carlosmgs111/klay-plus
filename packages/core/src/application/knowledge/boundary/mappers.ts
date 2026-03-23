import type {
  CreateProcessingProfileSuccess,
  ListProfilesResult,
  UpdateProfileResult,
  DeprecateProfileResult,
  ListSourcesResult,
  GetSourceResult,
  RemoveSourceResult,
  LinkContextsResult,
  UnlinkContextsResult,
  GetContextLineageResult,
  TransitionContextStateInput,
  TransitionContextStateResult,
} from "../dtos";
import type { SourceQueries } from "../../../contexts/source-ingestion/source/application/use-cases/SourceQueries";

// ── Source mappers ────────────────────────────────────────────────────

export function mapSourcesToDTO(sources: any[]): ListSourcesResult {
  return {
    sources: sources.map((s: any) => ({
      id: s.id.value,
      name: s.name,
      type: s.type,
      uri: s.uri,
      hasBeenExtracted: s.hasBeenExtracted,
      currentVersion: s.currentVersion?.version ?? null,
      registeredAt: s.registeredAt.toISOString(),
    })),
    total: sources.length,
  };
}

export async function mapSourceToDetailDTO(source: any, sourceQueries: SourceQueries): Promise<GetSourceResult> {
  let extractedTextPreview: string | null = null;
  const textResult = await sourceQueries.getExtractedText(source.id.value);
  if (textResult.isOk()) {
    const text = textResult.value.text;
    extractedTextPreview = text.length > 500 ? text.slice(0, 500) + "..." : text;
  }
  return {
    source: {
      id: source.id.value,
      name: source.name,
      type: source.type,
      uri: source.uri,
      hasBeenExtracted: source.hasBeenExtracted,
      currentVersion: source.currentVersion?.version ?? null,
      registeredAt: source.registeredAt.toISOString(),
      versions: source.versions.map((v: any) => ({
        version: v.version,
        contentHash: v.contentHash,
        extractedAt: v.extractedAt.toISOString(),
      })),
      extractedTextPreview,
    },
  };
}

// ── Profile mappers ──────────────────────────────────────────────────

export function mapProfilesToDTO(profiles: any[]): ListProfilesResult {
  return {
    profiles: profiles.map((p: any) => ({
      id: p.id.value,
      name: p.name,
      version: p.version,
      preparation: p.preparation.toDTO(),
      fragmentation: p.fragmentation.toDTO(),
      projection: p.projection.toDTO(),
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

export function mapCreateProfileResult(v: any): CreateProcessingProfileSuccess {
  return { profileId: v.profileId, version: v.version };
}

export function mapUpdateProfileResult(v: any): UpdateProfileResult {
  return { profileId: v.profileId, version: v.version };
}

export function mapDeprecateProfileResult(v: any): DeprecateProfileResult {
  return { profileId: v.profileId };
}

// ── Context mappers ──────────────────────────────────────────────────

export function mapTransitionResult(ctx: any): TransitionContextStateResult {
  return { contextId: ctx.id.value, state: ctx.state };
}

export function mapRemoveSourceResult(ctx: any): RemoveSourceResult {
  return { contextId: ctx.id.value, version: ctx.currentVersion?.version ?? 0 };
}

// ── Lineage mappers ──────────────────────────────────────────────────

export function mapLinkResult(v: any): LinkContextsResult {
  return { sourceContextId: v.fromContextId, targetContextId: v.toContextId };
}

export function mapUnlinkResult(v: any): UnlinkContextsResult {
  return { sourceContextId: v.fromContextId, targetContextId: v.toContextId };
}

export function mapLineageResult(v: any): GetContextLineageResult {
  return {
    contextId: v.contextId,
    traces: v.traces.map((t: any) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  };
}

// ── Input mappers ────────────────────────────────────────────────────

/**
 * Maps a TransitionContextStateInput (targetState: "ACTIVE"|"DEPRECATED"|"ARCHIVED")
 * to the use case input (action: "activate"|"deprecate"|"archive").
 */
export function mapTransitionInput(input: TransitionContextStateInput) {
  const actionMap = { ACTIVE: "activate", DEPRECATED: "deprecate", ARCHIVED: "archive" } as const;
  return {
    contextId: input.contextId,
    action: actionMap[input.targetState],
    ...(input.reason && { reason: input.reason }),
  };
}
