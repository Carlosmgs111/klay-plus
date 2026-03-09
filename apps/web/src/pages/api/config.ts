import type { APIRoute } from "astro";
import { getConfigStore, invalidateAdapters } from "../../server/pipeline-singleton";

/**
 * GET /api/config — Load all config key-value pairs.
 */
export const GET: APIRoute = async () => {
  const store = await getConfigStore();
  const all = await store.loadAll();
  return new Response(JSON.stringify(all), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * PUT /api/config — Set one or more config keys.
 * Body: { entries: Record<string, string>, reinitialize?: boolean }
 */
export const PUT: APIRoute = async ({ request }) => {
  const { entries, reinitialize = false } = (await request.json()) as {
    entries: Record<string, string>;
    reinitialize?: boolean;
  };

  const store = await getConfigStore();
  for (const [key, value] of Object.entries(entries)) {
    if (value) {
      await store.set(key, value);
    } else {
      await store.remove(key);
    }
  }

  if (reinitialize) {
    invalidateAdapters();
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * DELETE /api/config — Remove a config key.
 * Body: { key: string }
 */
export const DELETE: APIRoute = async ({ request }) => {
  const { key } = (await request.json()) as { key: string };
  const store = await getConfigStore();
  await store.remove(key);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
