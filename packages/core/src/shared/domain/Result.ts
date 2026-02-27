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

  static ok<E, T>(value: T): Result<E, T> {
    return new Result<E, T>(true, undefined, value);
  }

  static fail<E, T>(error: E): Result<E, T> {
    return new Result<E, T>(false, error, undefined);
  }

  isOk(): this is Result<never, T> & { value: T } {
    return this._isSuccess;
  }

  isFail(): this is Result<E, never> & { error: E } {
    return !this._isSuccess;
  }

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
