import type { ListSources } from "../../contexts/source-ingestion/source/application/use-cases/ListSources";
import type { GetSource } from "../../contexts/source-ingestion/source/application/use-cases/GetSource";
import type { GetExtractedText } from "../../contexts/source-ingestion/source/application/use-cases/GetExtractedText";
import type { CreateProcessingProfile } from "../../contexts/semantic-processing/processing-profile/application/use-cases/CreateProcessingProfile";
import type { UpdateProcessingProfile } from "../../contexts/semantic-processing/processing-profile/application/use-cases/UpdateProcessingProfile";
import type { DeprecateProcessingProfile } from "../../contexts/semantic-processing/processing-profile/application/use-cases/DeprecateProcessingProfile";
import type { ListProcessingProfiles } from "../../contexts/semantic-processing/processing-profile/application/use-cases/ListProcessingProfiles";
import type { GetProcessingProfile } from "../../contexts/semantic-processing/processing-profile/application/use-cases/GetProcessingProfile";
import type { CreateContext } from "../../contexts/context-management/context/application/use-cases/CreateContext";
import type { GetContext } from "../../contexts/context-management/context/application/use-cases/GetContext";
import type { ListContexts } from "../../contexts/context-management/context/application/use-cases/ListContexts";
import type { GetContextsForSource } from "../../contexts/context-management/context/application/use-cases/GetContextsForSource";
import type { AddSourceToContext } from "../../contexts/context-management/context/application/use-cases/AddSourceToContext";
import type { RemoveSourceFromContext } from "../../contexts/context-management/context/application/use-cases/RemoveSourceFromContext";
import type { TransitionContextState } from "../../contexts/context-management/context/application/use-cases/TransitionContextState";
import type { UpdateContextProfile } from "../../contexts/context-management/context/application/use-cases/UpdateContextProfile";
import type { GetContextDetails } from "../../contexts/context-management/context/application/use-cases/GetContextDetails";
import type { ListContextsSummary } from "../../contexts/context-management/context/application/use-cases/ListContextsSummary";
import type { ReconcileProjections as ReconcileProjectionsCM } from "../../contexts/context-management/context/application/use-cases/ReconcileProjections";
import type { ReconcileAllProfiles } from "../../contexts/context-management/context/application/use-cases/ReconcileAllProfiles";
import type { LinkContexts } from "../../contexts/context-management/lineage/application/use-cases/LinkContexts";
import type { UnlinkContexts } from "../../contexts/context-management/lineage/application/use-cases/UnlinkContexts";
import type { GetLineage } from "../../contexts/context-management/lineage/application/use-cases/GetLineage";
import type { ProcessSourceAllProfiles } from "../../contexts/semantic-processing/projection/application/use-cases/ProcessSourceAllProfiles";
import type { SearchKnowledge } from "../../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge";
import type {
  ProcessKnowledgeInput,
  ProcessKnowledgeSuccess,
  SearchKnowledgeInput,
  SearchKnowledgeSuccess,
  CreateProcessingProfileInput,
  CreateProcessingProfileSuccess,
  ListProfilesResult,
  UpdateProfileInput,
  UpdateProfileResult,
  DeprecateProfileInput,
  DeprecateProfileResult,
  GetContextDetailsInput,
  GetContextDetailsResult,
  ListContextsSummaryResult,
  ListSourcesResult,
  ListContextsResult,
  GetSourceInput,
  GetSourceResult,
  GetSourceContextsInput,
  GetSourceContextsResult,
  RemoveSourceInput,
  RemoveSourceResult,
  ReconcileProjectionsInput,
  ReconcileProjectionsResult,
  ReconcileAllProfilesInput,
  ReconcileAllProfilesResult,
  ProcessSourceAllProfilesInput,
  ProcessSourceAllProfilesResult,
  LinkContextsInput,
  LinkContextsResult,
  UnlinkContextsInput,
  UnlinkContextsResult,
  CreateContextInput,
  CreateContextResult,
  GetContextLineageInput,
  GetContextLineageResult,
  UpdateContextProfileInput,
  UpdateContextProfileResult,
  TransitionContextStateInput,
  TransitionContextStateResult,
} from "./dtos";
import { Result } from "../../shared/domain/Result";
import { KnowledgeError } from "./domain/KnowledgeError";
import { OperationStep } from "./domain/OperationStep";
import { ProcessKnowledge } from "./ProcessKnowledge";

