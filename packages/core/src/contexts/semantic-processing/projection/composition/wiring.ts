import type { ProjectionInfrastructurePolicy } from "./factory";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository";
import type { ProfileQueries } from "../../processing-profile/application/use-cases/ProfileQueries";
import type { SourceIngestionPort } from "../application/ports/SourceIngestionPort";
import type { ProjectionOperationsPort } from "../application/ports/ProjectionOperationsPort";
import type { GenerateProjection as GenerateProjectionType } from "../application/use-cases/GenerateProjection";
import type { ProjectionQueries as ProjectionQueriesType } from "../application/use-cases/ProjectionQueries";
import type { CleanupProjections as CleanupProjectionsType } from "../application/use-cases/CleanupProjections";
import type { ProcessSourceAllProfiles as ProcessSourceAllProfilesType } from "../application/use-cases/ProcessSourceAllProfiles";
import type { VectorStoreConfig } from "../../../../shared/vector/VectorStoreConfig";
import { Result } from "../../../../shared/domain/Result";
import type { DomainError } from "../../../../shared/domain/errors";

export interface ProjectionWiringDeps {
  profileRepository: ProcessingProfileRepository;
  profileQueries: ProfileQueries;
  sourceIngestionPort: SourceIngestionPort;
}

export interface ProjectionWiringResult {
  generateProjection: GenerateProjectionType;
  projectionQueries: ProjectionQueriesType;
  cleanupProjections: CleanupProjectionsType;
  processSourceAllProfiles: ProcessSourceAllProfilesType;
  /** Facade over find, cleanup, generate — consumed by app-layer orchestrators */
  projectionOperations: ProjectionOperationsPort;
  vectorStoreConfig: VectorStoreConfig;
}

export async function projectionWiring(
  policy: ProjectionInfrastructurePolicy,
  deps: ProjectionWiringDeps,
): Promise<ProjectionWiringResult> {
  const { projectionFactory } = await import("./factory");
  const { infra } = await projectionFactory(policy, deps.profileRepository);

  const [
    { GenerateProjection },
    { ProjectionQueries },
    { CleanupProjections },
    { ProcessSourceAllProfiles },
  ] = await Promise.all([
    import("../application/use-cases/GenerateProjection"),
    import("../application/use-cases/ProjectionQueries"),
    import("../application/use-cases/CleanupProjections"),
    import("../application/use-cases/ProcessSourceAllProfiles"),
  ]);

  const projectionQueries = new ProjectionQueries(infra.repository);
  const generateProjection = new GenerateProjection(
    infra.repository, deps.profileRepository, infra.materializer, infra.vectorWriteStore, infra.eventPublisher,
  );
  const cleanupProjections = new CleanupProjections(infra.repository, infra.vectorWriteStore);

  const processSourceAllProfiles = new ProcessSourceAllProfiles(
    deps.profileQueries, projectionQueries, generateProjection, deps.sourceIngestionPort,
  );

  // Build projection operations facade (consumed by app-layer orchestrators)
  const projectionOperations: ProjectionOperationsPort = {
    findExistingProjection: (sourceId, profileId) =>
      projectionQueries.findExisting(sourceId, profileId),
    cleanupSourceProjectionForProfile: (sourceId, profileId) =>
      cleanupProjections.execute({ sourceId, profileId }) as Promise<string | null>,
    async processContent(input) {
      const result = await generateProjection.execute({
        projectionId: input.projectionId,
        sourceId: input.sourceId,
        content: input.content,
        type: input.type,
        processingProfileId: input.processingProfileId,
      });
      if (result.isFail()) return Result.fail(result.error as unknown as DomainError);
      return Result.ok({
        projectionId: result.value.projectionId,
        chunksCount: result.value.chunksCount,
        dimensions: result.value.dimensions,
        model: result.value.model,
        processingProfileVersion: result.value.processingProfileVersion,
      });
    },
  };

  // Compute vectorStoreConfig (needed by knowledge-retrieval to read the same store)
  const vectorStoreConfig: VectorStoreConfig = {
    dbPath: policy.dbPath ? `${policy.dbPath}/vector-entries.db` : undefined,
    dbName: policy.dbName,
  };

  if (!policy.vectorStoreProvider || policy.vectorStoreProvider === "in-memory") {
    const writeStore = infra.vectorWriteStore as any;
    if (writeStore.sharedEntries) {
      vectorStoreConfig.sharedEntries = writeStore.sharedEntries;
    }
  }

  return {
    generateProjection, projectionQueries, cleanupProjections,
    processSourceAllProfiles, projectionOperations, vectorStoreConfig,
  };
}
