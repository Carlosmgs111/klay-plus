import type { OrchestratorPolicy } from "../config/OrchestratorPolicy";
import type { SearchKnowledgeInput } from "../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge";
import type { SearchKnowledge } from "../contexts/knowledge-retrieval/semantic-query/application/use-cases/SearchKnowledge";

// Inline import to avoid circular — KnowledgeApplication is defined in index.ts
type KnowledgeApplication = import("../index").KnowledgeApplication;

export async function createKnowledgeApplication(
  policy: OrchestratorPolicy,
): Promise<KnowledgeApplication> {
  const { resolveConfig } = await import("../config/resolveConfig");
  const config = await resolveConfig(policy);

  const { coreWiring } = await import("../contexts");
  const core = await coreWiring(config);

  // Unpack
  const { contextWiringResult: context, lineageWiringResult: lineage } =
    core.contextManagementWiringResult;
  const { sourceWiringResult: source } = core.sourceIngestionWiringResult;
  const { projectionWiringResult: projection, processingProfileWiringResult: profile } =
    core.semanticProcessingWiringResult;
  const { semanticQueryWiringResult: retrieval } =
    core.knowledgeRetrievalWiringResult;

  // ProcessKnowledge — cross-context pipeline
  const { ProcessKnowledge } = await import("../pipelines/process-knowledge/ProcessKnowledge");
  const processKnowledge = new ProcessKnowledge({
    ingestAndExtract: source.ingestAndExtract,
    sourceQueries: source.sourceQueries,
    projectionOperations: projection.projectionOperations,
    contextQueries: context.contextQueries,
    addSourceToContext: context.addSourceToContext,
  });

  // Search with context filter
  const wrappedSearch = {
    async execute(input: SearchKnowledgeInput) {
      if (input.filters?.contextId) {
        const contextId = input.filters.contextId as string;
        const ctx = await context.contextQueries.getRaw(contextId);
        if (ctx) {
          const sourceIds = ctx.activeSources.map((s) => s.sourceId);
          const { contextId: _, ...rest } = input.filters;
          input = { ...input, filters: { ...rest, sourceIds } };
        }
      }
      return retrieval.searchKnowledge.execute(input);
    },
  } as SearchKnowledge;

  return {
    processKnowledge,

    contextManagement: {
      createContextAndActivate: context.createContextAndActivate,
      updateContextProfileAndReconcile: context.updateProfileAndReconcile,
      transitionContextState: context.transitionContextState,
      removeSourceFromContext: context.removeSourceFromContext,
      contextQueries: context.contextQueries,
      reconcileProjections: context.reconcileProjections,
      getContextDetail: context.getContextDetail,
      listContextSummary: context.listContextSummary,
      linkContexts: lineage.linkContexts,
      unlinkContexts: lineage.unlinkContexts,
      lineageQueries: lineage.lineageQueries,
    },

    sourceIngestion: { sourceQueries: source.sourceQueries },

    semanticProcessing: {
      createProcessingProfile: profile.createProcessingProfile,
      updateProcessingProfile: profile.updateProcessingProfile,
      deprecateProcessingProfile: profile.deprecateProcessingProfile,
      profileQueries: profile.profileQueries,
      processSourceAllProfiles: projection.processSourceAllProfiles,
    },

    knowledgeRetrieval: { searchKnowledge: wrappedSearch },
  };
}

/** @deprecated Use createKnowledgeApplication() */
export const createKnowledgePlatform = createKnowledgeApplication;
