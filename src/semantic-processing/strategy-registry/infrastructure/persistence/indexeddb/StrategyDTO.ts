import { ProcessingStrategy } from "../../../domain/ProcessingStrategy.js";
import { StrategyId } from "../../../domain/StrategyId.js";
import type { StrategyType } from "../../../domain/StrategyType.js";

export interface StrategyDTO {
  id: string;
  name: string;
  type: string;
  version: number;
  configuration: Record<string, unknown>;
  isActive: boolean;
  registeredAt: string;
}

export function toDTO(strategy: ProcessingStrategy): StrategyDTO {
  return {
    id: strategy.id.value,
    name: strategy.name,
    type: strategy.type,
    version: strategy.version,
    configuration: { ...strategy.configuration },
    isActive: strategy.isActive,
    registeredAt: strategy.registeredAt.toISOString(),
  };
}

export function fromDTO(dto: StrategyDTO): ProcessingStrategy {
  return ProcessingStrategy.reconstitute(
    StrategyId.create(dto.id),
    dto.name,
    dto.type as StrategyType,
    dto.version,
    dto.configuration,
    dto.isActive,
    new Date(dto.registeredAt),
  );
}
