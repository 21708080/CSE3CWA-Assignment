import { prisma } from "@/lib/prisma";
import { badRequest, notFound, parsePositiveInteger, parseRouteId, readJsonObject, serverError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

function isActivityType(value: unknown): value is "WORDLE" | "WORD_SEARCH" {
  return value === "WORDLE" || value === "WORD_SEARCH";
}

function isDifficulty(value: unknown): value is "EASY" | "MEDIUM" | "HARD" {
  return value === "EASY" || value === "MEDIUM" || value === "HARD";
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid activity id");

  try {
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        style: true,
        wordList: {
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
          },
        },
      },
    });
    return activity ? Response.json(activity) : notFound("Activity");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid activity id");

  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const name =
    body.name === undefined
      ? undefined
      : typeof body.name === "string"
        ? body.name.trim()
        : "";
  if (name === "") return badRequest("name must be a non-empty string");

  if (body.type !== undefined && !isActivityType(body.type)) {
    return badRequest("type must be WORDLE or WORD_SEARCH");
  }
  if (body.difficulty !== undefined && !isDifficulty(body.difficulty)) {
    return badRequest("difficulty must be EASY, MEDIUM or HARD");
  }

  let wordListId: number | undefined;
  if (body.wordListId !== undefined) {
    const parsedWordListId = parsePositiveInteger(body.wordListId);
    if (!parsedWordListId) {
      return badRequest("wordListId must be a positive integer");
    }
    wordListId = parsedWordListId;
  }

  const hintsEnabled =
    body.hintsEnabled === undefined
      ? undefined
      : typeof body.hintsEnabled === "boolean"
        ? body.hintsEnabled
        : null;
  if (hintsEnabled === null) return badRequest("hintsEnabled must be boolean");

  const showEnglishAnswer =
    body.showEnglishAnswer === undefined
      ? undefined
      : typeof body.showEnglishAnswer === "boolean"
        ? body.showEnglishAnswer
        : null;
  if (showEnglishAnswer === null) return badRequest("showEnglishAnswer must be boolean");

  const maxAttempts =
    body.maxAttempts === undefined
      ? undefined
      : body.maxAttempts === null
        ? null
        : parsePositiveInteger(body.maxAttempts);
  if (body.maxAttempts !== undefined && body.maxAttempts !== null && !maxAttempts) {
    return badRequest("maxAttempts must be a positive integer or null");
  }

  const gridSize =
    body.gridSize === undefined
      ? undefined
      : body.gridSize === null
        ? null
        : parsePositiveInteger(body.gridSize);
  if (body.gridSize !== undefined && body.gridSize !== null && !gridSize) {
    return badRequest("gridSize must be a positive integer or null");
  }

  if (
    name === undefined &&
    body.type === undefined &&
    body.difficulty === undefined &&
    wordListId === undefined &&
    hintsEnabled === undefined &&
    showEnglishAnswer === undefined &&
    maxAttempts === undefined &&
    gridSize === undefined
  ) {
    return badRequest("No supported fields were provided");
  }

  try {
    const existing = await prisma.activity.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("Activity");

    if (wordListId !== undefined) {
      const list = await prisma.wordList.findUnique({ where: { id: wordListId }, select: { id: true } });
      if (!list) return notFound("Word list");
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
        ...(wordListId !== undefined ? { wordList: { connect: { id: wordListId } } } : {}),
        ...(hintsEnabled !== undefined ? { hintsEnabled } : {}),
        ...(showEnglishAnswer !== undefined ? { showEnglishAnswer } : {}),
        ...(maxAttempts !== undefined ? { maxAttempts } : {}),
        ...(gridSize !== undefined ? { gridSize } : {}),
      },
      include: { wordList: true, style: true },
    });

    return Response.json(activity);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid activity id");

  try {
    const existing = await prisma.activity.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("Activity");

    await prisma.activity.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError(error);
  }
}
