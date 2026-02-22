// ─── Runtime Mode ────────────────────────────────────────────────────────────

export type RuntimeMode = "server" | "browser";

// ─── Service Result ──────────────────────────────────────────────────────────

/**
 * Generic result type for service consumption.
 * Same shape as UIResult from @klay/core but defined independently
 * to avoid runtime dependency on core in type-only contexts.
 */
export type ServiceResult<T> =
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
