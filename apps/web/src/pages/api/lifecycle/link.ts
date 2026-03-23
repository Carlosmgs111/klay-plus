import type { APIRoute } from "astro";
import { getCoordinator } from "../../../server/knowledge-singleton";
import { executeLinkContexts } from "@klay/core";
import { toRESTResponse } from "@klay/core/result";

export const POST: APIRoute = async ({ request }) => {
  const app = await getCoordinator();
  const body = await request.json();
  const result = toRESTResponse(await executeLinkContexts(app.linkContexts, body));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
