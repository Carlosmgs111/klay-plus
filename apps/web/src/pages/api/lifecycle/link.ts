import type { APIRoute } from "astro";
import { getCoordinator } from "../../../server/knowledge-singleton";
import { toRESTResponse } from "@klay/core/result";
import { mapResult, mapLinkResult, mapLinkInput } from "../../../services/knowledge-mappers";

export const POST: APIRoute = async ({ request }) => {
  const app = await getCoordinator();
  const body = await request.json();
  const raw = await app.contextManagement.linkContexts.execute(mapLinkInput(body));
  const result = toRESTResponse(mapResult(raw, mapLinkResult));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
