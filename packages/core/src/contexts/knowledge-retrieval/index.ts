import { semanticQueryWiring } from "./semantic-query/composition/wiring";
import type { SemanticQueryInfrastructurePolicy } from "./semantic-query/composition/factory";

export type KnowledgeRetrievalInfrastructurePolicy = {
  semanticQueryInfrastructurePolicy: SemanticQueryInfrastructurePolicy;
};

export const knowledgeRetrievalWiring = async (
  policy: KnowledgeRetrievalInfrastructurePolicy,
) => {
  const semanticQueryWiringResult = await semanticQueryWiring(
    policy.semanticQueryInfrastructurePolicy,
  );
  return { semanticQueryWiringResult };
};
