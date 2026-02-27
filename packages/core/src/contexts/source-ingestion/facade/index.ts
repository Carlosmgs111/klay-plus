export { SourceIngestionFacade } from "./SourceIngestionFacade";
export type {
  RegisterSourceSuccess,
  ExtractSourceSuccess,
  IngestAndExtractSuccess,
  IngestFileSuccess,
  StoreResourceSuccess,
  RegisterExternalResourceSuccess,
} from "./SourceIngestionFacade";

export type {
  SourceIngestionFacadePolicy,
  ResolvedSourceIngestionModules,
} from "./composition/factory";

import type { SourceIngestionFacadePolicy } from "./composition/factory";
import type { SourceIngestionFacade as _Facade } from "./SourceIngestionFacade";

export async function createSourceIngestionFacade(
  policy: SourceIngestionFacadePolicy,
): Promise<_Facade> {
  const { resolveSourceIngestionModules } = await import(
    "./composition/factory"
  );
  const { SourceIngestionFacade } = await import("./SourceIngestionFacade");
  const modules = await resolveSourceIngestionModules(policy);
  return new SourceIngestionFacade(modules);
}
