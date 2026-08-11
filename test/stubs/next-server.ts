export const NextResponse = {
  json(body: unknown, init?: ResponseInit): Response {
    return Response.json(body, init);
  },
};
