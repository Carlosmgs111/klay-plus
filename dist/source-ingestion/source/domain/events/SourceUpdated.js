export class SourceUpdated {
    static EVENT_TYPE = "source-ingestion.source.updated";
    static is(event) {
        return event.eventType === SourceUpdated.EVENT_TYPE;
    }
}
//# sourceMappingURL=SourceUpdated.js.map