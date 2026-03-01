import type { APIRoute } from "astro";
import { getServerAdapter } from "../../../server/pipeline-singleton";

export const GET: APIRoute = async () => {
  const adapter = await getServerAdapter();
  const result = await adapter.listProfiles({ body: null });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const adapter = await getServerAdapter();
  const body = await request.json();
  const result = await adapter.createProcessingProfile({ body });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const adapter = await getServerAdapter();
  const body = await request.json();
  const result = await adapter.updateProfile({ body });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
