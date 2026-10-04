import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      wordLists,
      activities,
      wordleActivities,
      wordSearchActivities,
      successful,
      failed,
      wordleUses,
      wordSearchUses,
      pageTiming,
      recentFailures,
      emptyWordLists,
    ] = await Promise.all([
      prisma.wordList.count(),
      prisma.activity.count(),
      prisma.activity.count({ where: { type: "WORDLE" } }),
      prisma.activity.count({ where: { type: "WORD_SEARCH" } }),
      prisma.generationEvent.count({ where: { success: true } }),
      prisma.generationEvent.count({ where: { success: false } }),
      prisma.generationEvent.count({ where: { activityType: "WORDLE" } }),
      prisma.generationEvent.count({ where: { activityType: "WORD_SEARCH" } }),
      prisma.pageTiming.aggregate({
        _avg: { durationMs: true },
        _count: { _all: true },
      }),
      prisma.generationEvent.findMany({
        where: { success: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          activity: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.wordList.findMany({
        where: { words: { none: {} } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, name: true, updatedAt: true },
      }),
    ]);

    const mostUsedActivityType =
      wordleUses === 0 && wordSearchUses === 0
        ? "No usage yet"
        : wordleUses === wordSearchUses
          ? "Equal usage"
          : wordleUses > wordSearchUses
            ? "Wordle"
            : "Word Search";

    const generationWarnings = recentFailures.map((event) => ({
      id: `generation-${event.id}`,
      kind: "generation" as const,
      message: event.activity
        ? `${event.activity.name}: ${event.errorMessage ?? "Generation failed"}`
        : event.errorMessage ?? "Generation failed",
      createdAt: event.createdAt.toISOString(),
    }));

    const wordListWarnings = emptyWordLists.map((wordList) => ({
      id: `word-list-${wordList.id}`,
      kind: "word-list" as const,
      message: `${wordList.name} has no words and cannot produce a valid activity.`,
      createdAt: wordList.updatedAt.toISOString(),
    }));

    return Response.json(
      {
        summaries: {
          wordLists,
          activities,
          wordleActivities,
          wordSearchActivities,
        },
        generation: {
          successful,
          failed,
          totalAttempts: successful + failed,
          wordleUses,
          wordSearchUses,
          mostUsedActivityType,
        },
        pageTiming: {
          samples: pageTiming._count._all,
          averageDurationMs:
            pageTiming._avg.durationMs === null
              ? null
              : Math.round(pageTiming._avg.durationMs),
        },
        warnings: [...generationWarnings, ...wordListWarnings].slice(0, 8),
        generatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Metrics endpoint failed", error);
    return Response.json(
      { error: "Monitoring metrics could not be loaded" },
      { status: 500 }
    );
  }
}
