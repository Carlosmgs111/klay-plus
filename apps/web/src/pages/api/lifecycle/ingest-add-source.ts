import type { APIRoute } from "astro";
import { getManagementAdapter } from "../../../server/pipeline-singleton";

export const POST: APIRoute = async ({ request }) => {
  const adapter = await getManagementAdapter();
  const body = await request.json();

  // Decode base64-encoded content back to ArrayBuffer for extractors
  if (typeof body.content === "string") {
    const binary = Buffer.from(body.content, "base64");
    body.content = binary.buffer.slice(
      binary.byteOffset,
      binary.byteOffset + binary.byteLength,
    );
  }

  const result = await adapter.ingestAndAddSource({ body });
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
