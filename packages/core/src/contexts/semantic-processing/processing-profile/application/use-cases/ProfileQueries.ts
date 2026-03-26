import type { ProcessingProfileRepository } from "../../domain/ProcessingProfileRepository";
import { ProcessingProfileId } from "../../domain/ProcessingProfileId";
import { ProfileStatus } from "../../domain/ProfileStatus";
import type { ProcessingProfile } from "../../domain/ProcessingProfile";

// ── Boundary DTOs ────────────────────────────────────────────────────

export interface ListProfilesResult {
  profiles: Array<{
    id: string;
    name: string;
    version: number;
    preparation: { strategyId: string; config: Record<string, unknown> };
    fragmentation: { strategyId: string; config: Record<string, unknown> };
    projection: { strategyId: string; config: Record<string, unknown> };
    status: string;
    createdAt: string;
  }>;
}

/**
 * ProfileQueries — Consolidated read-side use cases for semantic-processing profiles.
 *
 * Merges: GetProcessingProfile, ListProcessingProfiles
 */
export class ProfileQueries {
  constructor(
    private readonly _repo: ProcessingProfileRepository,
  ) {}

  // From GetProcessingProfile — raw aggregate
  getById(profileId: string): Promise<ProcessingProfile | null> {
    return this._repo.findById(ProcessingProfileId.create(profileId));
  }

  // From ListProcessingProfiles — sorted: Active first, then by createdAt desc
  async listAll(): Promise<ProcessingProfile[]> {
    const profiles = await this._repo.findAll();
    return profiles.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === ProfileStatus.Active ? -1 : 1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  // Convenience: list only active profiles
  async listActive(): Promise<ProcessingProfile[]> {
    const all = await this.listAll();
    return all.filter((p) => p.status === ProfileStatus.Active);
  }
}
