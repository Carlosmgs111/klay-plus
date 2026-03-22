import type { APIRoute } from "astro";
import { getConfigStore, invalidateAdapters } from "../../server/knowledge-singleton";

/**
 * GET /api/config — Load all config key-value pairs.
 */
export const GET: APIRoute = async () => {
  try {
    const store = await getConfigStore();
    const all = await store.loadAll();
    return new Response(JSON.stringify(all), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT /api/config — Set one or more config keys.
 * Body: { entries: Record<string, string>, reinitialize?: boolean }
 */
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { entries, reinitialize = false } = body as {
      entries?: Record<string, string>;
      reinitialize?: boolean;
    };

    if (!entries || typeof entries !== "object") {
      return new Response(JSON.stringify({ error: "Missing 'entries' object" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const store = await getConfigStore();
    for (const [key, value] of Object.entries(entries)) {
      if (value !== undefined && value !== "") {
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
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/config — Remove a config key.
 * Body: { key: string }
 */
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { key } = body as { key?: string };

    if (!key) {
      return new Response(JSON.stringify({ error: "Missing 'key' field" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const store = await getConfigStore();
    await store.remove(key);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
