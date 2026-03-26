import type { ContextInfrastructurePolicy } from "./factory";
import type { ContextRepository } from "../domain/ContextRepository";
import type { SourceMetadataPort } from "../application/ports/SourceMetadataPort";
import type { ProjectionStatsPort } from "../application/ports/ProjectionStatsPort";
import type { ProjectionOperationsPort } from "../../../semantic-processing/projection/application/ports/ProjectionOperationsPort";
import type { Result } from "../../../../shared/domain/Result";
import type { DomainError } from "../../../../shared/domain/errors";
import type { CreateContextAndActivate } from "../application/use-cases/CreateContextAndActivate";
import type { UpdateContextProfile } from "../application/use-cases/UpdateContextProfile";
import type { TransitionContextState } from "../application/use-cases/TransitionContextState";
import type { RemoveSourceFromContext } from "../application/use-cases/RemoveSourceFromContext";
import type { ContextQueries } from "../application/use-cases/ContextQueries";
import type { AddSourceToContext } from "../application/use-cases/AddSourceToContext";
import type { GetContextDetail } from "../application/use-cases/GetContextDetail";
import type { ListContextSummary } from "../application/use-cases/ListContextSummary";
import type { ReconcileProjections } from "../application/use-cases/ReconcileProjections";
import type { UpdateProfileAndReconcile } from "../application/use-cases/UpdateProfileAndReconcile";

export interface ContextExternalDeps {
  enrichment: {
    sourceMetadata: SourceMetadataPort;
    projectionStats: ProjectionStatsPort;
  };
  reconciliation: {
    projectionOperations: ProjectionOperationsPort;
    getExtractedText: (sourceId: string) => Promise<Result<DomainError, { text: string }>>;
    listActiveProfiles: () => Promise<Array<{ id: string }>>;
  };
}

export interface ContextWiringResult {
  createContextAndActivate: CreateContextAndActivate;
  updateContextProfile: UpdateContextProfile;
  updateProfileAndReconcile: UpdateProfileAndReconcile;
  transitionContextState: TransitionContextState;
  removeSourceFromContext: RemoveSourceFromContext;
  contextQueries: ContextQueries;
  addSourceToContext: AddSourceToContext;
  getContextDetail: GetContextDetail;
  listContextSummary: ListContextSummary;
  reconcileProjections: ReconcileProjections;
  contextRepository: ContextRepository;
}

export async function contextWiring(
  policy: ContextInfrastructurePolicy,
  deps?: ContextExternalDeps,
): Promise<ContextWiringResult> {
  const { contextFactory } = await import("./factory");
  const infra = await contextFactory(policy);

  const [
    { CreateContextAndActivate },
    { UpdateContextProfile },
    { TransitionContextState },
    { RemoveSourceFromContext },
    { ContextQueries },
    { AddSourceToContext },
    { GetContextDetail },
    { ListContextSummary },
    { ReconcileProjections },
    { UpdateProfileAndReconcile },
  ] = await Promise.all([
    import("../application/use-cases/CreateContextAndActivate"),
    import("../application/use-cases/UpdateContextProfile"),
    import("../application/use-cases/TransitionContextState"),
    import("../application/use-cases/RemoveSourceFromContext"),
    import("../application/use-cases/ContextQueries"),
    import("../application/use-cases/AddSourceToContext"),
    import("../application/use-cases/GetContextDetail"),
    import("../application/use-cases/ListContextSummary"),
    import("../application/use-cases/ReconcileProjections"),
    import("../application/use-cases/UpdateProfileAndReconcile"),
  ]);

  // Null ports for when deps aren't provided (e.g. tests)
  const nullSourceMeta: SourceMetadataPort = { getSourceMetadata: async () => null };
  const nullProjStats: ProjectionStatsPort = { getAllProjectionsForSources: async () => new Map() };
  const nullProjOps: ProjectionOperationsPort = {
    findExistingProjection: async () => null,
    cleanupSourceProjectionForProfile: async () => null,
    processContent: async () => ({ isFail: () => true, isOk: () => false, error: { message: "not wired" } }) as any,
  };

  const enrichment = deps?.enrichment ?? { sourceMetadata: nullSourceMeta, projectionStats: nullProjStats };
  const reconciliation = deps?.reconciliation ?? {
    projectionOperations: nullProjOps,
    getExtractedText: async () => ({ isFail: () => true, isOk: () => false } as any),
    listActiveProfiles: async () => [],
  };

  return {
    createContextAndActivate: new CreateContextAndActivate(infra.repository, infra.eventPublisher),
    updateContextProfile: new UpdateContextProfile(infra.repository, infra.eventPublisher),
    updateProfileAndReconcile: new UpdateProfileAndReconcile(infra.repository, infra.eventPublisher, {
      projectionOperations: reconciliation.projectionOperations,
      getExtractedText: reconciliation.getExtractedText,
    }),
    transitionContextState: new TransitionContextState(infra.repository, infra.eventPublisher),
    removeSourceFromContext: new RemoveSourceFromContext(infra.repository, infra.eventPublisher),
    contextQueries: new ContextQueries(infra.repository),
    addSourceToContext: new AddSourceToContext(infra.repository, infra.eventPublisher),
    getContextDetail: new GetContextDetail(infra.repository, enrichment.sourceMetadata, enrichment.projectionStats),
    listContextSummary: new ListContextSummary(infra.repository, enrichment.projectionStats),
    reconcileProjections: new ReconcileProjections(infra.repository, {
      projectionOperations: reconciliation.projectionOperations,
      getExtractedText: reconciliation.getExtractedText,
      listActiveProfiles: reconciliation.listActiveProfiles,
    }),
    contextRepository: infra.repository,
  };
}
