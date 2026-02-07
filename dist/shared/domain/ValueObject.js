export class ValueObject {
    props;
    constructor(props) {
        this.props = Object.freeze(props);
    }
    equals(other) {
        if (other === null || other === undefined)
            return false;
        return JSON.stringify(this.props) === JSON.stringify(other.props);
    }
}
//# sourceMappingURL=ValueObject.js.map