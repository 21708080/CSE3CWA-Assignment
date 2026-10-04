import { prisma } from "@/lib/prisma";
import { badRequest, parsePositiveInteger, readJsonObject, serverError } from "@/lib/http";

function isActivityType(value: unknown): value is "WORDLE" | "WORD_SEARCH" {
  return value === "WORDLE" || value === "WORD_SEARCH";
}

function isDifficulty(value: unknown): value is "EASY" | "MEDIUM" | "HARD" {
  return value === "EASY" || value === "MEDIUM" || value === "HARD";
}

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      include: { wordList: true, style: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(activities);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return badRequest("name is required");
  if (!isActivityType(body.type)) return badRequest("type must be WORDLE or WORD_SEARCH");
  if (!isDifficulty(body.difficulty)) return badRequest("difficulty must be EASY, MEDIUM or HARD");

  const wordListId = parsePositiveInteger(body.wordListId);
  if (!wordListId) return badRequest("wordListId must be a positive integer");

  const hintsEnabled = typeof body.hintsEnabled === "boolean" ? body.hintsEnabled : true;
  const showEnglishAnswer =
    typeof body.showEnglishAnswer === "boolean" ? body.showEnglishAnswer : true;
  const maxAttempts = body.maxAttempts === undefined || body.maxAttempts === null
    ? null
    : parsePositiveInteger(body.maxAttempts);
  const gridSize = body.gridSize === undefined || body.gridSize === null
    ? null
    : parsePositiveInteger(body.gridSize);

  if (body.maxAttempts !== undefined && body.maxAttempts !== null && !maxAttempts) {
    return badRequest("maxAttempts must be a positive integer or null");
  }
  if (body.gridSize !== undefined && body.gridSize !== null && !gridSize) {
    return badRequest("gridSize must be a positive integer or null");
  }

  try {
    const list = await prisma.wordList.findUnique({ where: { id: wordListId }, select: { id: true } });
    if (!list) return Response.json({ error: "Word list not found" }, { status: 404 });

    const activity = await prisma.activity.create({
      data: {
        name,
        type: body.type,
        difficulty: body.difficulty,
        hintsEnabled,
        showEnglishAnswer,
        maxAttempts,
        gridSize,
        wordListId,
      },
      include: { wordList: true, style: true },
    });
    return Response.json(activity, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
