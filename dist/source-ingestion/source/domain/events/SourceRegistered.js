export class SourceRegistered {
    static EVENT_TYPE = "source-ingestion.source.registered";
    static is(event) {
        return event.eventType === SourceRegistered.EVENT_TYPE;
    }
}
//# sourceMappingURL=SourceRegistered.js.map