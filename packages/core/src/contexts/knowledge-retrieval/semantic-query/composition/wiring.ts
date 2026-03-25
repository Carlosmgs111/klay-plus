import type { SemanticQueryInfrastructurePolicy } from "./factory";
import type { SearchKnowledge as SearchKnowledgeType } from "../application/use-cases/SearchKnowledge";

export interface SemanticQueryWiringResult {
  searchKnowledge: SearchKnowledgeType;
}

export async function semanticQueryWiring(
  policy: SemanticQueryInfrastructurePolicy,
): Promise<SemanticQueryWiringResult> {
  const { semanticQueryFactory } = await import("./factory");
  const { infra } = await semanticQueryFactory(policy);

  const { SearchKnowledge } = await import("../application/use-cases/SearchKnowledge");
  const searchKnowledge = new SearchKnowledge(infra);

  return { searchKnowledge };
}
