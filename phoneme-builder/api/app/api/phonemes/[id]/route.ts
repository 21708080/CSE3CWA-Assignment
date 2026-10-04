import { prisma } from "@/lib/prisma";
import { badRequest, notFound, parseRouteId, readJsonObject, serverError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid phoneme id");

  try {
    const phoneme = await prisma.phoneme.findUnique({
      where: { id },
      include: { _count: { select: { words: true } } },
    });
    return phoneme ? Response.json(phoneme) : notFound("Phoneme");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid phoneme id");

  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const symbol =
    body.symbol === undefined
      ? undefined
      : typeof body.symbol === "string"
        ? body.symbol.trim()
        : "";
  const englishLabel =
    body.englishLabel === undefined
      ? undefined
      : typeof body.englishLabel === "string"
        ? body.englishLabel.trim()
        : "";
  const example =
    body.example === undefined
      ? undefined
      : typeof body.example === "string" && body.example.trim()
        ? body.example.trim()
        : null;

  if (symbol === "") return badRequest("symbol must be a non-empty string");
  if (englishLabel === "") return badRequest("englishLabel must be a non-empty string");
  if (symbol === undefined && englishLabel === undefined && example === undefined) {
    return badRequest("No supported fields were provided");
  }

  try {
    const existing = await prisma.phoneme.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("Phoneme");

    if (symbol !== undefined) {
      const duplicate = await prisma.phoneme.findFirst({
        where: { symbol, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        return Response.json({ error: "A phoneme with this symbol already exists" }, { status: 409 });
      }
    }

    const phoneme = await prisma.phoneme.update({
      where: { id },
      data: {
        ...(symbol !== undefined ? { symbol } : {}),
        ...(englishLabel !== undefined ? { englishLabel } : {}),
        ...(example !== undefined ? { example } : {}),
      },
    });
    return Response.json(phoneme);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid phoneme id");

  try {
    const phoneme = await prisma.phoneme.findUnique({ where: { id }, select: { id: true } });
    if (!phoneme) return notFound("Phoneme");

    const usageCount = await prisma.wordPhoneme.count({ where: { phonemeId: id } });
    if (usageCount > 0) {
      return Response.json(
        { error: "Phoneme is used by one or more words and cannot be deleted" },
        { status: 409 }
      );
    }

    await prisma.phoneme.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError(error);
  }
}
