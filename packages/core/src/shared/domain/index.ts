export { Entity } from "./Entity.js";
export { AggregateRoot } from "./AggregateRoot.js";
export { ValueObject } from "./ValueObject.js";
export { UniqueId } from "./UniqueId.js";
export type { DomainEvent } from "./DomainEvent.js";
export type { Repository } from "./Repository.js";
export type { EventPublisher } from "./EventPublisher.js";

// Result Pattern
export { Result, combineResults, tryCatch, tryCatchAsync } from "./Result.js";

// Domain Errors
export {
  DomainError,
  NotFoundError,
  AlreadyExistsError,
  ValidationError,
  InvalidStateError,
  OperationError,
} from "./errors/index.js";

// Provider Registry Pattern
export type { ProviderFactory, InfrastructurePolicy } from "./ProviderFactory.js";
export type { ProviderRegistry } from "./ProviderRegistry.js";
