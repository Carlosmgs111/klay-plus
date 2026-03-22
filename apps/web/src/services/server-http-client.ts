import type { ServiceResult } from "./types";

/** Encode ArrayBuffer content as base64 for JSON serialization over HTTP. */
export function encodeContentForTransport(body: Record<string, unknown>): Record<string, unknown> {
  if (body.content instanceof ArrayBuffer) {
    const bytes = new Uint8Array(body.content);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return { ...body, content: btoa(binary) };
  }
  return body;
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ServiceResult<T>> {
  try {
    const res = await fetch(path, options);
    const json = await res.json();
    // REST adapter returns { success, data/error } in body for all statuses
    return json as ServiceResult<T>;
  } catch (err) {
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : "Network error",
        code: "NETWORK_ERROR",
      },
    };
  }
}

export function serverPost<T>(path: string, body: unknown): Promise<ServiceResult<T>> {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function serverPut<T>(path: string, body: unknown): Promise<ServiceResult<T>> {
  return request(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function serverGet<T>(path: string): Promise<ServiceResult<T>> {
  return request(path);
}
