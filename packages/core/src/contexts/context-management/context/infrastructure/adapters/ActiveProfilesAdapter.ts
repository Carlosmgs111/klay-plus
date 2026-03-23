import type { ListProcessingProfiles } from "../../../../semantic-processing/processing-profile/application/use-cases/ListProcessingProfiles";
import type { ActiveProfileRef, ActiveProfilesPort } from "../../application/ports/ActiveProfilesPort";

/**
 * Adapts ListProcessingProfiles use case to the ActiveProfilesPort interface.
 */
export class ActiveProfilesAdapter implements ActiveProfilesPort {
  constructor(private readonly _listProfiles: ListProcessingProfiles) {}

  async listActiveProfiles(): Promise<ActiveProfileRef[]> {
    const all = await this._listProfiles.execute();
    return all
      .filter((p) => p.status === "ACTIVE")
      .map((p) => ({ id: p.id.value }));
  }
}
