import type { APIRoute } from "astro";
import { getCoordinator } from "../../../server/knowledge-singleton";
import { executeListProfiles, executeCreateProfile, executeUpdateProfile } from "@klay/core";
import { toRESTResponse } from "@klay/core/result";

export const GET: APIRoute = async () => {
  const app = await getCoordinator();
  const result = toRESTResponse(await executeListProfiles(app.profileQueries));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const app = await getCoordinator();
  const body = await request.json();
  const result = toRESTResponse(await executeCreateProfile(app.createProcessingProfile, body));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const app = await getCoordinator();
  const body = await request.json();
  const result = toRESTResponse(await executeUpdateProfile(app.updateProcessingProfile, body));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
