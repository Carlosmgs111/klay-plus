// Removed — use pipeline.addExistingSourceToContext via /api/pipeline/add-existing-source instead.
// This file is kept empty to avoid 404s during transition.
import type { APIRoute } from "astro";

export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({ success: false, error: { message: "Removed. Use POST /api/pipeline/add-existing-source instead.", code: "DEPRECATED" } }),
    { status: 410, headers: { "Content-Type": "application/json" } },
  );
};
