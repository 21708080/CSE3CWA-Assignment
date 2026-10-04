import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.wordList.count();

    return Response.json(
      {
        status: "ok",
        service: "phoneme-builder",
        database: "ok",
        responseTimeMs: Date.now() - startedAt,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Health check failed", error);

    return Response.json(
      {
        status: "error",
        service: "phoneme-builder",
        database: "error",
        responseTimeMs: Date.now() - startedAt,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
