import type { ProjectionInfrastructurePolicy } from "./factory";
import type { ProcessingProfileRepository } from "../../processing-profile/domain/ProcessingProfileRepository";
import type { ProfileQueries } from "../../processing-profile/application/use-cases/ProfileQueries";
import type { SourceIngestionPort } from "../application/ports/SourceIngestionPort";
import type { GenerateProjection as GenerateProjectionType } from "../application/use-cases/GenerateProjection";
import type { ProjectionQueries as ProjectionQueriesType } from "../application/use-cases/ProjectionQueries";
import type { CleanupProjections as CleanupProjectionsType } from "../application/use-cases/CleanupProjections";
import type { ProcessSourceAllProfiles as ProcessSourceAllProfilesType } from "../application/use-cases/ProcessSourceAllProfiles";
import type { VectorStoreConfig } from "../../../../shared/vector/VectorStoreConfig";

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

  return { generateProjection, projectionQueries, cleanupProjections, processSourceAllProfiles, vectorStoreConfig };
}
