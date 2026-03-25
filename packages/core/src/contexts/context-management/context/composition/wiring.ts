import type { ContextInfrastructurePolicy } from "./factory";
import type { ContextRepository } from "../domain/ContextRepository";
import type { CreateContextAndActivate } from "../application/use-cases/CreateContextAndActivate";
import type { UpdateContextProfile } from "../application/use-cases/UpdateContextProfile";
import type { TransitionContextState } from "../application/use-cases/TransitionContextState";
import type { RemoveSourceFromContext } from "../application/use-cases/RemoveSourceFromContext";
import type { ContextQueries } from "../application/use-cases/ContextQueries";
import type { AddSourceToContext } from "../application/use-cases/AddSourceToContext";

export interface ContextWiringResult {
  createContextAndActivate: CreateContextAndActivate;
  updateContextProfile: UpdateContextProfile;
  transitionContextState: TransitionContextState;
  removeSourceFromContext: RemoveSourceFromContext;
  contextQueries: ContextQueries;
  addSourceToContext: AddSourceToContext;
  /** Exposed for application-layer adapters (ContextSourceAdapter) */
  contextRepository: ContextRepository;
}

export async function contextWiring(
  policy: ContextInfrastructurePolicy,
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
  ] = await Promise.all([
    import("../application/use-cases/CreateContextAndActivate"),
    import("../application/use-cases/UpdateContextProfile"),
    import("../application/use-cases/TransitionContextState"),
    import("../application/use-cases/RemoveSourceFromContext"),
    import("../application/use-cases/ContextQueries"),
    import("../application/use-cases/AddSourceToContext"),
  ]);

  return {
    createContextAndActivate: new CreateContextAndActivate(infra.repository, infra.eventPublisher),
    updateContextProfile: new UpdateContextProfile(infra.repository, infra.eventPublisher),
    transitionContextState: new TransitionContextState(infra.repository, infra.eventPublisher),
    removeSourceFromContext: new RemoveSourceFromContext(infra.repository, infra.eventPublisher),
    contextQueries: new ContextQueries(infra.repository),
    addSourceToContext: new AddSourceToContext(infra.repository, infra.eventPublisher),
    contextRepository: infra.repository,
  };
}
