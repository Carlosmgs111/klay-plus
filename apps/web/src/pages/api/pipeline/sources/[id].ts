import type { APIRoute } from "astro";
import { getCoordinator } from "../../../../server/knowledge-singleton";
import { mapSourceToDetailDTO } from "../../../../services/knowledge-mappers";

export const GET: APIRoute = async ({ params }) => {
  const app = await getCoordinator();
  try {
    const source = await app.sourceIngestion.sourceQueries.getById(params.id!);
    if (!source) {
      return new Response(JSON.stringify({ success: false, error: { message: `Source ${params.id} not found`, code: "SOURCE_NOT_FOUND" } }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true, data: await mapSourceToDetailDTO(source, app.sourceIngestion.sourceQueries) }), {
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
