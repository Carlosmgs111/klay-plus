import type { APIRoute } from "astro";
import { getServerAdapter } from "../../../server/pipeline-singleton";

export const GET: APIRoute = async ({ url }) => {
  const adapter = await getServerAdapter();
  const query: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    query[key] = value;
  }
  const result = await adapter.getManifest({ body: {}, query });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
