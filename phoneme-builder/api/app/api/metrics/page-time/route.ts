import { prisma } from "@/lib/prisma";
import { badRequest, readJsonObject, serverError } from "@/lib/http";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const path = typeof body.path === "string" ? body.path.trim() : "";
  const durationMs =
    typeof body.durationMs === "number" && Number.isFinite(body.durationMs)
      ? Math.round(body.durationMs)
      : 0;

  if (!path || !path.startsWith("/") || path.length > 200) {
    return badRequest("path must be an application path of 200 characters or fewer");
  }

  if (durationMs < 1000 || durationMs > 21_600_000) {
    return badRequest("durationMs must be between 1000 and 21600000");
  }

  try {
    const timing = await prisma.pageTiming.create({
      data: { path, durationMs },
      select: { id: true },
    });

    return Response.json({ recorded: true, id: timing.id }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
