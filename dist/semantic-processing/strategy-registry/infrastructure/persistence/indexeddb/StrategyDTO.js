import { ProcessingStrategy } from "../../../domain/ProcessingStrategy.js";
import { StrategyId } from "../../../domain/StrategyId.js";
export function toDTO(strategy) {
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
export function fromDTO(dto) {
    return ProcessingStrategy.reconstitute(StrategyId.create(dto.id), dto.name, dto.type, dto.version, dto.configuration, dto.isActive, new Date(dto.registeredAt));
}
//# sourceMappingURL=StrategyDTO.js.map