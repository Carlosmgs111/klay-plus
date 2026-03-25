/**
 * Knowledge Mappers — domain → DTO mapping for web consumers.
 *
 * These functions translate raw domain aggregates/values into the DTO shapes
 * that the KnowledgeService interface expects. Moved from core's boundary-helpers
 * because mapping is a consumer concern, not a domain concern.
 */

import type {
  ListSourcesResult,
  GetSourceResult,
  ListProfilesResult,
  CreateContextResult,
  TransitionContextStateResult,
  TransitionContextStateInput,
  RemoveSourceResult,
  UpdateContextProfileResult,
  LinkContextsResult,
  UnlinkContextsResult,
  GetContextLineageResult,
} from "@klay/core";

// ── Result mapper utility ───────────────────────────────────────────

/**
 * Maps the success value of a Result-like object without importing Result.
 * Returns the same object on failure (error passthrough).
 */
export function mapResult<T, U>(
  result: { isOk(): boolean; value: T; error: any },
  mapper: (v: T) => U,
): { isOk(): boolean; value: any; error: any } {
  if (!result.isOk()) return result;
  return { isOk: () => true, value: mapper(result.value), error: undefined };
}

// ── Heavy mappers (aggregate[] → DTO) ───────────────────────────────

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

export async function mapSourceToDetailDTO(source: any, sourceQueries: any): Promise<GetSourceResult> {
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

// ── Light mappers (domain value → DTO) ──────────────────────────────

export function mapCreateContextResult(ctx: any): CreateContextResult {
  return { contextId: ctx.id.value, state: ctx.state };
}

export function mapTransitionResult(ctx: any): TransitionContextStateResult {
  return { contextId: ctx.id.value, state: ctx.state };
}

export function mapRemoveSourceResult(ctx: any): RemoveSourceResult {
  return { contextId: ctx.id.value, version: ctx.currentVersion?.version ?? 0 };
}

export function mapUpdateContextProfileResult({ context, reconciled }: any): UpdateContextProfileResult {
  return {
    contextId: context.id.value,
    profileId: context.requiredProfileId,
    reconciled,
  };
}

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

// ── Input mappers ───────────────────────────────────────────────────

export function mapTransitionInput(input: TransitionContextStateInput) {
  const actionMap = { ACTIVE: "activate", DEPRECATED: "deprecate", ARCHIVED: "archive" } as const;
  return {
    contextId: input.contextId,
    action: actionMap[input.targetState],
    ...(input.reason && { reason: input.reason }),
  };
}

export function mapLinkInput(input: { sourceContextId: string; targetContextId: string; relationshipType: string }) {
  return {
    fromContextId: input.sourceContextId,
    toContextId: input.targetContextId,
    relationship: input.relationshipType,
  };
}

export function mapUnlinkInput(input: { sourceContextId: string; targetContextId: string }) {
  return {
    fromContextId: input.sourceContextId,
    toContextId: input.targetContextId,
  };
}
