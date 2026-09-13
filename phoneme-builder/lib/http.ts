export type JsonObject = Record<string, unknown>;

export async function readJsonObject(request: Request): Promise<JsonObject | null> {
  try {
    const value: unknown = await request.json();
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return null;
    }
    return value as JsonObject;
  } catch {
    return null;
  }
}

export function parseRouteId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function parsePositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function notFound(resource: string) {
  return Response.json({ error: ` not found` }, { status: 404 });
}

export function serverError(error: unknown) {
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
