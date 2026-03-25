import type { LineageInfrastructurePolicy } from "./factory";
import type { LinkContexts } from "../application/use-cases/LinkContexts";
import type { UnlinkContexts } from "../application/use-cases/UnlinkContexts";
import type { LineageQueries } from "../application/use-cases/LineageQueries";

export interface LineageWiringResult {
  linkContexts: LinkContexts;
  unlinkContexts: UnlinkContexts;
  lineageQueries: LineageQueries;
}

export async function lineageWiring(
  policy: LineageInfrastructurePolicy,
): Promise<LineageWiringResult> {
  const { lineageFactory } = await import("./factory");
  const { infra } = await lineageFactory(policy);

  const [
    { LinkContexts },
    { UnlinkContexts },
    { LineageQueries },
  ] = await Promise.all([
    import("../application/use-cases/LinkContexts"),
    import("../application/use-cases/UnlinkContexts"),
    import("../application/use-cases/LineageQueries"),
  ]);

  return {
    linkContexts: new LinkContexts(infra.repository),
    unlinkContexts: new UnlinkContexts(infra.repository),
    lineageQueries: new LineageQueries(infra.repository),
  };
}
