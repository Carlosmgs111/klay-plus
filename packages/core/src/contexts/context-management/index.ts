import { contextWiring } from "./context/composition/wiring";
import type { ContextInfrastructurePolicy } from "./context/composition/factory";
import { lineageWiring } from "./lineage/composition/wiring";
import type { LineageInfrastructurePolicy } from "./lineage/composition/factory";

export type ContextManagementInfrastructurePolicy = {
  contextInfrastructurePolicy: ContextInfrastructurePolicy;
  lineageInfrastructurePolicy: LineageInfrastructurePolicy;
};

export const contextManagementWiring = async (
  policy: ContextManagementInfrastructurePolicy,
) => {
  const [contextWiringResult, lineageWiringResult] = await Promise.all([
    contextWiring(policy.contextInfrastructurePolicy),
    lineageWiring(policy.lineageInfrastructurePolicy),
  ]);
  return { contextWiringResult, lineageWiringResult };
};
