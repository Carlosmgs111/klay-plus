import type { KnowledgeLifecyclePort } from "../contracts/KnowledgeLifecyclePort";
import type { ResolvedLifecycleDependencies } from "../application/KnowledgeLifecycleOrchestrator";

export interface KnowledgeLifecyclePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  configOverrides?: Record<string, string>;
}

async function resolveLifecycleDependencies(
  policy: KnowledgeLifecyclePolicy,
): Promise<ResolvedLifecycleDependencies> {
  const [
    { createSemanticKnowledgeService },
    { createSemanticProcessingService },
  ] = await Promise.all([
    import("../../../contexts/semantic-knowledge/service"),
    import("../../../contexts/semantic-processing/service"),
  ]);

  const [knowledge, processing] = await Promise.all([
    createSemanticKnowledgeService({
      provider: policy.provider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      configOverrides: policy.configOverrides,
    }),
    createSemanticProcessingService({
      provider: policy.provider,
      dbPath: policy.dbPath,
      dbName: policy.dbName,
      configOverrides: policy.configOverrides,
    }),
  ]);

  return { knowledge, processing };
}

export async function createKnowledgeLifecycle(
  policy: KnowledgeLifecyclePolicy,
): Promise<KnowledgeLifecyclePort> {
  const { KnowledgeLifecycleOrchestrator } = await import(
    "../application/KnowledgeLifecycleOrchestrator"
  );

  const deps = await resolveLifecycleDependencies(policy);
  return new KnowledgeLifecycleOrchestrator(deps);
}
