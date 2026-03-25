import type { ResourceInfrastructurePolicy } from "./factory";
import type { StoreResource } from "../application/use-cases/StoreResource";
import type { RegisterExternalResource } from "../application/use-cases/RegisterExternalResource";
import type { DeleteResource } from "../application/use-cases/DeleteResource";
import type { GetResource } from "../application/use-cases/GetResource";

export interface ResourceWiringResult {
  storeResource: StoreResource;
  registerExternalResource: RegisterExternalResource;
  deleteResource: DeleteResource;
  getResource: GetResource;
}

export async function resourceWiring(
  policy: ResourceInfrastructurePolicy,
): Promise<ResourceWiringResult> {
  const { resourceFactory } = await import("./factory");
  const { infra } = await resourceFactory(policy);

  const [
    { StoreResource },
    { RegisterExternalResource },
    { DeleteResource },
    { GetResource },
  ] = await Promise.all([
    import("../application/use-cases/StoreResource"),
    import("../application/use-cases/RegisterExternalResource"),
    import("../application/use-cases/DeleteResource"),
    import("../application/use-cases/GetResource"),
  ]);

  return {
    storeResource: new StoreResource(infra.repository, infra.storage, infra.storageProvider, infra.eventPublisher),
    registerExternalResource: new RegisterExternalResource(infra.repository, infra.eventPublisher),
    deleteResource: new DeleteResource(infra.repository, infra.storage, infra.eventPublisher),
    getResource: new GetResource(infra.repository),
  };
}
