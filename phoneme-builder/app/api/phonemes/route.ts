import { prisma } from "@/lib/prisma";
import { badRequest, readJsonObject, serverError } from "@/lib/http";

export async function GET() {
  try {
    const phonemes = await prisma.phoneme.findMany({ orderBy: { symbol: "asc" } });
    return Response.json(phonemes);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const symbol = typeof body.symbol === "string" ? body.symbol.trim() : "";
  const englishLabel =
    typeof body.englishLabel === "string" ? body.englishLabel.trim() : "";
  if (!symbol) return badRequest("symbol is required");
  if (!englishLabel) return badRequest("englishLabel is required");

  const example =
    typeof body.example === "string" && body.example.trim() ? body.example.trim() : null;

  try {
    const existing = await prisma.phoneme.findUnique({ where: { symbol }, select: { id: true } });
    if (existing) {
      return Response.json({ error: "A phoneme with this symbol already exists" }, { status: 409 });
    }

    const phoneme = await prisma.phoneme.create({
      data: { symbol, englishLabel, example },
    });
    return Response.json(phoneme, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
