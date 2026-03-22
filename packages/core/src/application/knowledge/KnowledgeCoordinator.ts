import type { SourceIngestionService } from "../../contexts/source-ingestion/service/SourceIngestionService";
import type { SemanticProcessingService } from "../../contexts/semantic-processing/service/SemanticProcessingService";
import type { ContextManagementService } from "../../contexts/context-management/service/ContextManagementService";
import type { KnowledgeRetrievalService } from "../../contexts/knowledge-retrieval/service/KnowledgeRetrievalService";
import type { ResolvedSemanticQueryInfra } from "../../contexts/knowledge-retrieval/semantic-query/composition/factory";
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
  ContextSourceDetailDTO,
  ProjectionSummaryDTO,
} from "./dtos";
import { Result } from "../../shared/domain/Result";
import { KnowledgeError } from "./domain/KnowledgeError";
import { OperationStep } from "./domain/OperationStep";
import { ProcessKnowledge } from "./ProcessKnowledge";
import { ReconcileProjections } from "./ReconcileProjections";

export interface ResolvedDependencies {
  ingestion: SourceIngestionService;
  processing: SemanticProcessingService;
  contextManagement: ContextManagementService;
  retrieval: KnowledgeRetrievalService;
  retrievalInfra: ResolvedSemanticQueryInfra;
}

// ── Namespace interfaces ────────────────────────────────────────────

export interface ContextOperations {
  create(input: CreateContextInput): Promise<Result<KnowledgeError, CreateContextResult>>;
  get(input: GetContextDetailsInput): Promise<Result<KnowledgeError, GetContextDetailsResult>>;
  list(): Promise<Result<KnowledgeError, ListContextsSummaryResult>>;
  listRefs(): Promise<Result<KnowledgeError, ListContextsResult>>;
  transitionState(input: TransitionContextStateInput): Promise<Result<KnowledgeError, TransitionContextStateResult>>;
  updateProfile(input: UpdateContextProfileInput): Promise<Result<KnowledgeError, UpdateContextProfileResult>>;
  reconcileProjections(input: ReconcileProjectionsInput): Promise<Result<KnowledgeError, ReconcileProjectionsResult>>;
  reconcileAllProfiles(input: ReconcileAllProfilesInput): Promise<Result<KnowledgeError, ReconcileAllProfilesResult>>;
  removeSource(input: RemoveSourceInput): Promise<Result<KnowledgeError, RemoveSourceResult>>;
  link(input: LinkContextsInput): Promise<Result<KnowledgeError, LinkContextsResult>>;
  unlink(input: UnlinkContextsInput): Promise<Result<KnowledgeError, UnlinkContextsResult>>;
  getLineage(input: GetContextLineageInput): Promise<Result<KnowledgeError, GetContextLineageResult>>;
}

export interface SourceOperations {
  list(): Promise<Result<KnowledgeError, ListSourcesResult>>;
  get(input: GetSourceInput): Promise<Result<KnowledgeError, GetSourceResult>>;
  getContexts(input: GetSourceContextsInput): Promise<Result<KnowledgeError, GetSourceContextsResult>>;
  processAllProfiles(input: ProcessSourceAllProfilesInput): Promise<Result<KnowledgeError, ProcessSourceAllProfilesResult>>;
}

export interface ProfileOperations {
  create(input: CreateProcessingProfileInput): Promise<Result<KnowledgeError, CreateProcessingProfileSuccess>>;
  list(): Promise<Result<KnowledgeError, ListProfilesResult>>;
  update(input: UpdateProfileInput): Promise<Result<KnowledgeError, UpdateProfileResult>>;
  deprecate(input: DeprecateProfileInput): Promise<Result<KnowledgeError, DeprecateProfileResult>>;
}

// ── Coordinator ─────────────────────────────────────────────────────

