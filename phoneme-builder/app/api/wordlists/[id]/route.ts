import { prisma } from "@/lib/prisma";
import { badRequest, notFound, parseRouteId, readJsonObject, serverError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid word list id");

  try {
    const wordList = await prisma.wordList.findUnique({
      where: { id },
      include: {
        words: {
          include: {
            phonemes: {
              include: { phoneme: true },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });

    return wordList ? Response.json(wordList) : notFound("Word list");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid word list id");

  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const name =
    body.name === undefined
      ? undefined
      : typeof body.name === "string"
        ? body.name.trim()
        : "";
  if (name === "") return badRequest("name must be a non-empty string");

  const description =
    body.description === undefined
      ? undefined
      : typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;

  if (name === undefined && description === undefined) {
    return badRequest("Provide name and/or description to update");
  }

  try {
    const existing = await prisma.wordList.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("Word list");

    const wordList = await prisma.wordList.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });
    return Response.json(wordList);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid word list id");

  try {
    const existing = await prisma.wordList.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("Word list");

    await prisma.wordList.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError(error);
  }
}
