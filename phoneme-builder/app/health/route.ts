import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok", service: "phoneme-builder", database: "ok", statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return Response.json(
      { status: "error", service: "phoneme-builder", database: "error", statusCode: 503 },
      { status: 503 }
    );
  }
}
