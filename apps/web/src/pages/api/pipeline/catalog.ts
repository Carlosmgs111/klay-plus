import type { APIRoute } from "astro";
import { getServerAdapter } from "../../../server/pipeline-singleton";

export const POST: APIRoute = async ({ request }) => {
  const adapter = await getServerAdapter();
  const body = await request.json();
  const result = await adapter.catalogDocument({ body });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
