import { createFileRoute } from "@tanstack/react-router";

const BASE = "https://credenciamento.eletrofrio.com.br:5900/galileo/api/api_hackathon";

async function forward(request: Request, params: { _splat?: string }) {
  const url = new URL(request.url);
  const target = `${BASE}?${url.searchParams.toString()}`;
  const init: RequestInit = {
    method: request.method,
    headers: { "content-type": "application/json" },
  };
  if (request.method === "POST") {
    init.body = await request.text();
  }
  try {
    const res = await fetch(target, init);
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}

export const Route = createFileRoute("/api/proxy/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => forward(request, params),
      POST: async ({ request, params }) => forward(request, params),
    },
  },
});
