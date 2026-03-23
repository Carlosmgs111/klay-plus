import type { APIRoute } from "astro";
import { getCoordinator } from "../../../server/knowledge-singleton";
import { toRESTResponse } from "@klay/core/result";

export const POST: APIRoute = async ({ request }) => {
  const app = await getCoordinator();
  const body = await request.json();

  // Decode base64-encoded content back to ArrayBuffer for extractors
  if (typeof body.content === "string") {
    const binary = Buffer.from(body.content, "base64");
    body.content = binary.buffer.slice(
      binary.byteOffset,
      binary.byteOffset + binary.byteLength,
    );
  }

  const result = toRESTResponse(await app.processKnowledge.execute(body));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
