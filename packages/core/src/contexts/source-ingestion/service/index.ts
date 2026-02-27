export { SourceIngestionService } from "./SourceIngestionService";
export type {
  RegisterSourceSuccess,
  ExtractSourceSuccess,
  IngestAndExtractSuccess,
  IngestFileSuccess,
  StoreResourceSuccess,
  RegisterExternalResourceSuccess,
} from "./SourceIngestionService";

export type {
  SourceIngestionServicePolicy,
  ResolvedSourceIngestionModules,
} from "../composition/factory";

import type { SourceIngestionServicePolicy } from "../composition/factory";
import type { SourceIngestionService as _Service } from "./SourceIngestionService";

export async function createSourceIngestionService(
  policy: SourceIngestionServicePolicy,
): Promise<_Service> {
  const { resolveSourceIngestionModules } = await import(
    "../composition/factory"
  );
  const { SourceIngestionService } = await import("./SourceIngestionService");
  const modules = await resolveSourceIngestionModules(policy);
  return new SourceIngestionService(modules);
}
