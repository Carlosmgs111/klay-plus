import type { ProcessingProfileRepository } from "../domain/ProcessingProfileRepository.js";

export interface ProcessingProfileInfrastructurePolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  [key: string]: unknown;
}

export interface ResolvedProcessingProfileInfra {
  repository: ProcessingProfileRepository;
}
