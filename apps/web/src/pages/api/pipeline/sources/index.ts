import type { APIRoute } from "astro";
import { getCoordinator } from "../../../../server/knowledge-singleton";
import { mapSourcesToDTO } from "../../../../services/knowledge-mappers";

export const GET: APIRoute = async () => {
  const app = await getCoordinator();
  try {
    const sources = await app.sourceIngestion.sourceQueries.listAll();
    return new Response(JSON.stringify({ success: true, data: mapSourcesToDTO(sources) }), {
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
