import { prisma } from "@/lib/prisma";
import { badRequest, notFound, parsePositiveInteger, parseRouteId, readJsonObject, serverError } from "@/lib/http";
import { normalisePhonemes, type PhonemeInput } from "@/lib/phoneme-input";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid word id");

  try {
    const word = await prisma.word.findUnique({
      where: { id },
      include: {
        wordList: true,
        phonemes: {
          include: { phoneme: true },
          orderBy: { position: "asc" },
        },
      },
    });
    return word ? Response.json(word) : notFound("Word");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid word id");

  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const englishWord =
    body.englishWord === undefined
      ? undefined
      : typeof body.englishWord === "string"
        ? body.englishWord.trim()
        : "";
  if (englishWord === "") return badRequest("englishWord must be a non-empty string");

  const hint =
    body.hint === undefined
      ? undefined
      : typeof body.hint === "string" && body.hint.trim()
        ? body.hint.trim()
        : null;

  let wordListId: number | undefined;
  if (body.wordListId !== undefined) {
    const parsedWordListId = parsePositiveInteger(body.wordListId);
    if (!parsedWordListId) {
      return badRequest("wordListId must be a positive integer");
    }
    wordListId = parsedWordListId;
  }

  let phonemes: PhonemeInput[] | undefined;
  if (body.phonemes !== undefined) {
    const parsedPhonemes = normalisePhonemes(body.phonemes);
    if (!parsedPhonemes) {
      return badRequest("phonemes must be a non-empty array of symbols or phoneme objects");
    }
    phonemes = parsedPhonemes;
  }

  if (
    englishWord === undefined &&
    hint === undefined &&
    wordListId === undefined &&
    phonemes === undefined
  ) {
    return badRequest("No supported fields were provided");
  }

  try {
    const existing = await prisma.word.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("Word");

    if (wordListId !== undefined) {
      const list = await prisma.wordList.findUnique({ where: { id: wordListId }, select: { id: true } });
      if (!list) return notFound("Word list");
    }

    const word = await prisma.word.update({
      where: { id },
      data: {
        ...(englishWord !== undefined ? { englishWord } : {}),
        ...(hint !== undefined ? { hint } : {}),
        ...(wordListId !== undefined ? { wordList: { connect: { id: wordListId } } } : {}),
        ...(phonemes !== undefined
          ? {
              phonemes: {
                deleteMany: {},
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
            }
          : {}),
      },
      include: {
        phonemes: {
          include: { phoneme: true },
          orderBy: { position: "asc" },
        },
      },
    });

    return Response.json(word);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid word id");

  try {
    const existing = await prisma.word.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("Word");

    await prisma.word.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError(error);
  }
}