export interface ResolvedDependencies {
  // Source Ingestion use cases (replacing SourceIngestionService)
  listSources: ListSources;
  getSource: GetSource;
  getExtractedText: GetExtractedText;
  // Semantic Processing use cases (replacing SemanticProcessingService)
  createProcessingProfile: CreateProcessingProfile;
  updateProcessingProfile: UpdateProcessingProfile;
  deprecateProcessingProfile: DeprecateProcessingProfile;
  listProcessingProfiles: ListProcessingProfiles;
  getProcessingProfile: GetProcessingProfile;
  processKnowledge: ProcessKnowledge;
  getContextDetails: GetContextDetails;
  listContextsSummary: ListContextsSummary;
  reconcileProjections: ReconcileProjectionsCM;
  reconcileAllProfiles: ReconcileAllProfiles;
  processSourceAllProfiles: ProcessSourceAllProfiles;
  searchKnowledge: SearchKnowledge;
  // Context use cases
  createContext: CreateContext;
  getContext: GetContext;
  listContexts: ListContexts;
  getContextsForSource: GetContextsForSource;
  addSourceToContext: AddSourceToContext;
  removeSourceFromContext: RemoveSourceFromContext;
  transitionContextState: TransitionContextState;
  updateContextProfile: UpdateContextProfile;
  // Lineage use cases
  linkContexts: LinkContexts;
  unlinkContexts: UnlinkContexts;
  getLineage: GetLineage;
}

// ── Coordinator ─────────────────────────────────────────────────────

/**
 * KnowledgeCoordinator — the single public entry point for all knowledge operations.
 *
 * Coordinates all 4 bounded contexts into a unified flat API:
 * - createContext, getContext, listContexts, listContextRefs, transitionContextState,
 *   updateContextProfile, reconcileProjections, reconcileAllProfiles,
 *   removeSourceFromContext, linkContexts, unlinkContexts, getContextLineage
 * - listSources, getSource, getSourceContexts, processSourceAllProfiles
 * - createProfile, listProfiles, updateProfile, deprecateProfile
 * - process()   — onboarding pipeline
 * - search()    — semantic query
 */
export class KnowledgeCoordinator {
  // Source Ingestion use cases
  private readonly _listSources: ListSources;
  private readonly _getSource: GetSource;
  private readonly _getExtractedText: GetExtractedText;
  // Semantic Processing use cases
  private readonly _createProcessingProfile: CreateProcessingProfile;
  private readonly _updateProcessingProfile: UpdateProcessingProfile;
  private readonly _deprecateProcessingProfile: DeprecateProcessingProfile;
  private readonly _listProcessingProfiles: ListProcessingProfiles;
  private readonly _getProcessingProfile: GetProcessingProfile;
  private readonly _processKnowledge: ProcessKnowledge;
  private readonly _getContextDetails: GetContextDetails;
  private readonly _listContextsSummary: ListContextsSummary;
  private readonly _reconcileProjections: ReconcileProjectionsCM;
  private readonly _reconcileAllProfiles: ReconcileAllProfiles;
  private readonly _processSourceAllProfiles: ProcessSourceAllProfiles;
  private readonly _searchKnowledge: SearchKnowledge;
  // Context use cases
  private readonly _createContext: CreateContext;
  private readonly _getContext: GetContext;
  private readonly _listContexts: ListContexts;
  private readonly _getContextsForSource: GetContextsForSource;
  private readonly _addSourceToContext: AddSourceToContext;
  private readonly _removeSourceFromContext: RemoveSourceFromContext;
  private readonly _transitionContextState: TransitionContextState;
  private readonly _updateContextProfile: UpdateContextProfile;
  // Lineage use cases
  private readonly _linkContexts: LinkContexts;
  private readonly _unlinkContexts: UnlinkContexts;
  private readonly _getLineage: GetLineage;

