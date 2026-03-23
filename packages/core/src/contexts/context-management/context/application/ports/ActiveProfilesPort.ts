/**
 * Port for listing active processing profiles.
 * Consumed by ReconcileAllProfiles use case.
 * Implemented by ActiveProfilesAdapter (wraps SemanticProcessingService).
 */
export interface ActiveProfileRef {
  id: string;
}

export interface ActiveProfilesPort {
  listActiveProfiles(): Promise<ActiveProfileRef[]>;
}
