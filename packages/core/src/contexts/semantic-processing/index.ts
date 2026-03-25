import { projectionWiring } from "./projection/composition/wiring";
import type { ProjectionInfrastructurePolicy } from "./projection/composition/factory";
import { processingProfileWiring } from "./processing-profile/composition/wiring";
import type { ProjectionWiringDeps } from "./projection/composition/wiring";
import type { ProcessingProfileInfrastructurePolicy } from "./processing-profile/composition/factory";

export type SemanticProcessingInfrastructurePolicy = {
  projectionInfrastructurePolicy: ProjectionInfrastructurePolicy;
  processingProfileInfrastructurePolicy: ProcessingProfileInfrastructurePolicy;
};

//
type SemanticProcessingExternalContextDeps = {
  projectionWiringDeps: Pick<ProjectionWiringDeps, "sourceIngestionPort">;
};

export const semanticProcessingWiring = async (
  policy: SemanticProcessingInfrastructurePolicy &
    SemanticProcessingExternalContextDeps
) => {
  const processingProfileWiringResult = await processingProfileWiring(
    policy.processingProfileInfrastructurePolicy
  );
  const projectionWiringDeps: ProjectionWiringDeps = {
    profileRepository: processingProfileWiringResult.profileRepository, // <- Intra-context dependency
    profileQueries: processingProfileWiringResult.profileQueries, // <- Intra-context dependency
    sourceIngestionPort: policy.projectionWiringDeps.sourceIngestionPort, // <- External context dependency
  };
  const projectionWiringResult = await projectionWiring(
    policy.projectionInfrastructurePolicy,
    projectionWiringDeps
  );
  return {
    projectionWiringResult,
    processingProfileWiringResult,
  };
};
