import { UniqueId } from "../../../../shared/domain";

export class QueryId extends UniqueId {
  static override create(value: string): QueryId {
    if (!value || value.trim().length === 0) {
      throw new Error("QueryId cannot be empty");
    }
    return new QueryId({ value });
  }
}
