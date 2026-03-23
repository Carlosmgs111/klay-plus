import type { APIRoute } from "astro";
import { getCoordinator } from "../../../../../server/knowledge-singleton";
import { toRESTResponse } from "@klay/core/result";

export const GET: APIRoute = async ({ params }) => {
  const app = await getCoordinator();
  const result = toRESTResponse(await app.contextQueries.listBySource(params.id!));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
