import { getStore } from "@netlify/blobs";

// Presenter PIN: set PRESENTER_PIN in Netlify > Site configuration > Environment variables.
const PIN = () => (globalThis.Netlify?.env?.get("PRESENTER_PIN")) || process.env.PRESENTER_PIN || "iceberg";
const json = (o, status = 200, headers = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", ...headers } });
const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, "").slice(0, n);

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore({ name: "titanic-tastes", consistency: "strong" });
  const path = url.pathname;

  if (path === "/api/state") {
    if (req.method === "GET") {
      const s = (await store.get("state", { type: "json" })) || { stage: 0, epoch: 0, enRouteAt: null, resetAt: 0 };
      return json(
        { stage: s.stage, epoch: s.epoch, resetAt: s.resetAt || 0, elapsed: s.enRouteAt ? Date.now() - s.enRouteAt : 0 },
        200,
        { "cache-control": "public, max-age=0, must-revalidate", "netlify-cdn-cache-control": "public, s-maxage=2, stale-while-revalidate=2" }
      );
    }
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      if (b.pin !== PIN()) return json({ error: "bad_pin" }, 401);
      const stage = Math.max(0, Math.min(4, b.stage | 0));
      const prev = (await store.get("state", { type: "json" })) || {};
      const epoch = b.reset || !prev.epoch ? Date.now() : prev.epoch;
      let enRouteAt = null;
      if (stage === 2) enRouteAt = prev.stage === 2 && prev.epoch === epoch && prev.enRouteAt ? prev.enRouteAt : Date.now();
      if (stage >= 3) enRouteAt = prev.enRouteAt || Date.now();
      const resetAt = b.home ? Date.now() : prev.resetAt || 0;
      await store.setJSON("state", { stage, epoch, enRouteAt, resetAt });
      return json({ stage, epoch, resetAt, elapsed: enRouteAt ? Date.now() - enRouteAt : 0 });
    }
  }

  if (path === "/api/guest") {
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const id = String(b.id || "");
      if (!/^[a-z0-9]{8,32}$/.test(id)) return json({ error: "bad_id" }, 400);
      const r = Math.max(0, Math.min(5, b.r | 0));
      const rec = {
        n: clean(b.n, 30), o: b.o ? 1 : 0, q: Math.max(0, Math.min(99, b.q | 0)), r,
        t: Array.isArray(b.t) ? b.t.slice(0, 5).map((x) => clean(x, 24)) : [],
        c: clean(b.c, 200), ra: Number(b.ra) || 0, seen: Date.now(),
      };
      await store.setJSON("g/" + id, rec);
      return json({ ok: true });
    }
    if (req.method === "DELETE") {
      if (url.searchParams.get("pin") !== PIN()) return json({ error: "bad_pin" }, 401);
      const { blobs } = await store.list({ prefix: "g/" });
      await Promise.all(blobs.map((x) => store.delete(x.key)));
      return json({ ok: true, cleared: blobs.length });
    }
  }

  if (path === "/api/stats" && req.method === "GET") {
    if (url.searchParams.get("pin") !== PIN()) return json({ error: "bad_pin" }, 401);
    const { blobs } = await store.list({ prefix: "g/" });
    const guests = (await Promise.all(blobs.map((x) => store.get(x.key, { type: "json" })))).filter(Boolean);
    return json({ guests }, 200, { "cache-control": "no-store" });
  }

  return json({ error: "not_found" }, 404);
};

export const config = { path: ["/api/state", "/api/guest", "/api/stats"] };
