import type { APIRoute } from "astro";
import { getCoordinator } from "../../../server/knowledge-singleton";
import { toRESTResponse } from "@klay/core/result";
import { mapResult, mapLineageResult } from "../../../services/knowledge-mappers";

export const POST: APIRoute = async ({ request }) => {
  const app = await getCoordinator();
  const body = await request.json();
  const raw = await app.contextManagement.lineageQueries.getLineage(body.contextId);
  const result = toRESTResponse(mapResult(raw, mapLineageResult));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
