export declare abstract class Entity<Id> {
    protected readonly _id: Id;
    constructor(_id: Id);
    get id(): Id;
    equals(other: Entity<Id>): boolean;
}
//# sourceMappingURL=Entity.d.ts.map