/**
 * KnowledgeCoordinator — the single public entry point for all knowledge operations.
 *
 * Coordinates all 4 bounded contexts into a unified API organized by resource:
 * - coordinator.contexts.*  — context lifecycle & queries
 * - coordinator.sources.*   — source library
 * - coordinator.profiles.*  — processing profiles
 * - coordinator.process()   — onboarding pipeline
 * - coordinator.search()    — semantic query
 */
export class KnowledgeCoordinator {
  private readonly _ingestion: SourceIngestionService;
  private readonly _processing: SemanticProcessingService;
  private readonly _contextManagement: ContextManagementService;
  private readonly _retrieval: KnowledgeRetrievalService;
  private readonly _retrievalInfra: ResolvedSemanticQueryInfra;
  private readonly _processKnowledge: ProcessKnowledge;
  private readonly _reconcileProjections: ReconcileProjections;

  readonly contexts: ContextOperations;
  readonly sources: SourceOperations;
  readonly profiles: ProfileOperations;

  constructor(deps: ResolvedDependencies) {
    this._ingestion = deps.ingestion;
    this._processing = deps.processing;
    this._contextManagement = deps.contextManagement;
    this._retrieval = deps.retrieval;
    this._retrievalInfra = deps.retrievalInfra;

    this._processKnowledge = new ProcessKnowledge({
      ingestion: deps.ingestion,
      processing: deps.processing,
      contextManagement: deps.contextManagement,
    });
    this._reconcileProjections = new ReconcileProjections({
      contextManagement: deps.contextManagement,
      processing: deps.processing,
      ingestion: deps.ingestion,
    });

    this.contexts = {
      create: (input) => this._createContext(input),
      get: (input) => this._getContextDetails(input),
      list: () => this._listContextsSummary(),
      listRefs: () => this._listContexts(),
      transitionState: (input) => this._transitionContextState(input),
      updateProfile: (input) => this._updateContextProfile(input),
      reconcileProjections: (input) => this._reconcileProjectionsImpl(input),
      reconcileAllProfiles: (input) => this._reconcileAllProfilesImpl(input),
      removeSource: (input) => this._removeSource(input),
      link: (input) => this._linkContexts(input),
      unlink: (input) => this._unlinkContexts(input),
      getLineage: (input) => this._getContextLineage(input),
    };

    this.sources = {
      list: () => this._listSources(),
      get: (input) => this._getSource(input),
      getContexts: (input) => this._getSourceContexts(input),
      processAllProfiles: (input) => this._processSourceAllProfilesImpl(input),
    };

    this.profiles = {
      create: (input) => this._createProcessingProfile(input),
      list: () => this._listProfiles(),
      update: (input) => this._updateProfile(input),
      deprecate: (input) => this._deprecateProfile(input),
    };
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

  async search(
    input: SearchKnowledgeInput,
  ): Promise<Result<KnowledgeError, SearchKnowledgeSuccess>> {
    try {
      let contextSourceIds: Set<string> | null = null;
      let vectorFilters = input.filters;

      if (input.filters?.contextId) {
        const contextId = input.filters.contextId as string;
        const context = await this._contextManagement.getContext(contextId);
        if (context) {
          contextSourceIds = new Set(
            context.activeSources.map((s) => s.sourceId),
          );
        }
        const { contextId: _, ...rest } = input.filters;
        vectorFilters = Object.keys(rest).length > 0 ? rest : undefined;
      }

      const fetchTopK = contextSourceIds
        ? (input.topK ?? 10) * 3
        : input.topK;

      const override = input.retrievalOverride;
      const useOverridePath = override && override.ranking !== "passthrough";

      let result: import("../../contexts/knowledge-retrieval/semantic-query/domain/RetrievalResult").RetrievalResult;

      if (useOverridePath) {
        // Build a one-shot ExecuteSemanticQuery with the override ranking strategy
        const { ExecuteSemanticQuery } = await import(
          "../../contexts/knowledge-retrieval/semantic-query/application/ExecuteSemanticQuery"
        );

        let rankingStrategy: import("../../contexts/knowledge-retrieval/semantic-query/domain/ports/RankingStrategy").RankingStrategy;

        if (override.ranking === "mmr") {
          const { MMRRankingStrategy } = await import(
            "../../contexts/knowledge-retrieval/semantic-query/infrastructure/ranking/MMRRankingStrategy"
          );
          rankingStrategy = new MMRRankingStrategy(override.mmrLambda ?? 0.5);
        } else if (override.ranking === "cross-encoder") {
          const { CrossEncoderRankingStrategy } = await import(
            "../../contexts/knowledge-retrieval/semantic-query/infrastructure/ranking/CrossEncoderRankingStrategy"
          );
          rankingStrategy = new CrossEncoderRankingStrategy(
            override.crossEncoderModel ?? "cross-encoder/ms-marco-MiniLM-L-6-v2",
          );
        } else {
          const { PassthroughRankingStrategy } = await import(
            "../../contexts/knowledge-retrieval/semantic-query/infrastructure/ranking/PassthroughRankingStrategy"
          );
          rankingStrategy = new PassthroughRankingStrategy();
        }

        const executor = new ExecuteSemanticQuery(
          this._retrievalInfra.queryEmbedder,
          this._retrievalInfra.searchStrategy,
          rankingStrategy,
        );

        result = await executor.execute({
          text: input.queryText,
          topK: fetchTopK,
          minScore: input.minScore,
          filters: vectorFilters,
        });
      } else {
        result = await this._retrieval.query({
          text: input.queryText,
          topK: fetchTopK,
          minScore: input.minScore,
          filters: vectorFilters,
        });
      }

      let items = result.items.map((item) => ({
        sourceId: item.sourceId,
        content: item.content,
        score: item.score,
        metadata: item.metadata as Record<string, unknown>,
      }));

      if (contextSourceIds) {
        items = items.filter((item) => contextSourceIds!.has(item.sourceId));
      }

      const topK = input.topK ?? 10;
      items = items.slice(0, topK);

      return Result.ok({
        queryText: result.queryText,
        items,
        totalFound: items.length,
      });
    } catch (error) {
      return Result.fail(
        KnowledgeError.fromStep(OperationStep.Search, error, []),
      );
    }
  }

  // ── Profiles (private) ────────────────────────────────────────────

  private _createProcessingProfile(
    input: CreateProcessingProfileInput,
  ): Promise<Result<KnowledgeError, CreateProcessingProfileSuccess>> {
    return this._wrap(
      OperationStep.Processing,
      () => this._processing.createProcessingProfile({
        id: input.id,
        name: input.name,
        preparation: input.preparation,
        fragmentation: input.fragmentation,
        projection: input.projection,
      }),
      (v) => ({ profileId: v.profileId, version: v.version }),
    );
  }

  private async _listProfiles(): Promise<Result<KnowledgeError, ListProfilesResult>> {
    return this._query(OperationStep.Processing, async () => {
      const profiles = await this._processing.listProcessingProfiles();
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

  private _updateProfile(
    input: UpdateProfileInput,
  ): Promise<Result<KnowledgeError, UpdateProfileResult>> {
    return this._wrap(
      OperationStep.Processing,
      () => this._processing.updateProcessingProfile({
        id: input.id,
        name: input.name,
        preparation: input.preparation,
        fragmentation: input.fragmentation,
        projection: input.projection,
      }),
      (v) => ({ profileId: v.profileId, version: v.version }),
    );
  }

  private _deprecateProfile(
    input: DeprecateProfileInput,
  ): Promise<Result<KnowledgeError, DeprecateProfileResult>> {
    return this._wrap(
      OperationStep.Processing,
      () => this._processing.deprecateProcessingProfile({
        id: input.id,
        reason: input.reason,
      }),
      (v) => ({ profileId: v.profileId }),
    );
  }

  // ── Context Queries (private) ─────────────────────────────────────

  private async _getContextDetails(
    input: GetContextDetailsInput,
  ): Promise<Result<KnowledgeError, GetContextDetailsResult>> {
    return this._query(OperationStep.Cataloging, async () => {
      const context = await this._contextManagement.getContext(input.contextId);
      if (!context) {
        throw { message: `Context ${input.contextId} not found`, code: "CONTEXT_NOT_FOUND" };
      }

      const activeSourceIds = context.activeSources.map((s) => s.sourceId);
      const allProjections = activeSourceIds.length > 0
        ? await this._processing.getAllProjectionsForSources(activeSourceIds)
        : new Map<string, never[]>();

      const sources: ContextSourceDetailDTO[] = await Promise.all(
        context.activeSources.map(async (cs) => {
          const source = await this._ingestion.getSource(cs.sourceId);
          const sourceProjections = allProjections.get(cs.sourceId) ?? [];

          const projections: ProjectionSummaryDTO[] = sourceProjections.map((p) => ({
            projectionId: p.projectionId,
            processingProfileId: p.processingProfileId,
            chunksCount: p.chunksCount,
            dimensions: p.dimensions,
            model: p.model,
          }));

          // Backward compat: fields from projection matching requiredProfile
          const requiredProj = sourceProjections.find(
            (p) => p.processingProfileId === context.requiredProfileId,
          );

          return {
            sourceId: cs.sourceId,
            sourceName: source?.name ?? cs.sourceId,
            sourceType: source?.type ?? "unknown",
            projections,
            projectionId: requiredProj?.projectionId ?? cs.projectionId,
            chunksCount: requiredProj?.chunksCount,
            dimensions: requiredProj?.dimensions,
            model: requiredProj?.model,
            addedAt: cs.addedAt.toISOString(),
          };
        }),
      );

      const versions = context.versions.map((v) => ({
        version: v.version,
        sourceIds: [...v.sourceIds],
        reason: v.reason,
        createdAt: v.createdAt.toISOString(),
      }));

      // Status based on requiredProfile coverage (backward compat)
      const projectionCount = sources.filter((s) => s.projectionId).length;
      let status: "empty" | "partial" | "complete";
      if (sources.length === 0) status = "empty";
      else if (projectionCount === sources.length) status = "complete";
      else status = "partial";

      return {
        contextId: context.id.value,
        name: context.name,
        state: context.state,
        requiredProfileId: context.requiredProfileId,
        sources,
        versions,
        status,
      };
    });
  }

  private async _listContextsSummary(): Promise<Result<KnowledgeError, ListContextsSummaryResult>> {
    return this._query(OperationStep.Cataloging, async () => {
      const contexts = await this._contextManagement.listContexts();

      const summaries = await Promise.all(
        contexts.map(async (c) => {
          const activeSourceIds = c.activeSources.map((s) => s.sourceId);
          let projectionCount = 0;
          let requiredProfileCoverage = 0;

          if (activeSourceIds.length > 0) {
            const allProjections = await this._processing.getAllProjectionsForSources(activeSourceIds);
            for (const [, projs] of allProjections) {
              projectionCount += projs.length;
              if (projs.some((p) => p.processingProfileId === c.requiredProfileId)) {
                requiredProfileCoverage++;
              }
            }
          }

          const sourceCount = activeSourceIds.length;
          // Status based on requiredProfile coverage
          let status: "empty" | "partial" | "complete";
          if (sourceCount === 0) status = "empty";
          else if (requiredProfileCoverage === sourceCount) status = "complete";
          else status = "partial";

          return {
            id: c.id.value,
            name: c.name,
            state: c.state,
            sourceCount,
            projectionCount,
            requiredProfileId: c.requiredProfileId,
            status,
          };
        }),
      );

      return { contexts: summaries };
    });
  }

  // ── Source Library (private) ──────────────────────────────────────

  private async _listSources(): Promise<Result<KnowledgeError, ListSourcesResult>> {
    return this._query(OperationStep.Ingestion, async () => {
      const sources = await this._ingestion.listSources();
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

  private async _listContexts(): Promise<Result<KnowledgeError, ListContextsResult>> {
    return this._query(OperationStep.Cataloging, async () => {
      const contexts = await this._contextManagement.listContexts();
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

  private async _getSource(
    input: GetSourceInput,
  ): Promise<Result<KnowledgeError, GetSourceResult>> {
    return this._query(OperationStep.Ingestion, async () => {
      const source = await this._ingestion.getSource(input.sourceId);
      if (!source) {
        throw { message: `Source ${input.sourceId} not found`, code: "SOURCE_NOT_FOUND" };
      }

      let extractedTextPreview: string | null = null;
      const textResult = await this._ingestion.getExtractedText(input.sourceId);
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

  private async _getSourceContexts(
    input: GetSourceContextsInput,
  ): Promise<Result<KnowledgeError, GetSourceContextsResult>> {
    return this._query(OperationStep.Cataloging, async () => {
      const contexts = await this._contextManagement.getContextsForSource(input.sourceId);
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

  private async _processSourceAllProfilesImpl(
    input: ProcessSourceAllProfilesInput,
  ): Promise<Result<KnowledgeError, ProcessSourceAllProfilesResult>> {
    try {
      const source = await this._ingestion.getSource(input.sourceId);
      if (!source) {
        return Result.fail(
          KnowledgeError.fromStep(
            OperationStep.ProcessSourceAllProfiles,
            { message: `Source ${input.sourceId} not found`, code: "SOURCE_NOT_FOUND" },
            [],
          ),
        );
      }

      const textResult = await this._ingestion.getExtractedText(input.sourceId);
      if (textResult.isFail()) {
        return Result.fail(
          KnowledgeError.fromStep(
            OperationStep.ProcessSourceAllProfiles,
            { message: `No extracted text for source ${input.sourceId}`, code: "TEXT_NOT_FOUND" },
            [],
          ),
        );
      }

      const allProfiles = await this._processing.listProcessingProfiles();
      const activeProfiles = allProfiles.filter((p) => p.status === "ACTIVE");

      const profileResults: Array<{ profileId: string; processedCount: number; failedCount: number }> = [];

      for (const profile of activeProfiles) {
        const profileId = profile.id.value;
        try {
          const existing = await this._processing.findExistingProjection(input.sourceId, profileId);
          if (existing) {
            profileResults.push({ profileId, processedCount: 1, failedCount: 0 });
            continue;
          }

          const projectionId = crypto.randomUUID();
          const result = await this._processing.processContent({
            projectionId,
            sourceId: input.sourceId,
            content: textResult.value.text,
            type: "EMBEDDING" as any,
            processingProfileId: profileId,
          });

          profileResults.push(
            result.isOk()
              ? { profileId, processedCount: 1, failedCount: 0 }
              : { profileId, processedCount: 0, failedCount: 1 },
          );
        } catch {
          profileResults.push({ profileId, processedCount: 0, failedCount: 1 });
        }
      }

      return Result.ok({
        sourceId: input.sourceId,
        profileResults,
        totalProcessed: profileResults.reduce((s, r) => s + r.processedCount, 0),
        totalFailed: profileResults.reduce((s, r) => s + r.failedCount, 0),
      });
    } catch (error) {
      return Result.fail(KnowledgeError.fromStep(OperationStep.ProcessSourceAllProfiles, error, []));
    }
  }

  // ── Lifecycle (private) ──────────────────────────────────────────

  private _transitionContextState(
    input: TransitionContextStateInput,
  ): Promise<Result<KnowledgeError, TransitionContextStateResult>> {
    return this._wrap(
      OperationStep.TransitionState,
      () => {
        switch (input.targetState) {
          case "ACTIVE":
            return this._contextManagement.activateContext({ contextId: input.contextId });
          case "DEPRECATED":
            return this._contextManagement.deprecateContext({ contextId: input.contextId, reason: input.reason ?? "" });
          case "ARCHIVED":
            return this._contextManagement.archiveContext({ contextId: input.contextId });
        }
      },
      (ctx) => ({ contextId: ctx.id.value, state: ctx.state }),
    );
  }

  private async _createContext(
    input: CreateContextInput,
  ): Promise<Result<KnowledgeError, CreateContextResult>> {
    try {
      const createResult = await this._contextManagement.createContext({
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
      const activateResult = await this._contextManagement.activateContext({
        contextId: createResult.value.id.value,
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

  private _removeSource(
    input: RemoveSourceInput,
  ): Promise<Result<KnowledgeError, RemoveSourceResult>> {
    return this._wrap(
      OperationStep.RemoveSource,
      () => this._contextManagement.removeSourceFromContext({ contextId: input.contextId, sourceId: input.sourceId }),
      (ctx) => ({ contextId: ctx.id.value, version: ctx.currentVersion?.version ?? 0 }),
    );
  }

  private _reconcileProjectionsImpl(
    input: ReconcileProjectionsInput,
  ): Promise<Result<KnowledgeError, ReconcileProjectionsResult>> {
    return this._reconcileProjections.execute(input);
  }

  private async _reconcileAllProfilesImpl(
    input: ReconcileAllProfilesInput,
  ): Promise<Result<KnowledgeError, ReconcileAllProfilesResult>> {
    try {
      const allProfiles = await this._processing.listProcessingProfiles();
      const activeProfiles = allProfiles.filter((p) => p.status === "ACTIVE");

      const profileResults: Array<{ profileId: string; processedCount: number; failedCount: number }> = [];

      for (const profile of activeProfiles) {
        const profileId = profile.id.value;
        const result = await this._reconcileProjections.execute({ contextId: input.contextId, profileId });
        if (result.isOk()) {
          profileResults.push({ profileId, processedCount: result.value.processedCount, failedCount: result.value.failedCount });
        } else {
          profileResults.push({ profileId, processedCount: 0, failedCount: 1 });
        }
      }

      return Result.ok({
        contextId: input.contextId,
        profileResults,
        totalProcessed: profileResults.reduce((sum, r) => sum + r.processedCount, 0),
        totalFailed: profileResults.reduce((sum, r) => sum + r.failedCount, 0),
      });
    } catch (error) {
      return Result.fail(KnowledgeError.fromStep(OperationStep.Processing, error, []));
    }
  }

  private async _updateContextProfile(
    input: UpdateContextProfileInput,
  ): Promise<Result<KnowledgeError, UpdateContextProfileResult>> {
    try {
      const result = await this._contextManagement.updateContextProfile({
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

  private _linkContexts(
    input: LinkContextsInput,
  ): Promise<Result<KnowledgeError, LinkContextsResult>> {
    return this._wrap(
      OperationStep.Link,
      () => this._contextManagement.linkContexts({ fromContextId: input.sourceContextId, toContextId: input.targetContextId, relationship: input.relationshipType }),
      (v) => ({ sourceContextId: v.fromContextId, targetContextId: v.toContextId }),
    );
  }

  private _unlinkContexts(
    input: UnlinkContextsInput,
  ): Promise<Result<KnowledgeError, UnlinkContextsResult>> {
    return this._wrap(
      OperationStep.Unlink,
      () => this._contextManagement.unlinkContexts({ fromContextId: input.sourceContextId, toContextId: input.targetContextId }),
      (v) => ({ sourceContextId: v.fromContextId, targetContextId: v.toContextId }),
    );
  }

  private _getContextLineage(
    input: GetContextLineageInput,
  ): Promise<Result<KnowledgeError, GetContextLineageResult>> {
    return this._wrap(
      OperationStep.Link,
      () => this._contextManagement.getLineage(input.contextId),
      (v) => ({
        contextId: v.contextId,
        traces: v.traces.map((t: any) => ({ ...t, createdAt: t.createdAt.toISOString() })),
      }),
    );
  }
}
