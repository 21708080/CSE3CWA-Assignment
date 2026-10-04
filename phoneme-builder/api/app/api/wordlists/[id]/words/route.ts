import { prisma } from "@/lib/prisma";
import { badRequest, notFound, parseRouteId, readJsonObject, serverError } from "@/lib/http";
import { normalisePhonemes } from "@/lib/phoneme-input";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const wordListId = parseRouteId(rawId);
  if (!wordListId) return badRequest("Invalid word list id");

  try {
    const list = await prisma.wordList.findUnique({ where: { id: wordListId }, select: { id: true } });
    if (!list) return notFound("Word list");

    const words = await prisma.word.findMany({
      where: { wordListId },
      include: {
        phonemes: {
          include: { phoneme: true },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(words);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const wordListId = parseRouteId(rawId);
  if (!wordListId) return badRequest("Invalid word list id");

  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const englishWord = typeof body.englishWord === "string" ? body.englishWord.trim() : "";
  if (!englishWord) return badRequest("englishWord is required");

  const hint =
    typeof body.hint === "string" && body.hint.trim() ? body.hint.trim() : null;

  const phonemes = normalisePhonemes(body.phonemes);
  if (!phonemes) {
    return badRequest("phonemes must be a non-empty array of symbols or phoneme objects");
  }

  try {
    const list = await prisma.wordList.findUnique({ where: { id: wordListId }, select: { id: true } });
    if (!list) return notFound("Word list");

    const word = await prisma.word.create({
      data: {
        englishWord,
        hint,
        wordListId,
        phonemes: {
          create: phonemes.map((item, position) => ({
            position,
            phoneme: {
              connectOrCreate: {
                where: { symbol: item.symbol },
                create: {
                  symbol: item.symbol,
                  englishLabel: item.englishLabel,
                  example: item.example,
                },
              },
            },
          })),
        },
      },
      include: {
        phonemes: {
          include: { phoneme: true },
          orderBy: { position: "asc" },
        },
      },
    });

    return Response.json(word, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
