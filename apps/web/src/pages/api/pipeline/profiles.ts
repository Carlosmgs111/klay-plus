import type { APIRoute } from "astro";
import { getCoordinator } from "../../../server/knowledge-singleton";
import { toRESTResponse } from "@klay/core/result";

export const GET: APIRoute = async () => {
  const coordinator = await getCoordinator();
  const result = toRESTResponse(await coordinator.listProfiles());
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const coordinator = await getCoordinator();
  const body = await request.json();
  const result = toRESTResponse(await coordinator.createProfile(body));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const coordinator = await getCoordinator();
  const body = await request.json();
  const result = toRESTResponse(await coordinator.updateProfile(body));
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};
