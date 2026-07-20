export const NextResponse = {
  json(body: unknown, init?: ResponseInit): Response {
    const headers = new Headers(init?.headers);
    headers.set("content-type", "application/json");

    return new Response(JSON.stringify(body), {
      ...init,
      headers,
    });
  },
};
