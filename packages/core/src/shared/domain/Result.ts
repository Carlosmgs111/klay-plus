/**
 * Result Pattern - Functional Error Handling
 *
 * Provides a type-safe way to handle operations that can fail
 * without throwing exceptions. Forces explicit error handling.
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<DivisionError, number> {
 *   if (b === 0) return Result.fail(new DivisionByZeroError());
 *   return Result.ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.isOk()) {
 *   console.log(result.value); // 5
 * } else {
 *   console.log(result.error.message);
 * }
 * ```
 */
export class Result<E, T> {
  private readonly _isSuccess: boolean;
  private readonly _error?: E;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: E, value?: T) {
    this._isSuccess = isSuccess;
    this._error = error;
    this._value = value;

    Object.freeze(this);
  }

  // ─── Factory Methods ────────────────────────────────────────────────────────

  static ok<E, T>(value: T): Result<E, T> {
    return new Result<E, T>(true, undefined, value);
  }

  static fail<E, T>(error: E): Result<E, T> {
    return new Result<E, T>(false, error, undefined);
  }

  // ─── Type Guards ────────────────────────────────────────────────────────────

  isOk(): this is Result<never, T> & { value: T } {
    return this._isSuccess;
  }

  isFail(): this is Result<E, never> & { error: E } {
    return !this._isSuccess;
  }

  // ─── Accessors ──────────────────────────────────────────────────────────────

  get value(): T {
    if (!this._isSuccess) {
      throw new Error("Cannot get value from failed Result. Check isOk() first.");
    }
    return this._value as T;
  }

  get error(): E {
    if (this._isSuccess) {
      throw new Error("Cannot get error from successful Result. Check isFail() first.");
    }
    return this._error as E;
  }

  // ─── Transformations ────────────────────────────────────────────────────────

  /**
   * Transform the success value, leaving errors unchanged.
   */
  map<U>(fn: (value: T) => U): Result<E, U> {
    if (this._isSuccess) {
      return Result.ok(fn(this._value as T));
    }
    return Result.fail(this._error as E);
  }

  /**
   * Transform the error, leaving success values unchanged.
   */
  mapError<F>(fn: (error: E) => F): Result<F, T> {
    if (!this._isSuccess) {
      return Result.fail(fn(this._error as E));
    }
    return Result.ok(this._value as T);
  }

  /**
   * Chain operations that return Results.
   */
  flatMap<U>(fn: (value: T) => Result<E, U>): Result<E, U> {
    if (this._isSuccess) {
      return fn(this._value as T);
    }
    return Result.fail(this._error as E);
  }

  /**
   * Extract value with a fallback for errors.
   */
  getOrElse(defaultValue: T): T {
    return this._isSuccess ? (this._value as T) : defaultValue;
  }

  /**
   * Extract value or compute fallback from error.
   */
  getOrElseWith(fn: (error: E) => T): T {
    return this._isSuccess ? (this._value as T) : fn(this._error as E);
  }

  /**
   * Execute side effect on success.
   */
  onOk(fn: (value: T) => void): Result<E, T> {
    if (this._isSuccess) {
      fn(this._value as T);
    }
    return this;
  }

  /**
   * Execute side effect on failure.
   */
  onFail(fn: (error: E) => void): Result<E, T> {
    if (!this._isSuccess) {
      fn(this._error as E);
    }
    return this;
  }

  /**
   * Pattern match on Result.
   */
  match<U>(handlers: { ok: (value: T) => U; fail: (error: E) => U }): U {
    return this._isSuccess
      ? handlers.ok(this._value as T)
      : handlers.fail(this._error as E);
  }
}

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Combine multiple Results into a single Result containing an array.
 * If any Result is a failure, returns the first failure.
 */
export function combineResults<E, T>(results: Result<E, T>[]): Result<E, T[]> {
  const values: T[] = [];

  for (const result of results) {
    if (result.isFail()) {
      return Result.fail(result.error);
    }
    values.push(result.value);
  }

  return Result.ok(values);
}

/**
 * Wrap a function that might throw into a Result.
 */
export function tryCatch<E, T>(
  fn: () => T,
  onError: (error: unknown) => E,
): Result<E, T> {
  try {
    return Result.ok(fn());
  } catch (error) {
    return Result.fail(onError(error));
  }
}

/**
 * Wrap an async function that might throw into a Result.
 */
export async function tryCatchAsync<E, T>(
  fn: () => Promise<T>,
  onError: (error: unknown) => E,
): Promise<Result<E, T>> {
  try {
    const value = await fn();
    return Result.ok(value);
  } catch (error) {
    return Result.fail(onError(error));
  }
}
