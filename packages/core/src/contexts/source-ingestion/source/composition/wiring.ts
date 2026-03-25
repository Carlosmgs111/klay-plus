import type { SourceInfrastructurePolicy } from "./factory";
import type { ExecuteExtraction } from "../../extraction/application/ExecuteExtraction";
import type { ExtractionJobRepository } from "../../extraction/domain/ExtractionJobRepository";
import type { StoreResource } from "../../resource/application/use-cases/StoreResource";
import type { RegisterExternalResource } from "../../resource/application/use-cases/RegisterExternalResource";
import type { SourceQueries as SourceQueriesType } from "../application/use-cases/SourceQueries";
import type { IngestAndExtract as IngestAndExtractType } from "../application/use-cases/IngestAndExtract";
import type { RegisterSource as RegisterSourceType } from "../application/use-cases/RegisterSource";
import type { ExtractSource as ExtractSourceType } from "../application/use-cases/ExtractSource";
import type { IngestSource as IngestSourceType } from "../application/use-cases/IngestSource";

export interface SourceWiringDeps {
  executeExtraction: ExecuteExtraction;
  extractionJobRepository: ExtractionJobRepository;
  storeResource: StoreResource;
  registerExternalResource: RegisterExternalResource;
}

export interface SourceWiringResult {
  sourceQueries: SourceQueriesType;
  ingestAndExtract: IngestAndExtractType;
  registerSource: RegisterSourceType;
  extractSource: ExtractSourceType;
  ingestSource: IngestSourceType;
}

export async function sourceWiring(
  policy: SourceInfrastructurePolicy,
  deps: SourceWiringDeps,
): Promise<SourceWiringResult> {
  const { sourceFactory } = await import("./factory");
  const { infra } = await sourceFactory(policy);

  const [
    { SourceQueries },
    { RegisterSource },
    { ExtractSource },
    { IngestAndExtract },
    { IngestSource },
  ] = await Promise.all([
    import("../application/use-cases/SourceQueries"),
    import("../application/use-cases/RegisterSource"),
    import("../application/use-cases/ExtractSource"),
    import("../application/use-cases/IngestAndExtract"),
    import("../application/use-cases/IngestSource"),
  ]);

  const sourceQueries = new SourceQueries(infra.repository, deps.extractionJobRepository);
  const registerSource = new RegisterSource(infra.repository, infra.eventPublisher);
  const extractSource = new ExtractSource(infra.repository, infra.eventPublisher, deps.executeExtraction);
  const ingestAndExtract = new IngestAndExtract(infra.repository, infra.eventPublisher, deps.executeExtraction);
  const ingestSource = new IngestSource(ingestAndExtract, deps.storeResource, deps.registerExternalResource);

  return { sourceQueries, ingestAndExtract, registerSource, extractSource, ingestSource };
}
