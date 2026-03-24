import type { ProfileQueries } from "../../contexts/semantic-processing/processing-profile/application/use-cases/ProfileQueries";
import type { ActiveProfileRef, ActiveProfilesPort } from "../ports/ActiveProfilesPort";

export class ActiveProfilesAdapter implements ActiveProfilesPort {
  constructor(private readonly _profileQueries: ProfileQueries) {}

  async listActiveProfiles(): Promise<ActiveProfileRef[]> {
    const active = await this._profileQueries.listActive();
    return active.map((p) => ({ id: p.id.value }));
  }
}
