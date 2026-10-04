import { prisma } from "@/lib/prisma";
import { badRequest, notFound, parseRouteId, readJsonObject, serverError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };
type ThemeMode = "LIGHT" | "DARK" | "SYSTEM";

type StylePatch = {
  themeMode?: ThemeMode;
  accentColor?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  fontScale?: number;
  highContrast?: boolean;
  reducedMotion?: boolean;
  enhancedFocus?: boolean;
  largeControls?: boolean;
  customCss?: string | null;
};

const DEFAULT_STYLE = {
  themeMode: "LIGHT" as ThemeMode,
  accentColor: "#e11d48",
  backgroundColor: "#ffe4e7",
  textColor: "#0f172a",
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  enhancedFocus: true,
  largeControls: false,
  customCss: null as string | null,
};

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "LIGHT" || value === "DARK" || value === "SYSTEM";
}

function parseColor(value: unknown, field: string): string | null | undefined | Response {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value.trim())) {
    return badRequest(`${field} must be a 6-digit hex colour such as #e11d48 or null`);
  }
  return value.trim();
}

function parseBoolean(value: unknown, field: string): boolean | undefined | Response {
  if (value === undefined) return undefined;
  return typeof value === "boolean" ? value : badRequest(`${field} must be boolean`);
}

function parseCustomCss(value: unknown): string | null | undefined | Response {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return badRequest("customCss must be a string or null");
  if (value.length > 12000) return badRequest("customCss must be 12000 characters or fewer");
  if (/<|@import|javascript:|expression\s*\(/i.test(value)) {
    return badRequest("customCss contains unsupported or unsafe CSS content");
  }
  return value;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid activity id");

  try {
    const activity = await prisma.activity.findUnique({
      where: { id },
      select: { id: true, style: true },
    });
    if (!activity) return notFound("Activity");

    return Response.json(
      activity.style ?? { id: null, activityId: id, ...DEFAULT_STYLE }
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseRouteId(rawId);
  if (!id) return badRequest("Invalid activity id");

  const body = await readJsonObject(request);
  if (!body) return badRequest("Request body must be valid JSON");

  const patch: StylePatch = {};

  if (body.themeMode !== undefined) {
    if (!isThemeMode(body.themeMode)) return badRequest("themeMode must be LIGHT, DARK or SYSTEM");
    patch.themeMode = body.themeMode;
  }

  for (const field of ["accentColor", "backgroundColor", "textColor"] as const) {
    const parsed = parseColor(body[field], field);
    if (parsed instanceof Response) return parsed;
    if (parsed !== undefined) patch[field] = parsed;
  }

  if (body.fontScale !== undefined) {
    if (typeof body.fontScale !== "number" || !Number.isFinite(body.fontScale) || body.fontScale < 0.8 || body.fontScale > 1.6) {
      return badRequest("fontScale must be a number between 0.8 and 1.6");
    }
    patch.fontScale = body.fontScale;
  }

  for (const field of ["highContrast", "reducedMotion", "enhancedFocus", "largeControls"] as const) {
    const parsed = parseBoolean(body[field], field);
    if (parsed instanceof Response) return parsed;
    if (parsed !== undefined) patch[field] = parsed;
  }

  const customCss = parseCustomCss(body.customCss);
  if (customCss instanceof Response) return customCss;
  if (customCss !== undefined) patch.customCss = customCss;

  if (Object.keys(patch).length === 0) return badRequest("No supported style fields were provided");

  try {
    const activity = await prisma.activity.findUnique({ where: { id }, select: { id: true } });
    if (!activity) return notFound("Activity");

    const style = await prisma.activityStyle.upsert({
      where: { activityId: id },
      create: { activityId: id, ...DEFAULT_STYLE, ...patch },
      update: patch,
    });

    return Response.json(style);
  } catch (error) {
    return serverError(error);
  }
}
