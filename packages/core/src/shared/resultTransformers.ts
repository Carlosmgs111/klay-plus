/**
 * Result transformation utilities for REST and UI consumers.
 *
 * Converts Result<E, T> (the DDD result type) into framework-specific
 * response shapes. Exported via @klay/core/result.
 */

// ── REST types ──────────────────────────────────────────────────────

export interface RESTResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

// ── UI types ────────────────────────────────────────────────────────

export type UIResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        message: string;
        code: string;
        step?: string;
        completedSteps?: string[];
      };
    };

// ── Shared result shape ─────────────────────────────────────────────

/** Minimal shape that all Result<E, T> instances satisfy. */
interface ResultLike<T> {
  isOk(): boolean;
  value: T;
  error: any;
}

// ── Transformers ────────────────────────────────────────────────────

/**
 * Convert a Result<E, T> into a RESTResponse.
 */
export function toRESTResponse<T>(result: ResultLike<T>): RESTResponse {
  if (result.isOk()) {
    return {
      status: 200,
      body: { success: true, data: result.value },
      headers: { "Content-Type": "application/json" },
    };
  }

  const error = result.error;
  return {
    status: 422,
    body: {
      success: false,
      error: {
        message: error.message ?? "Unknown error",
        code: error.code ?? "UNKNOWN",
        step: error.step,
        completedSteps: error.completedSteps,
      },
    },
    headers: { "Content-Type": "application/json" },
  };
}

/**
 * Unwrap a Result<E, T> into a UIResult<T>.
 */
export function unwrapResult<T>(result: ResultLike<T>): UIResult<T> {
  if (result.isOk()) {
    return { success: true, data: result.value };
  }

  const error = result.error;
  return {
    success: false,
    error: {
      message: error.message ?? "Unknown error",
      code: error.code ?? "UNKNOWN",
      step: error.step,
      completedSteps: error.completedSteps,
    },
  };
}
