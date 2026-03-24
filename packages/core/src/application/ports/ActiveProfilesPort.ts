/**
 * Cross-context port for listing active processing profiles.
 * Consumed by application-layer ReconcileProjections.
 * Implemented by ActiveProfilesAdapter (wraps semantic-processing ProfileQueries).
 */
export interface ActiveProfileRef {
  id: string;
}

export interface ActiveProfilesPort {
  listActiveProfiles(): Promise<ActiveProfileRef[]>;
}
