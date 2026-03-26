import type { ContextInfrastructurePolicy } from "./factory";
import type { ContextRepository } from "../domain/ContextRepository";
import type { SourceMetadataPort } from "../application/ports/SourceMetadataPort";
import type { ProjectionStatsPort } from "../application/ports/ProjectionStatsPort";
import type { CreateContextAndActivate } from "../application/use-cases/CreateContextAndActivate";
import type { UpdateContextProfile } from "../application/use-cases/UpdateContextProfile";
import type { TransitionContextState } from "../application/use-cases/TransitionContextState";
import type { RemoveSourceFromContext } from "../application/use-cases/RemoveSourceFromContext";
import type { ContextQueries } from "../application/use-cases/ContextQueries";
import type { AddSourceToContext } from "../application/use-cases/AddSourceToContext";
import type { GetContextDetail } from "../application/use-cases/GetContextDetail";
import type { ListContextSummary } from "../application/use-cases/ListContextSummary";

export interface ContextEnrichmentDeps {
  sourceMetadata: SourceMetadataPort;
  projectionStats: ProjectionStatsPort;
}

export interface ContextWiringResult {
  createContextAndActivate: CreateContextAndActivate;
  updateContextProfile: UpdateContextProfile;
  transitionContextState: TransitionContextState;
  removeSourceFromContext: RemoveSourceFromContext;
  contextQueries: ContextQueries;
  addSourceToContext: AddSourceToContext;
  getContextDetail: GetContextDetail;
  listContextSummary: ListContextSummary;
  contextRepository: ContextRepository;
}

export async function contextWiring(
  policy: ContextInfrastructurePolicy,
  enrichmentDeps?: ContextEnrichmentDeps,
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
  ] = await Promise.all([
    import("../application/use-cases/CreateContextAndActivate"),
    import("../application/use-cases/UpdateContextProfile"),
    import("../application/use-cases/TransitionContextState"),
    import("../application/use-cases/RemoveSourceFromContext"),
    import("../application/use-cases/ContextQueries"),
    import("../application/use-cases/AddSourceToContext"),
    import("../application/use-cases/GetContextDetail"),
    import("../application/use-cases/ListContextSummary"),
  ]);

  // Null ports for when enrichment deps aren't provided (e.g. tests)
  const nullSourceMeta: SourceMetadataPort = { getSourceMetadata: async () => null };
  const nullProjStats: ProjectionStatsPort = { getAllProjectionsForSources: async () => new Map() };

  const sourceMeta = enrichmentDeps?.sourceMetadata ?? nullSourceMeta;
  const projStats = enrichmentDeps?.projectionStats ?? nullProjStats;

  return {
    createContextAndActivate: new CreateContextAndActivate(infra.repository, infra.eventPublisher),
    updateContextProfile: new UpdateContextProfile(infra.repository, infra.eventPublisher),
    transitionContextState: new TransitionContextState(infra.repository, infra.eventPublisher),
    removeSourceFromContext: new RemoveSourceFromContext(infra.repository, infra.eventPublisher),
    contextQueries: new ContextQueries(infra.repository),
    addSourceToContext: new AddSourceToContext(infra.repository, infra.eventPublisher),
    getContextDetail: new GetContextDetail(infra.repository, sourceMeta, projStats),
    listContextSummary: new ListContextSummary(infra.repository, projStats),
    contextRepository: infra.repository,
  };
}
