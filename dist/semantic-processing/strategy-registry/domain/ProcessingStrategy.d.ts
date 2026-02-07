import { AggregateRoot } from "../../../shared/domain/index.js";
import { StrategyId } from "./StrategyId.js";
import type { StrategyType } from "./StrategyType.js";
export declare class ProcessingStrategy extends AggregateRoot<StrategyId> {
    private _name;
    private _type;
    private _version;
    private _configuration;
    private _isActive;
    private _registeredAt;
    private constructor();
    get name(): string;
    get type(): StrategyType;
    get version(): number;
    get configuration(): Readonly<Record<string, unknown>>;
    get isActive(): boolean;
    get registeredAt(): Date;
    static register(id: StrategyId, name: string, type: StrategyType, configuration?: Record<string, unknown>): ProcessingStrategy;
    static reconstitute(id: StrategyId, name: string, type: StrategyType, version: number, configuration: Record<string, unknown>, isActive: boolean, registeredAt: Date): ProcessingStrategy;
    upgradeVersion(newConfiguration: Record<string, unknown>): void;
    activate(): void;
    deactivate(): void;
}
//# sourceMappingURL=ProcessingStrategy.d.ts.map