import type { APIRoute } from "astro";
import { getCoordinator } from "../../../server/knowledge-singleton";
import { toRESTResponse } from "@klay/core/result";

export const GET: APIRoute = async ({ url }) => {
  const app = await getCoordinator();
  const id = url.searchParams.get("id");
  const summary = url.searchParams.get("summary");

  let result;
  if (id) {
    // GET /api/pipeline/contexts?id=xxx → getContextDetails
    result = toRESTResponse(await app.contextManagement.contextReadModel.getDetail(id));
  } else if (summary === "true") {
    // GET /api/pipeline/contexts?summary=true → listContextsSummary
    result = toRESTResponse(await app.contextManagement.contextReadModel.listSummary());
  } else {
    // GET /api/pipeline/contexts → listContexts (simple list)
    result = toRESTResponse(await app.contextManagement.contextQueries.listRefs());
  }

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