  constructor(deps: ResolvedDependencies) {
    this._listSources = deps.listSources;
    this._getSource = deps.getSource;
    this._getExtractedText = deps.getExtractedText;
    this._createProcessingProfile = deps.createProcessingProfile;
    this._updateProcessingProfile = deps.updateProcessingProfile;
    this._deprecateProcessingProfile = deps.deprecateProcessingProfile;
    this._listProcessingProfiles = deps.listProcessingProfiles;
    this._getProcessingProfile = deps.getProcessingProfile;
    this._processKnowledge = deps.processKnowledge;
    this._getContextDetails = deps.getContextDetails;
    this._listContextsSummary = deps.listContextsSummary;
    this._reconcileProjections = deps.reconcileProjections;
    this._reconcileAllProfiles = deps.reconcileAllProfiles;
    this._processSourceAllProfiles = deps.processSourceAllProfiles;
    this._searchKnowledge = deps.searchKnowledge;
    this._createContext = deps.createContext;
    this._getContext = deps.getContext;
    this._listContexts = deps.listContexts;
    this._getContextsForSource = deps.getContextsForSource;
    this._addSourceToContext = deps.addSourceToContext;
    this._removeSourceFromContext = deps.removeSourceFromContext;
    this._transitionContextState = deps.transitionContextState;
    this._updateContextProfile = deps.updateContextProfile;
    this._linkContexts = deps.linkContexts;
    this._unlinkContexts = deps.unlinkContexts;
    this._getLineage = deps.getLineage;
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private async _query<T>(
    step: OperationStep,
    fn: () => Promise<T>,
  ): Promise<Result<KnowledgeError, T>> {
    try {
      return Result.ok(await fn());
    } catch (error) {
      return Result.fail(KnowledgeError.fromStep(step, error, []));
    }
  }

  private async _wrap<T, R>(
    step: OperationStep,
    fn: () => Promise<Result<any, T>>,
    map: (v: T) => R,
  ): Promise<Result<KnowledgeError, R>> {
    try {
      const result = await fn();
      if (result.isFail()) return Result.fail(KnowledgeError.fromStep(step, result.error, []));
      return Result.ok(map(result.value));
    } catch (error) {
      return Result.fail(KnowledgeError.fromStep(step, error, []));
    }
  }

  // ── Top-level (cross-cutting) ─────────────────────────────────────

  process(
    input: ProcessKnowledgeInput,
  ): Promise<Result<KnowledgeError, ProcessKnowledgeSuccess>> {
    return this._processKnowledge.execute(input);
  }

  search(
    input: SearchKnowledgeInput,
  ): Promise<Result<KnowledgeError, SearchKnowledgeSuccess>> {
    return this._searchKnowledge.execute(input);
  }

  // ── Contexts ──────────────────────────────────────────────────────

  async createContext(
    input: CreateContextInput,
  ): Promise<Result<KnowledgeError, CreateContextResult>> {
    try {
      const createResult = await this._createContext.execute({
        id: input.id,
        name: input.name,
        description: input.description,
        language: input.language,
        requiredProfileId: input.requiredProfileId,
        createdBy: input.createdBy,
        tags: input.tags,
        attributes: input.attributes,
      });

      if (createResult.isFail()) {
        return Result.fail(
          KnowledgeError.fromStep(OperationStep.CreateContext, createResult.error, []),
        );
      }

      // Auto-activate for low-friction UX (Draft → Active)
      const activateResult = await this._transitionContextState.execute({
        contextId: createResult.value.id.value,
        action: "activate",
      });

      if (activateResult.isFail()) {
        return Result.fail(
          KnowledgeError.fromStep(OperationStep.ActivateContext, activateResult.error, []),
        );
      }

      return Result.ok({
        contextId: activateResult.value.id.value,
        state: activateResult.value.state,
      });
    } catch (error) {
      return Result.fail(
        KnowledgeError.fromStep(OperationStep.CreateContext, error, []),
      );
    }
  }

  getContext(
    input: GetContextDetailsInput,
  ): Promise<Result<KnowledgeError, GetContextDetailsResult>> {
    return this._getContextDetails.execute(input);
  }

  listContexts(): Promise<Result<KnowledgeError, ListContextsSummaryResult>> {
    return this._listContextsSummary.execute();
  }

  listContextRefs(): Promise<Result<KnowledgeError, ListContextsResult>> {
    return this._query(OperationStep.Cataloging, async () => {
      const contexts = await this._listContexts.execute();
      return {
        contexts: contexts.map((c) => ({
          id: c.id.value,
          name: c.name,
          state: c.state,
          requiredProfileId: c.requiredProfileId,
        })),
        total: contexts.length,
      };
    });
  }

  transitionContextState(
    input: TransitionContextStateInput,
  ): Promise<Result<KnowledgeError, TransitionContextStateResult>> {
    return this._wrap(
      OperationStep.TransitionState,
      () => {
        switch (input.targetState) {
          case "ACTIVE":
            return this._transitionContextState.execute({ contextId: input.contextId, action: "activate" });
          case "DEPRECATED":
            return this._transitionContextState.execute({ contextId: input.contextId, action: "deprecate", reason: input.reason ?? "" });
          case "ARCHIVED":
            return this._transitionContextState.execute({ contextId: input.contextId, action: "archive" });
        }
      },
      (ctx) => ({ contextId: ctx.id.value, state: ctx.state }),
    );
  }

  async updateContextProfile(
    input: UpdateContextProfileInput,
  ): Promise<Result<KnowledgeError, UpdateContextProfileResult>> {
    try {
      const result = await this._updateContextProfile.execute({
        contextId: input.contextId,
        profileId: input.profileId,
      });

      if (result.isFail()) {
        return Result.fail(
          KnowledgeError.fromStep(OperationStep.UpdateContextProfile, result.error, []),
        );
      }

      const updatedContext = result.value;
      let reconciled: { processedCount: number; failedCount: number } | undefined;

      // Auto-reconcile projections if context has active sources
      if (updatedContext.activeSources.length > 0) {
        const reconcileResult = await this._reconcileProjections.execute({
          contextId: input.contextId,
          profileId: input.profileId,
        });

        if (reconcileResult.isOk()) {
          reconciled = {
            processedCount: reconcileResult.value.processedCount,
            failedCount: reconcileResult.value.failedCount,
          };
        }
      }

      return Result.ok({
        contextId: updatedContext.id.value,
        profileId: updatedContext.requiredProfileId,
        reconciled,
      });
    } catch (error) {
      return Result.fail(
        KnowledgeError.fromStep(OperationStep.UpdateContextProfile, error, []),
      );
    }
  }

  reconcileProjections(
    input: ReconcileProjectionsInput,
  ): Promise<Result<KnowledgeError, ReconcileProjectionsResult>> {
    return this._reconcileProjections.execute(input);
  }

  reconcileAllProfiles(
    input: ReconcileAllProfilesInput,
  ): Promise<Result<KnowledgeError, ReconcileAllProfilesResult>> {
    return this._reconcileAllProfiles.execute(input);
  }

  removeSourceFromContext(
    input: RemoveSourceInput,
  ): Promise<Result<KnowledgeError, RemoveSourceResult>> {
    return this._wrap(
      OperationStep.RemoveSource,
      () => this._removeSourceFromContext.execute({ contextId: input.contextId, sourceId: input.sourceId }),
      (ctx) => ({ contextId: ctx.id.value, version: ctx.currentVersion?.version ?? 0 }),
    );
  }

  linkContexts(
    input: LinkContextsInput,
  ): Promise<Result<KnowledgeError, LinkContextsResult>> {
    return this._wrap(
      OperationStep.Link,
      () => this._linkContexts.execute({ fromContextId: input.sourceContextId, toContextId: input.targetContextId, relationship: input.relationshipType }),
      (v) => ({ sourceContextId: v.fromContextId, targetContextId: v.toContextId }),
    );
  }

  unlinkContexts(
    input: UnlinkContextsInput,
  ): Promise<Result<KnowledgeError, UnlinkContextsResult>> {
    return this._wrap(
      OperationStep.Unlink,
      () => this._unlinkContexts.execute({ fromContextId: input.sourceContextId, toContextId: input.targetContextId }),
      (v) => ({ sourceContextId: v.fromContextId, targetContextId: v.toContextId }),
    );
  }

  getContextLineage(
    input: GetContextLineageInput,
  ): Promise<Result<KnowledgeError, GetContextLineageResult>> {
    return this._wrap(
      OperationStep.Link,
      () => this._getLineage.execute({ contextId: input.contextId }),
      (v) => ({
        contextId: v.contextId,
        traces: v.traces.map((t: any) => ({ ...t, createdAt: t.createdAt.toISOString() })),
      }),
    );
  }

  // ── Sources ──────────────────────────────────────────────────────

  listSources(): Promise<Result<KnowledgeError, ListSourcesResult>> {
    return this._query(OperationStep.Ingestion, async () => {
      const sources = await this._listSources.execute();
      return {
        sources: sources.map((s) => ({
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
    });
  }

  getSource(
    input: GetSourceInput,
  ): Promise<Result<KnowledgeError, GetSourceResult>> {
    return this._query(OperationStep.Ingestion, async () => {
      const source = await this._getSource.execute({ sourceId: input.sourceId });
      if (!source) {
        throw { message: `Source ${input.sourceId} not found`, code: "SOURCE_NOT_FOUND" };
      }

      let extractedTextPreview: string | null = null;
      const textResult = await this._getExtractedText.execute({ sourceId: input.sourceId });
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
          versions: source.versions.map((v) => ({
            version: v.version,
            contentHash: v.contentHash,
            extractedAt: v.extractedAt.toISOString(),
          })),
          extractedTextPreview,
        },
      };
    });
  }

  getSourceContexts(
    input: GetSourceContextsInput,
  ): Promise<Result<KnowledgeError, GetSourceContextsResult>> {
    return this._query(OperationStep.Cataloging, async () => {
      const contexts = await this._getContextsForSource.execute({ sourceId: input.sourceId });
      return {
        sourceId: input.sourceId,
        contexts: contexts.map((c) => ({
          id: c.id.value,
          name: c.name,
          state: c.state,
          requiredProfileId: c.requiredProfileId,
        })),
      };
    });
  }

  processSourceAllProfiles(
    input: ProcessSourceAllProfilesInput,
  ): Promise<Result<KnowledgeError, ProcessSourceAllProfilesResult>> {
    return this._processSourceAllProfiles.execute(input);
  }

  // ── Profiles ──────────────────────────────────────────────────────

  createProfile(
    input: CreateProcessingProfileInput,
  ): Promise<Result<KnowledgeError, CreateProcessingProfileSuccess>> {
    return this._wrap(
      OperationStep.Processing,
      () => this._createProcessingProfile.execute({
        id: input.id,
        name: input.name,
        preparation: input.preparation,
        fragmentation: input.fragmentation,
        projection: input.projection,
      }),
      (v) => ({ profileId: v.profileId, version: v.version }),
    );
  }

  listProfiles(): Promise<Result<KnowledgeError, ListProfilesResult>> {
    return this._query(OperationStep.Processing, async () => {
      const profiles = await this._listProcessingProfiles.execute();
      return {
        profiles: profiles.map((p) => ({
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
    });
  }

  updateProfile(
    input: UpdateProfileInput,
  ): Promise<Result<KnowledgeError, UpdateProfileResult>> {
    return this._wrap(
      OperationStep.Processing,
      () => this._updateProcessingProfile.execute({
        id: input.id,
        name: input.name,
        preparation: input.preparation,
        fragmentation: input.fragmentation,
        projection: input.projection,
      }),
      (v) => ({ profileId: v.profileId, version: v.version }),
    );
  }

  deprecateProfile(
    input: DeprecateProfileInput,
  ): Promise<Result<KnowledgeError, DeprecateProfileResult>> {
    return this._wrap(
      OperationStep.Processing,
      () => this._deprecateProcessingProfile.execute({
        id: input.id,
        reason: input.reason,
      }),
      (v) => ({ profileId: v.profileId }),
    );
  }
}
