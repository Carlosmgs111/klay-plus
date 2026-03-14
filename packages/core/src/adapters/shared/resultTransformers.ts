/**
 * Shared result transformation logic for REST and UI adapters.
 *
 * All adapters convert Result<E, T> (the DDD result type) into
 * framework-specific response shapes. This module centralizes that
 * conversion so each adapter only handles request → DTO mapping.
 */

// ── REST types ──────────────────────────────────────────────────────

/**
 * Framework-agnostic request representation.
 * Adapters for specific frameworks (Express, Hono, Astro, etc.)
 * can convert their native request to this shape.
 */
export interface RESTRequest {
  body: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

/**
 * Framework-agnostic response representation.
 */
export interface RESTResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

// ── UI types ────────────────────────────────────────────────────────

/**
 * Generic result type for UI consumption.
 * Unwraps the Result<E, T> pattern into a simpler success/error shape.
 */
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
 * Used by all REST adapters.
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
 * Used by all UI adapters.
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
