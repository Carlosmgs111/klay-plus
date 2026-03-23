import type { FindExistingProjection, ExistingProjectionInfo } from "./FindExistingProjection";

export class GetProjectionsForSources {
  constructor(
    private readonly _findExistingProjection: FindExistingProjection,
  ) {}

  async execute(sourceIds: string[], profileId: string): Promise<Map<string, ExistingProjectionInfo>> {
    const result = new Map<string, ExistingProjectionInfo>();
    for (const sourceId of sourceIds) {
      const info = await this._findExistingProjection.execute(sourceId, profileId);
      if (info) result.set(sourceId, info);
    }
    return result;
  }
}
