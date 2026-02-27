export { KnowledgeRetrievalService } from "./KnowledgeRetrievalService";

export type {
  KnowledgeRetrievalServicePolicy,
  ResolvedKnowledgeRetrievalModules,
} from "../composition/factory";

import type { KnowledgeRetrievalServicePolicy } from "../composition/factory";
import type { KnowledgeRetrievalService as _Service } from "./KnowledgeRetrievalService";

export async function createKnowledgeRetrievalService(
  policy: KnowledgeRetrievalServicePolicy,
): Promise<_Service> {
  const { resolveKnowledgeRetrievalModules } = await import(
    "../composition/factory"
  );
  const { KnowledgeRetrievalService } = await import("./KnowledgeRetrievalService");
  const modules = await resolveKnowledgeRetrievalModules(policy);
  return new KnowledgeRetrievalService(modules);
}
