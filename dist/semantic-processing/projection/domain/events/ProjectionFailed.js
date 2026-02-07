export class ProjectionFailed {
    static EVENT_TYPE = "semantic-processing.projection.failed";
    static is(event) {
        return event.eventType === ProjectionFailed.EVENT_TYPE;
    }
}
//# sourceMappingURL=ProjectionFailed.js.map