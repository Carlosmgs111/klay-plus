import type { APIRoute } from "astro";
import { getCoordinator } from "../../../../server/knowledge-singleton";
import { executeListSources } from "@klay/core";
import { toRESTResponse } from "@klay/core/result";

export const GET: APIRoute = async () => {
  const app = await getCoordinator();
  const result = toRESTResponse(await executeListSources(app.sourceQueries));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
