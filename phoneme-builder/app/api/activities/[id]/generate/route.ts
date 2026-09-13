import { prisma } from "@/lib/prisma";
import { buildActivityHtml } from "@/lib/activity-html";
import { applyActivityStyle } from "@/lib/activity-style";
import { badRequest, notFound, parseRouteId, serverError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

function downloadFilename(name: string, id: number): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 60);

  return `${slug || `activity-${id}`}.html`;
}

export async function POST(_request: Request, context: RouteContext) {
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

    if (!activity) return notFound("Activity");

    if (activity.wordList.words.length === 0) {
      return Response.json(
        { error: "The activity word list has no words" },
        { status: 422 }
      );
    }

    const wordWithoutPhonemes = activity.wordList.words.find(
      (word) => word.phonemes.length === 0
    );

    if (wordWithoutPhonemes) {
      return Response.json(
        { error: `Word \"${wordWithoutPhonemes.englishWord}\" has no phonemes` },
        { status: 422 }
      );
    }

    const baseHtml = buildActivityHtml(activity);
    const html = applyActivityStyle(baseHtml, activity.style);
    const filename = downloadFilename(activity.name, activity.id);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Activity-Type": activity.type,
        "X-Activity-Theme": activity.style?.themeMode ?? "LIGHT",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
