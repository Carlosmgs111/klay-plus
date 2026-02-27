export { Source } from "./Source";
export { SourceId } from "./SourceId";
export { SourceType } from "./SourceType";
export { SourceVersion } from "./SourceVersion";
export type { SourceRepository } from "./SourceRepository";

export { SourceRegistered } from "./events/SourceRegistered";
export { SourceUpdated } from "./events/SourceUpdated";
export { SourceExtracted } from "./events/SourceExtracted";

// Domain Errors
export {
  SourceNotFoundError,
  SourceAlreadyExistsError,
  SourceNameRequiredError,
  SourceUriRequiredError,
  SourceInvalidUriError,
  SourceInvalidTypeError,
  type SourceError,
} from "./errors";
