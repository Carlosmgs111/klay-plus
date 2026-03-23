import type { ProfileQueries } from "../../../../semantic-processing/processing-profile/application/use-cases/ProfileQueries";
import type { ActiveProfileRef, ActiveProfilesPort } from "../../application/ports/ActiveProfilesPort";

/**
 * Adapts ProfileQueries to the ActiveProfilesPort interface.
 * Updated to use ProfileQueries.listActive() directly.
 */
export class ActiveProfilesAdapter implements ActiveProfilesPort {
  constructor(private readonly _profileQueries: ProfileQueries) {}

  async listActiveProfiles(): Promise<ActiveProfileRef[]> {
    const active = await this._profileQueries.listActive();
    return active.map((p) => ({ id: p.id.value }));
  }
}
