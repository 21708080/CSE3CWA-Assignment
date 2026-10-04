import { prisma } from "@/lib/prisma";
import { badRequest, readJsonObject, serverError } from "@/lib/http";

export async function GET() {
  try {
    const wordLists = await prisma.wordList.findMany({
      include: {
        _count: { select: { words: true, activities: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(wordLists);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return badRequest("name is required");

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  try {
    const wordList = await prisma.wordList.create({ data: { name, description } });
    return Response.json(wordList, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
