import { AggregateRoot } from "../../../shared/domain/index.js";
export class ProcessingStrategy extends AggregateRoot {
    _name;
    _type;
    _version;
    _configuration;
    _isActive;
    _registeredAt;
    constructor(id, name, type, version, configuration, isActive, registeredAt) {
        super(id);
        this._name = name;
        this._type = type;
        this._version = version;
        this._configuration = Object.freeze({ ...configuration });
        this._isActive = isActive;
        this._registeredAt = registeredAt;
    }
    get name() {
        return this._name;
    }
    get type() {
        return this._type;
    }
    get version() {
        return this._version;
    }
    get configuration() {
        return this._configuration;
    }
    get isActive() {
        return this._isActive;
    }
    get registeredAt() {
        return this._registeredAt;
    }
    static register(id, name, type, configuration = {}) {
        if (!name)
            throw new Error("ProcessingStrategy name is required");
        return new ProcessingStrategy(id, name, type, 1, configuration, true, new Date());
    }
    static reconstitute(id, name, type, version, configuration, isActive, registeredAt) {
        return new ProcessingStrategy(id, name, type, version, configuration, isActive, registeredAt);
    }
    upgradeVersion(newConfiguration) {
        this._version += 1;
        this._configuration = Object.freeze({ ...newConfiguration });
    }
    activate() {
        this._isActive = true;
    }
    deactivate() {
        this._isActive = false;
    }
}
//# sourceMappingURL=ProcessingStrategy.js.map