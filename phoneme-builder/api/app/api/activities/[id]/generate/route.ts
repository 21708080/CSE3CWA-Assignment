import { prisma } from "@/lib/prisma";
import { buildActivityHtml } from "@/lib/activity-html";
import { applyActivityStyle } from "@/lib/activity-style";
import { badRequest, notFound, parseRouteId, serverError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };
type ActivityType = "WORDLE" | "WORD_SEARCH";

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

async function recordGeneration(
  activityId: number | null,
  activityType: ActivityType | null,
  success: boolean,
  errorMessage: string | null
) {
  try {
    await prisma.generationEvent.create({
      data: {
        activityId,
        activityType,
        success,
        errorMessage,
      },
    });
  } catch (error) {
    console.error("Could not record generation metric", error);
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);

  if (!id) {
    await recordGeneration(null, null, false, "Invalid activity id");
    return badRequest("Invalid activity id");
  }

  let metricActivityId: number | null = null;
  let metricActivityType: ActivityType | null = null;

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

    if (!activity) {
      await recordGeneration(null, null, false, `Activity ${id} not found`);
      return notFound("Activity");
    }

    metricActivityId = activity.id;
    metricActivityType = activity.type;

    if (activity.wordList.words.length === 0) {
      const message = "The activity word list has no words";
      await recordGeneration(metricActivityId, metricActivityType, false, message);
      return Response.json({ error: message }, { status: 422 });
    }

    const wordWithoutPhonemes = activity.wordList.words.find(
      (word) => word.phonemes.length === 0
    );

    if (wordWithoutPhonemes) {
      const message = `Word "${wordWithoutPhonemes.englishWord}" has no phonemes`;
      await recordGeneration(metricActivityId, metricActivityType, false, message);
      return Response.json({ error: message }, { status: 422 });
    }

    const baseHtml = buildActivityHtml(activity);
    const html = applyActivityStyle(baseHtml, activity.style);
    const filename = downloadFilename(activity.name, activity.id);

    await recordGeneration(metricActivityId, metricActivityType, true, null);

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
    const message = error instanceof Error ? error.message : "Internal server error";
    await recordGeneration(metricActivityId, metricActivityType, false, message);
    return serverError(error);
  }
}
