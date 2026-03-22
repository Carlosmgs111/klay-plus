import type { APIRoute } from "astro";
import { getCoordinator } from "../../../server/knowledge-singleton";
import { toRESTResponse } from "@klay/core/result";

export const GET: APIRoute = async ({ url }) => {
  const coordinator = await getCoordinator();
  const id = url.searchParams.get("id");
  const summary = url.searchParams.get("summary");

  let result;
  if (id) {
    // GET /api/pipeline/contexts?id=xxx → getContextDetails
    result = toRESTResponse(await coordinator.contexts.get({ contextId: id }));
  } else if (summary === "true") {
    // GET /api/pipeline/contexts?summary=true → listContextsSummary
    result = toRESTResponse(await coordinator.contexts.list());
  } else {
    // GET /api/pipeline/contexts → listContexts (simple list)
    result = toRESTResponse(await coordinator.contexts.listRefs());
  }

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
