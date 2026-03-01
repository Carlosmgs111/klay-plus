export interface RemoveSourceInput {
  unitId: string;
  sourceId: string;
}

export interface RemoveSourceResult {
  unitId: string;
  version: number;
}

export interface ReprocessUnitInput {
  unitId: string;
  profileId: string;
}

export interface ReprocessUnitResult {
  unitId: string;
  version: number;
}

export interface RollbackUnitInput {
  unitId: string;
  targetVersion: number;
}

export interface RollbackUnitResult {
  unitId: string;
  currentVersion: number;
}

export interface LinkUnitsInput {
  sourceUnitId: string;
  targetUnitId: string;
  relationshipType: string;
}

export interface LinkUnitsResult {
  sourceUnitId: string;
  targetUnitId: string;
}

export interface UnlinkUnitsInput {
  sourceUnitId: string;
  targetUnitId: string;
}

export interface UnlinkUnitsResult {
  sourceUnitId: string;
  targetUnitId: string;
}
