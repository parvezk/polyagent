export const NextResponse = {
  json(body: unknown, init?: ResponseInit): Response {
    const headers = new Headers(init?.headers);
    headers.set("content-type", "application/json");

    return new Response(JSON.stringify(body), {
      ...init,
      headers,
    });
  },
  redirect(url: string | URL, init?: number | ResponseInit): Response {
    const status =
      typeof init === "number" ? init : ((init as ResponseInit | undefined)?.status ?? 307);
    const headers = new Headers(typeof init === "object" && init ? init.headers : undefined);
    headers.set("Location", String(url));
    return new Response(null, { status, headers });
  },
};
