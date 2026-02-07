import { ProcessingStrategy } from "../../../domain/ProcessingStrategy.js";
export interface StrategyDTO {
    id: string;
    name: string;
    type: string;
    version: number;
    configuration: Record<string, unknown>;
    isActive: boolean;
    registeredAt: string;
}
export declare function toDTO(strategy: ProcessingStrategy): StrategyDTO;
export declare function fromDTO(dto: StrategyDTO): ProcessingStrategy;
//# sourceMappingURL=StrategyDTO.d.ts.map