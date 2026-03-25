import type { APIRoute } from "astro";
import { getCoordinator } from "../../../server/knowledge-singleton";
import { toRESTResponse } from "@klay/core/result";
import { mapProfilesToDTO } from "../../../services/knowledge-mappers";

export const GET: APIRoute = async () => {
  const app = await getCoordinator();
  try {
    const profiles = await app.semanticProcessing.profileQueries.listAll();
    return new Response(JSON.stringify({ success: true, data: mapProfilesToDTO(profiles) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: { message: error?.message ?? "Unknown error", code: "UNKNOWN" } }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const app = await getCoordinator();
  const body = await request.json();
  const result = toRESTResponse(await app.semanticProcessing.createProcessingProfile.execute(body));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const app = await getCoordinator();
  const body = await request.json();
  const result = toRESTResponse(await app.semanticProcessing.updateProcessingProfile.execute(body));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
