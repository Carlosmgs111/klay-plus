export abstract class Entity<Id> {
  constructor(protected readonly _id: Id) {}

  get id(): Id {
    return this._id;
  }

  equals(other: Entity<Id>): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }
}
