import { sourceWiring } from "./source/composition/wiring";
import type { SourceInfrastructurePolicy } from "./source/composition/factory";
import { resourceWiring } from "./resource/composition/wiring";
import type { ResourceInfrastructurePolicy } from "./resource/composition/factory";
import type { SourceWiringDeps } from "./source/composition/wiring";
import { extractionWiring } from "./extraction/composition/wiring";
import type { ExtractionInfrastructurePolicy } from "./extraction/composition/factory";

export type SourceIngestionInfrastructurePolicy = {
  sourceInfrastructurePolicy: SourceInfrastructurePolicy;
  resourceInfrastructurePolicy: ResourceInfrastructurePolicy;
  extractionInfrastructurePolicy: ExtractionInfrastructurePolicy;
};

export const sourceIngestionWiring = async (
  policy: SourceIngestionInfrastructurePolicy
) => {
  const extractionWiringResult = await extractionWiring(
    policy.extractionInfrastructurePolicy
  );
  const resourceWiringResult = await resourceWiring(
    policy.resourceInfrastructurePolicy
  );
  const sourceWiringDeps: SourceWiringDeps = {
    executeExtraction: extractionWiringResult.executeExtraction, // <- Intra-context dependency
    extractionJobRepository: extractionWiringResult.extractionJobRepository, // <- Intra-context dependency
    storeResource: resourceWiringResult.storeResource, // <- Intra-context dependency
    registerExternalResource: resourceWiringResult.registerExternalResource, // <- Intra-context dependency
  };
  const sourceWiringResult = await sourceWiring(
    policy.sourceInfrastructurePolicy,
    sourceWiringDeps
  );
  return {
    sourceWiringResult,
    resourceWiringResult,
    extractionWiringResult,
  };
};
