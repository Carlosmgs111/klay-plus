import type { APIRoute } from "astro";
import { getManagementAdapter } from "../../../server/pipeline-singleton";

export const POST: APIRoute = async ({ request }) => {
  const adapter = await getManagementAdapter();
  const body = await request.json();
  const result = await adapter.ingestAndAddSource({ body });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
