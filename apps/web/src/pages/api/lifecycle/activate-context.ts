import type { APIRoute } from "astro";
import { getLifecycleAdapter } from "../../../server/pipeline-singleton";

export const POST: APIRoute = async ({ request }) => {
  const adapter = await getLifecycleAdapter();
  const body = await request.json();
  const result = await adapter.activateContext({ body });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
