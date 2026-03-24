import type { ContextRepository } from "../context/domain/ContextRepository";
import type { EventPublisher } from "../../../shared/domain/EventPublisher";
import type { CreateContextAndActivate as CreateContextAndActivateType } from "../context/application/use-cases/CreateContextAndActivate";
import type { UpdateContextProfile as UpdateContextProfileType } from "../context/application/use-cases/UpdateContextProfile";
import type { TransitionContextState as TransitionContextStateType } from "../context/application/use-cases/TransitionContextState";
import type { RemoveSourceFromContext as RemoveSourceFromContextType } from "../context/application/use-cases/RemoveSourceFromContext";
import type { ContextQueries as ContextQueriesType } from "../context/application/use-cases/ContextQueries";
import type { AddSourceToContext as AddSourceToContextType } from "../context/application/use-cases/AddSourceToContext";
import type { LinkContexts as LinkContextsType } from "../lineage/application/use-cases/LinkContexts";
import type { UnlinkContexts as UnlinkContextsType } from "../lineage/application/use-cases/UnlinkContexts";
import type { LineageQueries as LineageQueriesType } from "../lineage/application/use-cases/LineageQueries";

/**
 * Context Management capabilities — pure domain, zero cross-context ports.
 *
 * Orchestration (reconcile, enriched queries) lives in application layer.
 */
export interface ContextManagementCapabilities {
  createContextAndActivate: CreateContextAndActivateType;
  updateContextProfile: UpdateContextProfileType;
  transitionContextState: TransitionContextStateType;
  removeSourceFromContext: RemoveSourceFromContextType;
  contextQueries: ContextQueriesType;
  linkContexts: LinkContextsType;
  unlinkContexts: UnlinkContextsType;
  lineageQueries: LineageQueriesType;
  addSourceToContext: AddSourceToContextType;
  contextRepository: ContextRepository;
  eventPublisher: EventPublisher;
}

export async function createContextManagement(
  config: { provider: string; dbPath?: string; dbName?: string },
): Promise<ContextManagementCapabilities> {
  const [
    { contextFactory },
    { lineageFactory },
  ] = await Promise.all([
    import("../context/composition/factory"),
    import("../lineage/composition/factory"),
  ]);

  const [{ infra: contextInfra }, { infra: lineageInfra }] = await Promise.all([
    contextFactory(config),
    lineageFactory(config),
  ]);

  const [
    { CreateContextAndActivate },
    { AddSourceToContext },
    { RemoveSourceFromContext },
    { TransitionContextState },
    { UpdateContextProfile },
    { ContextQueries },
    { LinkContexts },
    { UnlinkContexts },
    { LineageQueries },
  ] = await Promise.all([
    import("../context/application/use-cases/CreateContextAndActivate"),
    import("../context/application/use-cases/AddSourceToContext"),
    import("../context/application/use-cases/RemoveSourceFromContext"),
    import("../context/application/use-cases/TransitionContextState"),
    import("../context/application/use-cases/UpdateContextProfile"),
    import("../context/application/use-cases/ContextQueries"),
    import("../lineage/application/use-cases/LinkContexts"),
    import("../lineage/application/use-cases/UnlinkContexts"),
    import("../lineage/application/use-cases/LineageQueries"),
  ]);

  const createContextAndActivate = new CreateContextAndActivate(contextInfra.repository, contextInfra.eventPublisher);
  const addSourceToContext = new AddSourceToContext(contextInfra.repository, contextInfra.eventPublisher);
  const removeSourceFromContext = new RemoveSourceFromContext(contextInfra.repository, contextInfra.eventPublisher);
  const transitionContextState = new TransitionContextState(contextInfra.repository, contextInfra.eventPublisher);
  const updateContextProfile = new UpdateContextProfile(contextInfra.repository, contextInfra.eventPublisher);
  const contextQueries = new ContextQueries(contextInfra.repository);

  const linkContexts = new LinkContexts(lineageInfra.repository);
  const unlinkContexts = new UnlinkContexts(lineageInfra.repository);
  const lineageQueries = new LineageQueries(lineageInfra.repository);

  return {
    createContextAndActivate,
    updateContextProfile,
    transitionContextState,
    removeSourceFromContext,
    contextQueries,
    linkContexts,
    unlinkContexts,
    lineageQueries,
    addSourceToContext,
    contextRepository: contextInfra.repository,
    eventPublisher: contextInfra.eventPublisher,
  };
}
