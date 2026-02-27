export { KnowledgeRetrievalFacade } from "./KnowledgeRetrievalFacade";

export type {
  KnowledgeRetrievalFacadePolicy,
  ResolvedKnowledgeRetrievalModules,
} from "./composition/factory";

import type { KnowledgeRetrievalFacadePolicy } from "./composition/factory";
import type { KnowledgeRetrievalFacade as _Facade } from "./KnowledgeRetrievalFacade";

export async function createKnowledgeRetrievalFacade(
  policy: KnowledgeRetrievalFacadePolicy,
): Promise<_Facade> {
  const { resolveKnowledgeRetrievalModules } = await import(
    "./composition/factory"
  );
  const { KnowledgeRetrievalFacade } = await import("./KnowledgeRetrievalFacade");
  const modules = await resolveKnowledgeRetrievalModules(policy);
  return new KnowledgeRetrievalFacade(modules);
}
