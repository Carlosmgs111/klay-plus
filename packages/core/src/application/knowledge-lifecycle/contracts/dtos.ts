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

export interface CreateContextInput {
  id: string;
  name: string;
  description: string;
  language: string;
  requiredProfileId: string;
  createdBy: string;
  tags?: string[];
  attributes?: Record<string, string>;
}

export interface CreateContextResult {
  contextId: string;
  state: string;
}

export interface ArchiveContextInput {
  contextId: string;
}

export interface ArchiveContextResult {
  contextId: string;
  state: string;
}

export interface DeprecateContextInput {
  contextId: string;
  reason: string;
}

export interface DeprecateContextResult {
  contextId: string;
  state: string;
}

export interface ActivateContextInput {
  contextId: string;
}

export interface ActivateContextResult {
  contextId: string;
  state: string;
}

export interface GetContextLineageInput {
  contextId: string;
}

export interface GetContextLineageResult {
  contextId: string;
  traces: Array<{
    fromContextId: string;
    toContextId: string;
    relationship: string;
    createdAt: string;
  }>;
}
