import { contextWiring } from "./context/composition/wiring";
import type { ContextInfrastructurePolicy } from "./context/composition/factory";
import type { ContextExternalDeps } from "./context/composition/wiring";
import { lineageWiring } from "./lineage/composition/wiring";
import type { LineageInfrastructurePolicy } from "./lineage/composition/factory";

export type ContextManagementInfrastructurePolicy = {
  contextInfrastructurePolicy: ContextInfrastructurePolicy;
  lineageInfrastructurePolicy: LineageInfrastructurePolicy;
};

export type ContextManagementExternalDeps = ContextExternalDeps;

export const contextManagementWiring = async (
  policy: ContextManagementInfrastructurePolicy,
  deps?: ContextManagementExternalDeps,
) => {
  const [contextWiringResult, lineageWiringResult] = await Promise.all([
    contextWiring(policy.contextInfrastructurePolicy, deps),
    lineageWiring(policy.lineageInfrastructurePolicy),
  ]);
  return { contextWiringResult, lineageWiringResult };
};
