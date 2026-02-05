import { AggregateRoot } from "../../../shared/domain/index.js";
import { StrategyId } from "./StrategyId.js";
import type { StrategyType } from "./StrategyType.js";

export class ProcessingStrategy extends AggregateRoot<StrategyId> {
  private _name: string;
  private _type: StrategyType;
  private _version: number;
  private _configuration: Readonly<Record<string, unknown>>;
  private _isActive: boolean;
  private _registeredAt: Date;

  private constructor(
    id: StrategyId,
    name: string,
    type: StrategyType,
    version: number,
    configuration: Record<string, unknown>,
    isActive: boolean,
    registeredAt: Date,
  ) {
    super(id);
    this._name = name;
    this._type = type;
    this._version = version;
    this._configuration = Object.freeze({ ...configuration });
    this._isActive = isActive;
    this._registeredAt = registeredAt;
  }

  get name(): string {
    return this._name;
  }

  get type(): StrategyType {
    return this._type;
  }

  get version(): number {
    return this._version;
  }

  get configuration(): Readonly<Record<string, unknown>> {
    return this._configuration;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get registeredAt(): Date {
    return this._registeredAt;
  }

  static register(
    id: StrategyId,
    name: string,
    type: StrategyType,
    configuration: Record<string, unknown> = {},
  ): ProcessingStrategy {
    if (!name) throw new Error("ProcessingStrategy name is required");
    return new ProcessingStrategy(id, name, type, 1, configuration, true, new Date());
  }

  static reconstitute(
    id: StrategyId,
    name: string,
    type: StrategyType,
    version: number,
    configuration: Record<string, unknown>,
    isActive: boolean,
    registeredAt: Date,
  ): ProcessingStrategy {
    return new ProcessingStrategy(id, name, type, version, configuration, isActive, registeredAt);
  }

  upgradeVersion(newConfiguration: Record<string, unknown>): void {
    this._version += 1;
    this._configuration = Object.freeze({ ...newConfiguration });
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }
}
