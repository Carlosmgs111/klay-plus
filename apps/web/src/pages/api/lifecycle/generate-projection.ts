// Removed — use pipeline.processDocument via /api/pipeline/process instead.
// This file is kept to avoid 404s during transition.
import type { APIRoute } from "astro";

export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({ success: false, error: { message: "Removed. Use POST /api/pipeline/process instead.", code: "DEPRECATED" } }),
    { status: 410, headers: { "Content-Type": "application/json" } },
  );
};
