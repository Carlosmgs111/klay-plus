import type { APIRoute } from "astro";
import { getLifecycleAdapter } from "../../../server/pipeline-singleton";

export const POST: APIRoute = async ({ request }) => {
  const adapter = await getLifecycleAdapter();
  const body = await request.json();

  if (!body?.sourceId || !body?.processingProfileId) {
    return new Response(
      JSON.stringify({ success: false, error: { message: "sourceId and processingProfileId are required", code: "VALIDATION_ERROR" } }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const result = await adapter.generateProjection({ body });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
