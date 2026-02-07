export class Entity {
    _id;
    constructor(_id) {
        this._id = _id;
    }
    get id() {
        return this._id;
    }
    equals(other) {
        if (other === null || other === undefined)
            return false;
        if (!(other instanceof Entity))
            return false;
        return this._id === other._id;
    }
}
//# sourceMappingURL=Entity.js.map