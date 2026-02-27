export { SourceIngestionFacade } from "./SourceIngestionFacade.js";
export type {
  RegisterSourceSuccess,
  ExtractSourceSuccess,
  IngestAndExtractSuccess,
  IngestExtractAndReturnSuccess,
  IngestFileSuccess,
} from "./SourceIngestionFacade.js";

export { SourceIngestionFacadeComposer } from "./composition/SourceIngestionFacadeComposer.js";
export type {
  SourceIngestionFacadePolicy,
  ResolvedSourceIngestionModules,
} from "./composition/infra-policies.js";

import type { SourceIngestionFacadePolicy } from "./composition/infra-policies.js";
import type { SourceIngestionFacade as _Facade } from "./SourceIngestionFacade.js";

/**
 * Factory function to create a fully configured SourceIngestionFacade.
 * This is the main entry point for consuming the Source Ingestion context.
 */
export async function createSourceIngestionFacade(
  policy: SourceIngestionFacadePolicy,
): Promise<_Facade> {
  const { SourceIngestionFacadeComposer } = await import(
    "./composition/SourceIngestionFacadeComposer.js"
  );
  const { SourceIngestionFacade } = await import("./SourceIngestionFacade.js");
  const modules = await SourceIngestionFacadeComposer.resolve(policy);
  return new SourceIngestionFacade(modules);
}
