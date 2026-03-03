export interface RemoveSourceInput {
  contextId: string;
  sourceId: string;
}

export interface RemoveSourceResult {
  contextId: string;
  version: number;
}

export interface ReprocessContextInput {
  contextId: string;
  profileId: string;
}

export interface ReprocessContextResult {
  contextId: string;
  version: number;
}

export interface RollbackContextInput {
  contextId: string;
  targetVersion: number;
}

export interface RollbackContextResult {
  contextId: string;
  currentVersion: number;
}

export interface LinkContextsInput {
  sourceContextId: string;
  targetContextId: string;
  relationshipType: string;
}

export interface LinkContextsResult {
  sourceContextId: string;
  targetContextId: string;
}

export interface UnlinkContextsInput {
  sourceContextId: string;
  targetContextId: string;
}

export interface UnlinkContextsResult {
  sourceContextId: string;
  targetContextId: string;
}
